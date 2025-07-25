'use client';

import { useState } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  filename: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFViewer({ filename, title, isOpen, onClose }: PDFViewerProps) {
  const [viewerError, setViewerError] = useState(false);
  
  if (!isOpen) return null;

  const pdfUrl = `pdf/${encodeURIComponent(filename)}`;
  const downloadUrl = pdfUrl; // Same URL for download

  const handleIframeError = () => {
    setViewerError(true);
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
        <div className="flex-1 bg-gray-100">
          {!viewerError ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
              className="w-full h-full border-0"
              title={title}
              onError={handleIframeError}
              onLoad={(e) => {
                // Check if iframe loaded properly
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  if (!iframe.contentDocument && !iframe.contentWindow) {
                    setViewerError(true);
                  }
                } catch (error) {
                  setViewerError(true);
                }
              }}
            />
          ) : (
            // Fallback view when iframe fails
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <h3 className="text-lg font-semibold text-red-800 mb-2">PDF Viewer Unavailable</h3>
                <p className="text-red-600 mb-4">
                  Unable to display PDF in browser. This may be due to browser security settings or PDF format compatibility.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <ExternalLink size={16} />
                    <span>Open in New Tab</span>
                  </button>
                  <a
                    href={downloadUrl}
                    download={filename}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 