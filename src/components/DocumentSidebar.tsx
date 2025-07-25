'use client';

import React, { useState } from 'react';
import { FileText, Search, Filter, ExternalLink } from 'lucide-react';
import { Document, DocumentCategory } from '../types/documents';

interface DocumentSidebarProps {
  documents: Document[];
  onDocumentSelect?: (document: Document) => void;
}

export function DocumentSidebar({ documents, onDocumentSelect }: DocumentSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter documents based on search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group documents by category
  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, Document[]>);

  const getCategoryColor = (category: DocumentCategory): string => {
    switch (category) {
      case DocumentCategory.FDA:
        return 'bg-red-100 text-red-800 border-red-300';
      case DocumentCategory.SEC:
        return 'bg-green-100 text-green-800 border-green-300';
      case DocumentCategory.PUBLICATION:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case DocumentCategory.PRESS_REPORT:
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case DocumentCategory.ABSTRACT:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleDocumentClick = (document: Document) => {
    // Open PDF in new tab
    window.open(`pdf/${document.filename}`, '_blank');
    
    // Notify parent component
    onDocumentSelect?.(document);
  };

  const getCategoryCount = (category: DocumentCategory): number => {
    return documents.filter(doc => doc.category === category).length;
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isExpanded ? 'w-80' : 'w-12'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-gray-900 ${!isExpanded && 'hidden'}`}>
            Documents ({documents.length})
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <FileText className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Search and Filter */}
          <div className="p-4 space-y-3 border-b border-gray-200">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | 'all')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {Object.values(DocumentCategory).map(category => (
                  <option key={category} value={category}>
                    {category} ({getCategoryCount(category)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(documentsByCategory).map(([category, docs]) => (
              <div key={category} className="border-b border-gray-100">
                {/* Category Header */}
                <div className={`px-4 py-2 text-xs font-medium border-l-4 ${getCategoryColor(category as DocumentCategory)}`}>
                  {category} ({docs.length})
                </div>

                {/* Documents in Category */}
                <div className="space-y-1 p-2">
                  {docs.map(document => (
                    <button
                      key={document.id}
                      onClick={() => handleDocumentClick(document)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors
                               border border-transparent hover:border-gray-200 group"
                      title={document.filename}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {document.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {document.filename}
                          </div>
                          {document.size && (
                            <div className="text-xs text-gray-400 mt-1">
                              {(document.size / (1024 * 1024)).toFixed(1)} MB
                              {document.pages && ` • ${document.pages} pages`}
                            </div>
                          )}
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 
                                               transition-opacity flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredDocuments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No documents found</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Try adjusting your search terms</p>
                )}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600 space-y-1">
              <div>Showing {filteredDocuments.length} of {documents.length} documents</div>
              <div className="flex gap-3 flex-wrap">
                <span>FDA: {getCategoryCount(DocumentCategory.FDA)}</span>
                <span>Publications: {getCategoryCount(DocumentCategory.PUBLICATION)}</span>
                <span>Press: {getCategoryCount(DocumentCategory.PRESS_REPORT)}</span>
                <span>Abstracts: {getCategoryCount(DocumentCategory.ABSTRACT)}</span>
                <span>SEC: {getCategoryCount(DocumentCategory.SEC)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 