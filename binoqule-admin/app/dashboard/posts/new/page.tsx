'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Link from 'next/link'
import slugify from 'slugify'

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [authors, setAuthors] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    deck: '',
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    author_id: '',
    category: '',
    tags: [] as string[],
    cover_image_url: '',
    read_time: 5,
    status: 'draft' as 'draft' | 'published',
  })

  useEffect(() => {
    loadAuthors()
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    const newSlug = slugify(newTitle, { lower: true, strict: true })
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: prev.slug || newSlug // Only auto-generate if slug is empty
    }))
  }

  const loadAuthors = async () => {
    const { data } = await supabase
      .from('authors')
      .select('*')
      .order('order_position')
    setAuthors(data || [])
    if (data && data.length > 0 && !formData.author_id) {
      setFormData(prev => ({ ...prev, author_id: data[0].id }))
    }
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!formData.title || !formData.author_id) {
      alert('Please fill in required fields')
      return
    }

    setLoading(true)
    try {
      const postData = {
        ...formData,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
      }

      const { error } = await supabase
        .from('posts')
        .insert([postData])

      if (error) throw error

      router.push('/dashboard/posts')
    } catch (error: any) {
      console.error('Error creating post:', error)
      alert(error.message || 'Failed to create post')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/posts"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-dark">New Post</h1>
            <p className="text-gray-600 mt-1">Create a new article</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Enter post title..."
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">
            URL Slug
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))
            placeholder="url-friendly-slug"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Will be: binoqule.com/article/{formData.slug || 'your-slug'}
          </p>
        </div>

        {/* Deck */}
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">
            Deck / Subtitle
          </label>
          <textarea
            value={formData.deck}
            onChange={(e) => setFormData(prev => ({ ...prev, deck: e.target.value }))
            placeholder="A brief description or subtitle..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Meta Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Author *
            </label>
            <select
              value={formData.author_id}
              onChange={(e) => setFormData(prev => ({ ...prev, author_id: e.target.value }))
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            >
              {authors.map(author => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))
              placeholder="e.g., Policy Review"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">
            Cover Image URL
          </label>
          <input
            type="url"
            value={formData.cover_image_url}
            onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
          />
          {formData.cover_image_url && (
            <img
              src={formData.cover_image_url}
              alt="Cover preview"
              className="mt-3 w-full h-48 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">
            Content *
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content }))
          />
        </div>

        {/* Tags & Read Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              }))
              placeholder="startup law, data protection, fintech"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Read Time (minutes)
            </label>
            <input
              type="number"
              value={formData.read_time}
              onChange={(e) => setFormData(prev => ({ ...prev, read_time: parseInt(e.target.value) || 0 }))
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-amber hover:bg-red text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Eye size={20} />
            Publish Now
          </button>
          <Link
            href="/dashboard/posts"
            className="px-6 py-3 text-gray-600 hover:text-dark transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
