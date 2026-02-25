'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [authors, setAuthors] = useState<any[]>([])

  useEffect(() => {
    loadAuthors()
  }, [])

  const loadAuthors = async () => {
    const { data } = await supabase
      .from('authors')
      .select('*')
      .order('order_position')
    setAuthors(data || [])
  }

  const handleSave = async (status: 'draft' | 'published') => {
    const title = (document.getElementById('post-title') as HTMLInputElement)?.value
    const slug = (document.getElementById('post-slug') as HTMLInputElement)?.value
    const deck = (document.getElementById('post-deck') as HTMLTextAreaElement)?.value
    const author_id = (document.getElementById('post-author') as HTMLSelectElement)?.value
    const category = (document.getElementById('post-category') as HTMLInputElement)?.value
    const cover_image_url = (document.getElementById('post-cover') as HTMLInputElement)?.value
    const content = (document.getElementById('post-content') as HTMLTextAreaElement)?.value
    const tags_string = (document.getElementById('post-tags') as HTMLInputElement)?.value
    const read_time = parseInt((document.getElementById('post-readtime') as HTMLInputElement)?.value || '5')

    if (!title || !author_id || !category) {
      alert('Please fill in required fields (Title, Author, Category)')
      return
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const tags = tags_string ? tags_string.split(',').map(t => t.trim()).filter(Boolean) : []

    setSaving(true)
    try {
      const postData = {
        title,
        slug: finalSlug,
        deck: deck || null,
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] },
        author_id,
        category,
        tags,
        cover_image_url: cover_image_url || null,
        read_time,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
      }

      const { error } = await supabase.from('posts').insert([postData])
      if (error) throw error

      alert('Post saved successfully!')
      router.push('/dashboard/posts')
    } catch (error: any) {
      alert(error.message || 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/posts" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-3xl font-bold text-dark">New Post</h1>
          <p className="text-gray-600 mt-1">Create a new article</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Title *</label>
          <input id="post-title" type="text" placeholder="Enter post title..." className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">URL Slug</label>
          <input id="post-slug" type="text" placeholder="auto-generated if empty" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none font-mono text-sm" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Deck / Subtitle</label>
          <textarea id="post-deck" placeholder="Brief description..." rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Author *</label>
            <select id="post-author" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none">
              <option value="">Select author...</option>
              {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Category *</label>
            <input id="post-category" type="text" placeholder="e.g., Policy Review" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Cover Image URL</label>
          <input id="post-cover" type="url" placeholder="https://example.com/image.jpg" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Content *</label>
          <textarea id="post-content" placeholder="Write your article..." rows={15} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none resize-y font-mono text-sm" />
          <p className="text-xs text-gray-500 mt-1">Simple text editor (rich formatting coming soon)</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Tags (comma-separated)</label>
            <input id="post-tags" type="text" placeholder="startup law, data protection" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">Read Time (minutes)</label>
            <input id="post-readtime" type="number" defaultValue="5" min="1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <button onClick={() => handleSave('draft')} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50">
            <Save size={20} />{saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-amber hover:bg-red text-white rounded-lg disabled:opacity-50">
            <Eye size={20} />{saving ? 'Publishing...' : 'Publish Now'}
          </button>
          <Link href="/dashboard/posts" className="px-6 py-3 text-gray-600 hover:text-dark">Cancel</Link>
        </div>
      </div>
    </div>
  )
}
