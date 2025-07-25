'use client';

import React, { useState, useEffect } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { DocumentSidebar } from '../components/DocumentSidebar';
import { Document } from '../types/documents';
import { ChatMessage, MessageRole, SendMessageRequest } from '../types/chat';
import { Orchestrator } from '../agents/Orchestrator';
import { loadAllDocuments } from '../lib/document-loader';

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [orchestrator, setOrchestrator] = useState<Orchestrator | null>(null);
  const [currentSessionId] = useState(`session_${Date.now()}`);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize the multi-agent system
  useEffect(() => {
    async function initializeSystem() {
      try {
        // Load all documents dynamically
        const allDocuments = loadAllDocuments();
        setDocuments(allDocuments);
        
        // Initialize orchestrator
        const orch = new Orchestrator();
        await orch.initialize();
        
        // Process documents (simulate - in real implementation this would extract actual PDF text)
        await orch.processDocuments(allDocuments);
        
        setOrchestrator(orch);
        console.log(`✅ Initialized multi-agent system with ${allDocuments.length} documents`);
      } catch (error) {
        console.error('❌ Failed to initialize system:', error);
      } finally {
        setIsInitializing(false);
      }
    }
    
    initializeSystem();
  }, []);

  // Real multi-agent system handler
  const handleSendMessage = async (request: SendMessageRequest): Promise<ChatMessage> => {
    if (!orchestrator) {
      throw new Error('System not initialized');
    }

    try {
      // Use the real orchestrator
      const result = await orchestrator.execute({
        query: request.content,
        sessionId: request.sessionId || currentSessionId,
        availableDocuments: documents, // Pass available documents for processing
        options: {
          maxResults: 10,
          searchThreshold: 0.7,
          includeSteps: true,
          enableMemory: true
        }
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Convert orchestrator output to chat message
      const response: ChatMessage = {
        id: `assistant_${Date.now()}`,
        content: result.data.response,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
        sessionId: request.sessionId || currentSessionId,
        citations: result.data.citations,
        metadata: {
          processingTimeMs: result.data.totalTimeMs,
          sources: result.data.citations.map(c => c.documentTitle),
          confidence: 0.85
        }
      };

      return response;
    } catch (_error) {
      // Fallback error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: `I apologize, but I encountered an error while analyzing your question: "${request.content}". 

This could be due to:
- OpenAI API connectivity issues
- Document processing limitations
- System initialization problems

Please try rephrasing your question or try again in a moment. The system contains ${documents.length} documents about Sarepta's Elevidys gene therapy that I can analyze.`,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
        sessionId: request.sessionId || currentSessionId,
        metadata: {
          processingTimeMs: 0,
          confidence: 0
        }
      };
      
      return errorMessage;
    }
  };

  const handleDocumentSelect = (document: Document) => {
    console.log('Selected document:', document);
    // Could implement document highlighting or context injection here
  };

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing Sarepta Analysis Framework
          </h2>
          <p className="text-gray-600">
            Loading {documents.length > 0 ? documents.length : '45+'} documents and starting multi-agent system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Document Sidebar */}
      <DocumentSidebar 
        documents={documents}
        onDocumentSelect={handleDocumentSelect}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          onSendMessage={handleSendMessage}
          sessionId={currentSessionId}
        />
      </div>
    </div>
  );
}
