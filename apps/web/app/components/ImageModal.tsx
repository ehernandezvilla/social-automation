// apps/web/app/components/ImageModal.tsx
'use client';

import { useEffect } from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imagePrompt?: string;
  alt?: string;
}

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imagePrompt, 
  alt = "Generated image" 
}: ImageModalProps) {
  
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative max-w-7xl max-h-full mx-4 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
        />

        {/* Image Info */}
        {imagePrompt && (
          <div className="mt-4 bg-black bg-opacity-50 text-white p-4 rounded-lg max-w-2xl">
            <h4 className="font-medium mb-2">Generation Prompt:</h4>
            <p className="text-sm text-gray-300">{imagePrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
}