// app/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface PostTemplate {
  _id: string;
  title: string;
  seoKeywords: string[];
  context: string;
  targetAudience: string;
  links: string[];
  needsImage: boolean;
  needsVideo: boolean;
  needsReview: boolean;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  data: PostTemplate[];
  count: number;
  error?: string;
}

export default function Home() {
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      } else {
        setError(data.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button 
            onClick={fetchTemplates}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Social Automation Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your post templates and automation
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{templates.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Templates
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {templates.length} post templates configured
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-xl mb-4">No templates found</p>
              <p>Run the seed command to create sample templates:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">npm run db:seed</code>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div key={template._id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {template.title}
                    </h3>
                    <div className="flex space-x-1">
                      {template.needsImage && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          📷 Image
                        </span>
                      )}
                      {template.needsVideo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          🎥 Video
                        </span>
                      )}
                      {template.needsReview && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          👁️ Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.context}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Target Audience:</p>
                      <p className="text-sm text-gray-700">
                        {template.targetAudience}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">SEO Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.seoKeywords.slice(0, 4).map((keyword, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {keyword}
                          </span>
                        ))}
                        {template.seoKeywords.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{template.seoKeywords.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {template.links.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Links:</p>
                        <p className="text-xs text-blue-600">
                          {template.links.length} link{template.links.length > 1 ? 's' : ''} attached
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Created: {formatDate(template.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}