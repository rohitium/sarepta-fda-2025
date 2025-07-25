'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText } from 'lucide-react';
import { ChatMessage, MessageRole, SendMessageRequest, Citation } from '../types/chat';

interface ChatInterfaceProps {
  onSendMessage: (request: SendMessageRequest) => Promise<ChatMessage>;
  isLoading?: boolean;
  sessionId?: string;
}

export function ChatInterface({ onSendMessage, isLoading = false, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: input.trim(),
      role: MessageRole.USER,
      timestamp: new Date(),
      sessionId: sessionId || 'default'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const request: SendMessageRequest = {
        content: input.trim(),
        sessionId,
        options: {
          includeHistory: true,
          maxResults: 10,
          searchThreshold: 0.7
        }
      };

      const assistantMessage = await onSendMessage(request);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
        sessionId: sessionId || 'default'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCitation = (citation: Citation) => {
    return (
      <button
        key={citation.id}
        onClick={() => {
          // Use the URL from citation if available, otherwise construct it
          let pdfUrl = '';
          if (citation.url) {
            pdfUrl = citation.url;
          } else {
            // Fallback: construct URL from document ID
            pdfUrl = `/pdf/${encodeURIComponent(citation.documentId)}.pdf`;
          }
          
          // Open PDF in new tab
          window.open(pdfUrl, '_blank');
        }}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 
                   border border-blue-200 rounded-md text-blue-700 transition-colors"
        title={`${citation.documentTitle} - Pages ${citation.pageNumbers.join(', ')}`}
      >
        <FileText className="w-3 h-3" />
        {citation.shortName || `${citation.category} Doc`}
      </button>
    );
  };

  const renderMessageContent = (content: string, citations: Citation[] = [], isUserMessage: boolean = false) => {
    if (!citations || citations.length === 0 || isUserMessage) {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    // Create a map of citation short names to citation objects
    const citationMap = new Map<string, Citation>();
    citations.forEach(citation => {
      if (citation.shortName) {
        citationMap.set(citation.shortName, citation);
      }
    });

    // Parse inline citations and replace with clickable elements
    const parts = [];
    let lastIndex = 0;
    
    // Find all citations in the format [citation name] or [citation1, citation2]
    const citationRegex = /\[([^\]]+)\]/g;
    let match;
    
    while ((match = citationRegex.exec(content)) !== null) {
      // Add text before the citation
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      // Parse the citation(s) inside the brackets
      const citationText = match[1];
      const citationNames = citationText.split(',').map(name => name.trim());
      
      // Create clickable citation links
      const citationElements = citationNames.map((name, index) => {
        const citation = citationMap.get(name);
        if (citation) {
          return (
            <button
              key={`${citation.id}-${index}`}
              onClick={() => window.open(citation.url, '_blank')}
              className="inline-flex items-center px-1 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 
                         border border-blue-500 rounded text-white transition-colors mx-0.5"
              title={`${citation.documentTitle} - Pages ${citation.pageNumbers.join(', ')}`}
            >
              {name}
            </button>
          );
        }
        return <span key={index} className="text-blue-200">{name}</span>;
      });
      
      parts.push(
        <span key={match.index}>
          [{citationElements.reduce((acc, elem, index) => {
            if (index > 0) acc.push(<span key={`comma-${index}`} className="text-gray-300">, </span>);
            acc.push(elem);
            return acc;
          }, [] as React.ReactNode[])}]
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }
    
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, index) => 
          typeof part === 'string' ? <span key={index}>{part}</span> : part
        )}
      </div>
    );
  };

  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      className={`flex ${message.role === MessageRole.USER ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-3xl px-4 py-3 rounded-lg ${
          message.role === MessageRole.USER
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 border'
        }`}
      >
        {renderMessageContent(message.content, message.citations, message.role === MessageRole.USER)}
        
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="text-xs font-medium text-gray-700 mb-2">
              All Sources ({message.citations.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.map(renderCitation)}
            </div>
          </div>
        )}
        
        <div className="mt-2 text-xs opacity-70">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Sarepta FDA Analysis
        </h1>
        <p className="text-sm text-gray-600">
          Ask questions about Elevidys gene therapy documents
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Sarepta FDA Analysis
              </h2>
              <p className="text-gray-700 mb-4">
                Ask questions about Elevidys gene therapy based on FDA documents, clinical studies, press reports, and SEC filings.
              </p>
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-medium">Try asking:</p>
                <ul className="text-left space-y-1">
                  <li>• "What safety concerns were raised about Elevidys?"</li>
                  <li>• "What was the FDA's approval rationale?"</li>
                  <li>• "What were the clinical trial results?"</li>
                  <li>• "How did Sarepta respond to regulatory scrutiny?"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            {isProcessing && (
              <div className="flex justify-start mb-4">
                <div className="max-w-3xl px-4 py-3 rounded-lg bg-gray-100 border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-gray-600">Analyzing documents...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the Sarepta documents..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing || isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </form>
      </div>
    </div>
  );
} 