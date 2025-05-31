// apps/web/app/components/PostCard.tsx
'use client';

import ImagePreview from './ImagePreview';

interface GeneratedPost {
  _id: string;
  templateId: string;
  content: string;
  hashtags: string[];
  imageUrl?: string;
  imagePrompt?: string;
  imageStatus?: 'generating' | 'generated' | 'failed';
  videoUrl?: string;
  status: 'generating' | 'generated' | 'scheduled' | 'pending_review' | 'approved' | 'rejected' | 'publishing' | 'published' | 'failed' | 'cancelled';
  generatedAt: string;
  reviewedAt?: string;
  publishedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

interface PostCardProps {
  post: GeneratedPost;
  onApprove: (postId: string) => void;
  onReject: (postId: string) => void;
  onRegenerate: (templateId: string) => void;
  onPublish: (postId: string) => void;
  isGenerating?: boolean;
}

export default function PostCard({ 
  post, 
  onApprove, 
  onReject, 
  onRegenerate, 
  onPublish,
  isGenerating = false 
}: PostCardProps) {
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: GeneratedPost['status']): string => {
    const colors: Record<GeneratedPost['status'], string> = {
      'generating': 'bg-blue-100 text-blue-800',
      'generated': 'bg-green-100 text-green-800',
      'scheduled': 'bg-indigo-100 text-indigo-800',
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'publishing': 'bg-purple-100 text-purple-800',
      'published': 'bg-violet-100 text-violet-800',
      'failed': 'bg-rose-100 text-rose-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: GeneratedPost['status']): string => {
    const icons: Record<GeneratedPost['status'], string> = {
      'generating': '🔄',
      'generated': '✅',
      'scheduled': '📅',
      'pending_review': '👁️',
      'approved': '✅',
      'rejected': '❌',
      'publishing': '📤',
      'published': '🚀',
      'failed': '💥',
      'cancelled': '🚫'
    };
    return icons[status] || '❓';
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors bg-white shadow-sm">
      {/* Header with Status and Date */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
          {getStatusIcon(post.status)} {post.status.replace('_', ' ').toUpperCase()}
        </span>
        <span className="text-sm text-gray-500">
          {formatDate(post.generatedAt)}
        </span>
      </div>

      {/* Content Layout */}
      <div className="p-4">
        <div className={`${post.imageUrl ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}`}>
          
          {/* Text Content */}
          <div className="space-y-3">
            {/* Post Content */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Content:</h4>
              <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
            
            {/* Hashtags */}
            {post.hashtags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Hashtags:</h4>
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map((hashtag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      #{hashtag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Media Indicators */}
            <div className="flex space-x-2">
              {post.imageUrl && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  🖼️ Image Generated
                </span>
              )}
              {post.videoUrl && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  🎥 Video Attached
                </span>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {post.imageUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Image:</h4>
              <ImagePreview
                imageUrl={post.imageUrl}
                imageStatus={post.imageStatus}
                imagePrompt={post.imagePrompt}
                alt={`Generated image for post ${post._id}`}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Error Message */}
        {post.errorMessage && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800">Error Details:</h4>
                <p className="text-sm text-red-600 mt-1">{post.errorMessage}</p>
                {post.retryCount > 0 && (
                  <p className="text-xs text-red-500 mt-1">Retry attempts: {post.retryCount}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Pending Review Actions */}
          {post.status === 'pending_review' && (
            <>
              <button
                onClick={() => onApprove(post._id)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => onReject(post._id)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                ❌ Reject
              </button>
            </>
          )}

          {/* Approved - Ready to Publish */}
          {post.status === 'approved' && (
            <button 
              onClick={() => onPublish(post._id)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              📱 Publish to Instagram
            </button>
          )}

          {/* Generated without Review */}
          {post.status === 'generated' && (
            <button 
              onClick={() => onPublish(post._id)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              📱 Publish to Instagram
            </button>
          )}

          {/* Failed/Rejected - Regenerate */}
          {(post.status === 'failed' || post.status === 'rejected') && (
            <button
              onClick={() => onRegenerate(post.templateId)}
              disabled={isGenerating}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? '🔄 Regenerating...' : '🔄 Regenerate'}
            </button>
          )}

          {/* Published Status */}
          {post.status === 'published' && (
            <div className="inline-flex items-center px-3 py-2 text-sm text-gray-500">
              🚀 Published {post.publishedAt && `on ${formatDate(post.publishedAt)}`}
            </div>
          )}

          {/* Copy Content Button */}
          <button
            onClick={() => {
              const content = post.content + '\n\n' + post.hashtags.map(h => `#${h}`).join(' ');
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(content)
                  .then(() => alert('📋 Content copied to clipboard!'))
                  .catch(() => alert('Failed to copy content'));
              } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('📋 Content copied to clipboard!');
              }
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            📋 Copy Content
          </button>
        </div>
      </div>
    </div>
  );
}