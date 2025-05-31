// apps/web/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import CreateTemplateModal from './components/CreateTemplateModal';
import PostCard from './components/PostCard';

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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
  details?: string;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch templates y generated posts en paralelo
      const [templatesRes, postsRes] = await Promise.all([
        fetch('/api/templates'),
        fetch('/api/generated-posts')
      ]);
      
      const templatesData: ApiResponse<PostTemplate[]> = await templatesRes.json();
      const postsData: ApiResponse<GeneratedPost[]> = await postsRes.json();
      
      if (templatesData.success) {
        setTemplates(templatesData.data);
      } else {
        console.error('Failed to fetch templates:', templatesData.error);
      }
      
      if (postsData.success) {
        setGeneratedPosts(postsData.data);
      } else {
        console.error('Failed to fetch posts:', postsData.error);
        // No es error crítico si no hay posts generados aún
        setGeneratedPosts([]);
      }
      
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: any) => {
    try {
      setIsCreatingTemplate(true);
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      const data: ApiResponse<PostTemplate> = await response.json();
      
      if (data.success) {
        // Refresh templates list
        await fetchData();
        setIsCreateModalOpen(false);
        alert('Template created successfully! 🎉');
      } else {
        alert(`Error creating template: ${data.error}`);
        console.error('Creation error:', data.details);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const generatePost = async (templateId: string) => {
    try {
      setGenerating(templateId);
      
      const response = await fetch('/api/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });
      
      const data: ApiResponse<GeneratedPost> = await response.json();
      
      if (data.success) {
        // Refresh generated posts para mostrar el nuevo
        await fetchData();
        
        // Mensaje más descriptivo basado en la respuesta
        const hasImage = data.data.imageUrl ? ' with image' : '';
        alert(`Post generated successfully${hasImage}! 🎉`);
      } else {
        alert(`Error generating post: ${data.error}`);
        console.error('Generation error:', data.details);
      }
    } catch (error) {
      console.error('Error generating post:', error);
      alert('Failed to generate post. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const approvePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/generated-posts/${postId}/approve`, {
        method: 'POST',
      });
      
      const data: ApiResponse<string> = await response.json();
      
      if (data.success) {
        await fetchData();
        alert('Post approved! ✅');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving post:', error);
      alert('Failed to approve post');
    }
  };

  const rejectPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/generated-posts/${postId}/reject`, {
        method: 'POST',
      });
      
      const data: ApiResponse<string> = await response.json();
      
      if (data.success) {
        await fetchData();
        alert('Post rejected ❌');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting post:', error);
      alert('Failed to reject post');
    }
  };

  const publishPost = async (postId: string) => {
    // Placeholder para Instagram integration
    alert('📱 Instagram integration coming soon! This will publish the post directly to your Instagram account.');
  };

  const regeneratePost = async (templateId: string) => {
    await generatePost(templateId);
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPostsByTemplate = (templateId: string): GeneratedPost[] => {
    return generatedPosts.filter(post => post.templateId === templateId);
  };

  // Early return if not mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button 
            onClick={fetchData}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const pendingReviewCount = generatedPosts.filter(p => p.status === 'pending_review').length;
  const approvedCount = generatedPosts.filter(p => p.status === 'approved').length;
  const publishedCount = generatedPosts.filter(p => p.status === 'published').length;
  const postsWithImages = generatedPosts.filter(p => p.imageUrl).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Social Automation Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your post templates and AI-generated content
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Templates</dt>
                    <dd className="text-lg font-medium text-gray-900">{templates.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{generatedPosts.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Generated Posts</dt>
                    <dd className="text-lg font-medium text-gray-900">{generatedPosts.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{pendingReviewCount}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingReviewCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{approvedCount}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">{approvedCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-pink-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{postsWithImages}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">With Images</dt>
                    <dd className="text-lg font-medium text-gray-900">{postsWithImages}</dd>
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
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first post template</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Create Your First Template
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {templates.map((template) => {
              const templatePosts = getPostsByTemplate(template._id);
              
              return (
                <div key={template._id} className="bg-white shadow rounded-lg overflow-hidden">
                  {/* Template Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{template.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.context}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="text-xs text-gray-500">
                            <strong>Target:</strong> {template.targetAudience}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {template.seoKeywords.slice(0, 3).map((keyword, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {keyword}
                              </span>
                            ))}
                            {template.seoKeywords.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{template.seoKeywords.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {template.needsImage && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            🎨 AI Image
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
                        <button
                          onClick={() => generatePost(template._id)}
                          disabled={generating === template._id}
                          className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded text-sm transition-colors flex items-center space-x-1"
                        >
                          {generating === template._id ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <span>✨</span>
                              <span>Generate Post</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generated Posts for this template using PostCard component */}
                  {templatePosts.length > 0 && (
                    <div className="px-6 py-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                        <span>Generated Posts ({templatePosts.length})</span>
                        {templatePosts.some(p => p.imageUrl) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            🎨 {templatePosts.filter(p => p.imageUrl).length} with images
                          </span>
                        )}
                      </h4>
                      <div className="space-y-4">
                        {templatePosts
                          .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                          .map((post) => (
                            <PostCard
                              key={post._id}
                              post={post}
                              onApprove={approvePost}
                              onReject={rejectPost}
                              onRegenerate={regeneratePost}
                              onPublish={publishPost}
                              isGenerating={generating === post.templateId}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createTemplate}
        isLoading={isCreatingTemplate}
      />
    </div>
  );
}