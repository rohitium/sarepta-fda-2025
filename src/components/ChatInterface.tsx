'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText } from 'lucide-react';
import { ChatMessage, MessageRole, SendMessageRequest, Citation } from '../types/chat';
import PDFViewer from './PDFViewer';

// Helper function to escape regex special characters
const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

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

    // Create numbered citation references based on citation order
    const citationNumbers = new Map<string, number>();
    citations.forEach((citation, index) => {
      const key = citation.shortName || citation.documentId;
      if (!citationNumbers.has(key)) {
        citationNumbers.set(key, index + 1);
      }
    });

    // Replace inline citations with numbered references
    let processedContent = content;
    
    // First, handle grouped citations in brackets [citation1, citation2, citation3]
    const groupedCitationRegex = /\[([^\]]+)\]/g;
    let groupMatch;
    const processedRanges: Array<{start: number, end: number, replacement: string}> = [];
    
    while ((groupMatch = groupedCitationRegex.exec(content)) !== null) {
      const citationGroup = groupMatch[1];
      const citationParts = citationGroup.split(',').map(part => part.trim());
      
      // Try to match each part to a citation
      const matchedNumbers: number[] = [];
      
      citationParts.forEach(part => {
        // Clean up the part (remove extra dots, trim whitespace)
        const cleanPart = part.replace(/\.+$/, '').trim();
        
        citations.forEach((citation, index) => {
          const citationNumber = index + 1;
          
          // More comprehensive identifier matching
          const possibleIdentifiers = [
            citation.shortName,
            citation.documentTitle,
            citation.documentId,
            citation.documentTitle?.substring(0, 30), // Try shorter substring
            citation.documentTitle?.substring(0, 50),
            citation.documentTitle?.split(' - ')[0],
            citation.documentTitle?.split(' - ')[1], // Also try part after dash
            citation.documentTitle?.split('.')[0],
            citation.documentTitle?.split(',')[0], // Try part before comma
            // Try key words from title
            ...citation.documentTitle?.split(' ').filter(word => word.length > 4) || []
          ].filter(Boolean);
          
          // More aggressive matching
          let isMatch = false;
          for (const identifier of possibleIdentifiers) {
            if (identifier) {
              const identifierLower = identifier.toLowerCase();
              const partLower = cleanPart.toLowerCase();
              
              // Try multiple matching strategies
              if (
                partLower.includes(identifierLower) || 
                identifierLower.includes(partLower) ||
                partLower.startsWith(identifierLower.substring(0, 15)) ||
                identifierLower.startsWith(partLower.substring(0, 15))
              ) {
                isMatch = true;
                break;
              }
            }
          }
          
          if (isMatch && !matchedNumbers.includes(citationNumber)) {
            matchedNumbers.push(citationNumber);
          }
        });
      });
      
      // Sort citation numbers in ascending order and prepare replacement
      if (matchedNumbers.length > 0) {
        matchedNumbers.sort((a, b) => a - b);
        const replacement = `[${matchedNumbers.join(', ')}]`;
        processedRanges.push({
          start: groupMatch.index,
          end: groupMatch.index + groupMatch[0].length,
          replacement: replacement
        });
      }
    }
    
    // Apply replacements from right to left to preserve indices
    processedRanges.sort((a, b) => b.start - a.start);
    processedRanges.forEach(range => {
      processedContent = processedContent.slice(0, range.start) + range.replacement + processedContent.slice(range.end);
    });
    
    // Fallback: Handle any remaining brackets with citation-like content
    const fallbackRegex = /\[([^\]]{20,})\]/g; // Brackets with 20+ characters (likely citations)
    let fallbackMatch;
    const fallbackRanges: Array<{start: number, end: number, replacement: string}> = [];
    
    while ((fallbackMatch = fallbackRegex.exec(processedContent)) !== null) {
      const longContent = fallbackMatch[1];
      
      // If this looks like citations (contains commas and document-like text)
      if (longContent.includes(',') && (
        longContent.toLowerCase().includes('fda') ||
        longContent.toLowerCase().includes('elevidys') ||
        longContent.toLowerCase().includes('gene therapy') ||
        longContent.toLowerCase().includes('review') ||
        longContent.toLowerCase().includes('memo') ||
        longContent.toLowerCase().includes('sarepta') ||
        longContent.toLowerCase().includes('duchenne')
      )) {
        // Try to find citation numbers for this content
        const fallbackNumbers: number[] = [];
        const contentParts = longContent.split(',').map(part => part.trim());
        
        contentParts.forEach(part => {
          citations.forEach((citation, index) => {
            const citationNumber = index + 1;
            if (citation.documentTitle && part.length > 10) {
              // Very aggressive matching for fallback
              const titleWords = citation.documentTitle.toLowerCase().split(' ');
              const partWords = part.toLowerCase().split(' ');
              
              // Check if there's significant word overlap
              const commonWords = titleWords.filter(word => 
                word.length > 3 && partWords.some(pWord => pWord.includes(word) || word.includes(pWord))
              );
              
              if (commonWords.length >= 2 && !fallbackNumbers.includes(citationNumber)) {
                fallbackNumbers.push(citationNumber);
              }
            }
          });
        });
        
        if (fallbackNumbers.length > 0) {
          fallbackNumbers.sort((a, b) => a - b);
          const replacement = `[${fallbackNumbers.join(', ')}]`;
          fallbackRanges.push({
            start: fallbackMatch.index,
            end: fallbackMatch.index + fallbackMatch[0].length,
            replacement: replacement
          });
        }
      }
    }
    
    // Apply fallback replacements
    fallbackRanges.sort((a, b) => b.start - a.start);
    fallbackRanges.forEach(range => {
      processedContent = processedContent.slice(0, range.start) + range.replacement + processedContent.slice(range.end);
    });

    // Parse content and make numbered citations clickable
    const parts = [];
    let lastIndex = 0;
    
    const numberRegex = /\[(\d+(?:[,\s]+\d+)*)\]/g;
    let match;
    
    while ((match = numberRegex.exec(processedContent)) !== null) {
      // Add text before the citation
      if (match.index > lastIndex) {
        parts.push(processedContent.slice(lastIndex, match.index));
      }
      
      // Parse the citation numbers inside the brackets
      const citationText = match[1];
      // Handle both comma-separated and space-separated numbers
      const citationNumbers = citationText
        .split(/[,\s]+/)
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num));
      
      // Sort citation numbers in ascending order for display
      citationNumbers.sort((a, b) => a - b);
      
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
                    {citation.pageNumbers.length > 0 && (
                      <span className="text-gray-600 ml-1">
                        (pp. {citation.pageNumbers.join(', ')})
                      </span>
                    )}
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