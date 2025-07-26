'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ChatMessage, MessageRole, SendMessageRequest, Citation } from '../types/chat';
import PDFViewer from './PDFViewer';



interface ChatInterfaceProps {
  onSendMessage: (request: SendMessageRequest) => Promise<ChatMessage>;
  isLoading?: boolean;
  sessionId?: string;
}

export function ChatInterface({ onSendMessage, isLoading = false, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedPDF, setSelectedPDF] = useState<{filename: string, title: string} | null>(null);
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



  const renderMessageContent = (content: string, citations: Citation[] = [], isUserMessage: boolean = false) => {
    if (!citations || citations.length === 0 || isUserMessage) {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    // Simple parsing since LLM generates clean numbered citations
    const parts = [];
    let lastIndex = 0;
    
    // Match numbered citations [1], [2, 3], [1, 5, 7], etc.
    const numberRegex = /\[(\d+(?:[,\s]+\d+)*)\]/g;
    let match;
    
    while ((match = numberRegex.exec(content)) !== null) {
      // Add text before the citation
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      
      // Parse the citation numbers inside the brackets
      const citationText = match[1];
      // Handle both comma-separated and space-separated numbers
      const citationNumbers = citationText
        .split(/[,\s]+/)
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b); // Ensure ascending order
      
      // Create clickable numbered citation links
      const citationElements = citationNumbers.map((num, index) => {
        const citation = citations[num - 1]; // Convert to 0-based index
        if (citation) {
          return (
            <button
              key={`${citation.id}-${index}`}
              onClick={() => {
                // Extract filename from citation data
                let filename = '';
                if (citation.url && citation.url.includes('/')) {
                  filename = decodeURIComponent(citation.url.split('/').pop() || '');
                } else {
                  filename = `${citation.documentId}.pdf`;
                }
                
                // Open PDF in viewer modal
                setSelectedPDF({
                  filename: filename,
                  title: citation.documentTitle
                });
              }}
              className="inline text-blue-600 hover:text-blue-800 font-medium"
              title={`${citation.documentTitle} - Pages ${citation.pageNumbers.join(', ')}`}
            >
              {num}
            </button>
          );
        }
        return <span key={index} className="text-gray-400">{num}</span>;
      });
      
      parts.push(
        <span key={match.index}>
          [{citationElements.reduce((acc, elem, index) => {
            if (index > 0) acc.push(<span key={`comma-${index}`} className="text-gray-600">, </span>);
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
          <div className="mt-4 pt-3 border-t border-gray-300">
            <div className="text-sm font-semibold text-gray-800 mb-3">
              References:
            </div>
            <div className="space-y-2">
              {message.citations.map((citation, index) => (
                <div key={citation.id} className="flex gap-2 text-sm">
                  <span className="text-gray-600 font-medium min-w-[1.5rem]">
                    [{index + 1}]
                  </span>
                  <button
                    onClick={() => {
                      // Extract filename from citation data
                      let filename = '';
                      if (citation.url && citation.url.includes('/')) {
                        filename = decodeURIComponent(citation.url.split('/').pop() || '');
                      } else {
                        filename = `${citation.documentId}.pdf`;
                      }
                      
                      // Open PDF in viewer modal
                      setSelectedPDF({
                        filename: filename,
                        title: citation.documentTitle
                      });
                    }}
                    className="text-left text-blue-700 hover:text-blue-900 hover:underline flex-1"
                    title={`Pages ${citation.pageNumbers.join(', ')}`}
                  >
                    <span className="font-medium">{citation.documentTitle}</span>
                  </button>
                </div>
              ))}
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
          Sarepta FDA 2025 RAG Agent
        </h1>
        <p className="text-sm text-gray-600">
          Chat with FDA documents, clinical studies, press reports, and SEC filings.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="max-w-md">
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-medium">Try asking:</p>
                <ul className="text-left space-y-1">
                  <li>• &quot;What safety concerns were raised about Elevidys?&quot;</li>
                  <li>• &quot;What was the FDA&apos;s approval rationale?&quot;</li>
                  <li>• &quot;What were the clinical trial results?&quot;</li>
                  <li>• &quot;How did Sarepta respond to regulatory scrutiny?&quot;</li>
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
                    <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
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
            placeholder="Where do we begin..."
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
      
      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <PDFViewer
          filename={selectedPDF.filename}
          title={selectedPDF.title}
          isOpen={!!selectedPDF}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  );
} 