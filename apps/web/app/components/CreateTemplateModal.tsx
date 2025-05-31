// apps/web/components/CreateTemplateModal.tsx
'use client';

import { useState } from 'react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateData: any) => void;
  isLoading?: boolean;
}

interface TemplateFormData {
  title: string;
  context: string;
  targetAudience: string;
  seoKeywords: string;
  links: string;
  needsImage: boolean;
  needsVideo: boolean;
  needsReview: boolean;
}

export default function CreateTemplateModal({ isOpen, onClose, onSubmit, isLoading = false }: CreateTemplateModalProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    context: '',
    targetAudience: '',
    seoKeywords: '',
    links: '',
    needsImage: false,
    needsVideo: false,
    needsReview: true,
  });

  const [errors, setErrors] = useState<Partial<TemplateFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof TemplateFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TemplateFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.context.trim()) {
      newErrors.context = 'Context is required';
    } else if (formData.context.length < 10) {
      newErrors.context = 'Context must be at least 10 characters';
    } else if (formData.context.length > 2000) {
      newErrors.context = 'Context must be less than 2000 characters';
    }

    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required';
    } else if (formData.targetAudience.length < 5) {
      newErrors.targetAudience = 'Target audience must be at least 5 characters';
    } else if (formData.targetAudience.length > 500) {
      newErrors.targetAudience = 'Target audience must be less than 500 characters';
    }

    if (!formData.seoKeywords.trim()) {
      newErrors.seoKeywords = 'At least one SEO keyword is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Process form data
    const processedData = {
      title: formData.title.trim(),
      context: formData.context.trim(),
      targetAudience: formData.targetAudience.trim(),
      seoKeywords: formData.seoKeywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
        .slice(0, 20), // Max 20 keywords
      links: formData.links
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0)
        .slice(0, 10), // Max 10 links
      attachedDocs: [], // For future implementation
      needsImage: formData.needsImage,
      needsVideo: formData.needsVideo,
      needsReview: formData.needsReview,
    };

    onSubmit(processedData);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        title: '',
        context: '',
        targetAudience: '',
        seoKeywords: '',
        links: '',
        needsImage: false,
        needsVideo: false,
        needsReview: true,
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Template</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Template Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Tech Innovation Monday"
              maxLength={200}
              disabled={isLoading}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            <p className="text-gray-500 text-xs mt-1">{formData.title.length}/200 characters</p>
          </div>

          {/* Context */}
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
              Context & Content Guidelines *
            </label>
            <textarea
              id="context"
              name="context"
              value={formData.context}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.context ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe what kind of content should be generated. Be specific about tone, style, key messages, etc."
              maxLength={2000}
              disabled={isLoading}
            />
            {errors.context && <p className="text-red-600 text-sm mt-1">{errors.context}</p>}
            <p className="text-gray-500 text-xs mt-1">{formData.context.length}/2000 characters</p>
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
              Target Audience *
            </label>
            <input
              type="text"
              id="targetAudience"
              name="targetAudience"
              value={formData.targetAudience}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.targetAudience ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Tech professionals and entrepreneurs aged 25-45"
              maxLength={500}
              disabled={isLoading}
            />
            {errors.targetAudience && <p className="text-red-600 text-sm mt-1">{errors.targetAudience}</p>}
            <p className="text-gray-500 text-xs mt-1">{formData.targetAudience.length}/500 characters</p>
          </div>

          {/* SEO Keywords */}
          <div>
            <label htmlFor="seoKeywords" className="block text-sm font-medium text-gray-700 mb-1">
              SEO Keywords *
            </label>
            <input
              type="text"
              id="seoKeywords"
              name="seoKeywords"
              value={formData.seoKeywords}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.seoKeywords ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="technology, innovation, AI, future (comma separated, max 20)"
              disabled={isLoading}
            />
            {errors.seoKeywords && <p className="text-red-600 text-sm mt-1">{errors.seoKeywords}</p>}
            <p className="text-gray-500 text-xs mt-1">
              {formData.seoKeywords.split(',').filter(k => k.trim()).length}/20 keywords
            </p>
          </div>

          {/* Links */}
          <div>
            <label htmlFor="links" className="block text-sm font-medium text-gray-700 mb-1">
              Reference Links
            </label>
            <textarea
              id="links"
              name="links"
              value={formData.links}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/article1&#10;https://example.com/article2&#10;(one link per line, max 10)"
              disabled={isLoading}
            />
            <p className="text-gray-500 text-xs mt-1">
              {formData.links.split('\n').filter(l => l.trim()).length}/10 links
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Content Requirements</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="needsImage"
                  checked={formData.needsImage}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">📷 Needs Image Generation</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="needsVideo"
                  checked={formData.needsVideo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">🎥 Needs Video Generation</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="needsReview"
                  checked={formData.needsReview}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-700">👁️ Requires Manual Review</span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              '✨ Create Template'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}