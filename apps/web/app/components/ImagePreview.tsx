// apps/web/app/components/ImagePreview.tsx
'use client';

import { useState, useEffect } from 'react';

interface ImagePreviewProps {
  imageUrl?: string;
  imageStatus?: 'generating' | 'generated' | 'failed';
  imagePrompt?: string;
  alt?: string;
  className?: string;
}

export default function ImagePreview({ 
  imageUrl, 
  imageStatus, 
  imagePrompt, 
  alt = "Generated image",
  className = ""
}: ImagePreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Si no hay imagen o no está mounted, no mostrar nada
  if (!mounted || !imageUrl) {
    return null;
  }

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Status Badge */}
      {imageStatus && (
        <div className="absolute top-2 left-2 z-10">
          <span 
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
              imageStatus === 'generated' 
                ? 'bg-green-100 text-green-800' 
                : imageStatus === 'generating'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {imageStatus === 'generated' && '🎨 AI Generated'}
            {imageStatus === 'generating' && '🔄 Generating...'}
            {imageStatus === 'failed' && '⚠️ Fallback Image'}
          </span>
        </div>
      )}

      {/* Loading Skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}

      {/* Error State */}
      {imageError && (
        <div className="bg-gray-100 rounded-lg flex items-center justify-center h-48 border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <svg 
              className="w-8 h-8 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      <img
        src={imageUrl}
        alt={alt}
        className={`rounded-lg object-cover w-full transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ height: '192px' }} // h-48 equivalent
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Image Info Tooltip */}
      {imagePrompt && imageLoaded && (
        <div className="absolute bottom-2 right-2">
          <div className="group relative">
            <button className="bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Tooltip */}
            <div className="absolute bottom-8 right-0 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
              <p className="font-medium mb-1">Generated with prompt:</p>
              <p className="text-gray-300">{imagePrompt}</p>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      {/* Expiration Warning for DALL-E URLs */}
      {imageUrl.includes('oaidalleapi') && imageStatus === 'generated' && (
        <div className="absolute bottom-2 left-2">
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
            ⏰ Temporary (1h)
          </span>
        </div>
      )}
    </div>
  );
}