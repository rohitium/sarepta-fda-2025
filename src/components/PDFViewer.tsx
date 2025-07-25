'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  filename: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFViewer({ filename, title, isOpen, onClose }: PDFViewerProps) {
  const [viewerError, setViewerError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  if (!isOpen) return null;

  const pdfUrl = `pdf/${encodeURIComponent(filename)}`;
  const downloadUrl = pdfUrl; // Same URL for download

  // Automatically show fallback after a short delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setViewerError(true);
    }, 3000); // Show fallback after 3 seconds if iframe hasn't loaded

    return () => clearTimeout(timer);
  }, []);

  const handleIframeError = () => {
    setViewerError(true);
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Don't automatically set error on load - let the timer handle it
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open(downloadUrl, '_blank')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </button>
            <a
              href={downloadUrl}
              download={filename}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Download PDF"
            >
              <Download size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 bg-gray-100 relative">
          {!viewerError ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              )}
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={title}
                onError={handleIframeError}
                onLoad={handleIframeLoad}
              />
            </>
          ) : (
            // Fallback view when iframe fails
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-lg w-full">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ExternalLink size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Open PDF Document</h3>
                  <p className="text-blue-700 mb-1 font-medium">{title}</p>
                  <p className="text-blue-600 text-sm mb-6">
                    Click below to view this document. PDFs work best when opened directly in your browser or downloaded.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 font-medium"
                  >
                    <ExternalLink size={18} />
                    <span>Open in New Tab</span>
                  </button>
                  <a
                    href={downloadUrl}
                    download={filename}
                    className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2 font-medium no-underline"
                  >
                    <Download size={18} />
                    <span>Download PDF</span>
                  </a>
                  <p className="text-xs text-gray-500 mt-4">
                    Note: Some browsers may block PDF embedding for security reasons. 
                    Opening in a new tab provides the best viewing experience.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 