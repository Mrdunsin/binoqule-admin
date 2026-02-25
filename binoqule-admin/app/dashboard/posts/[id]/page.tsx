'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import slugify from 'slugify'

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    loadPost()
  }, [params.id])

  const loadAuthors = async () => {
    const { data } = await supabase
      .from('authors')
      .select('*')
      .order('order_position')
    setAuthors(data || [])
  }

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setFormData({
        title: data.title,
        slug: data.slug,
        deck: data.deck || '',
        content: data.content,
        author_id: data.author_id,
        category: data.category,
        tags: data.tags || [],
        cover_image_url: data.cover_image_url || '',
        read_time: data.read_time || 5,
        status: data.status,
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading post:', error)
      alert('Failed to load post')
      router.push('/dashboard/posts')
    }
  }

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!formData.title || !formData.author_id) {
      alert('Please fill in required fields')
      return
    }

    setSaving(true)
    try {
      const postData = {
        ...formData,
        status,
        published_at: status === 'published' && formData.status === 'draft'
          ? new Date().toISOString()
          : undefined,
      }

      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', params.id)

      if (error) throw error

      router.push('/dashboard/posts')
    } catch (error: any) {
      console.error('Error updating post:', error)
      alert(error.message || 'Failed to update post')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', params.id)

      if (error) throw error
      router.push('/dashboard/posts')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading post...</div>
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
            <h1 className="text-3xl font-bold text-dark">Edit Post</h1>
            <p className="text-gray-600 mt-1">{formData.title}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-red hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
          Delete Post
        </button>
      </div>

      {/* Form (same as new post) */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">URL Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Deck / Subtitle</label>
          <textarea
            value={formData.deck}
            onChange={(e) => setFormData({ ...formData, deck: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Author *</label>
            <select
              value={formData.author_id}
              onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            >
              {authors.map(author => (
                <option key={author.id} value={author.id}>{author.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Category *</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Cover Image URL</label>
          <input
            type="url"
            value={formData.cover_image_url}
            onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
          />
          {formData.cover_image_url && (
            <img src={formData.cover_image_url} alt="Cover" className="mt-3 w-full h-48 object-cover rounded-lg" />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Content *</label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Read Time</label>
            <input
              type="number"
              value={formData.read_time}
              onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-amber hover:bg-red text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Eye size={20} />
            {formData.status === 'published' ? 'Update Published' : 'Publish Now'}
          </button>
          <Link href="/dashboard/posts" className="px-6 py-3 text-gray-600 hover:text-dark">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
