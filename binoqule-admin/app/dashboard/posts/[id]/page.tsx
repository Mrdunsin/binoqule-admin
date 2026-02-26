'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function loadQuillFromCDN(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).Quill) return resolve((window as any).Quill)
    if (!document.querySelector('link[href*="quill"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css'
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js'
    script.onload = () => resolve((window as any).Quill)
    document.head.appendChild(script)
  })
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [published, setPublished] = useState(false)

  const quillRef = useRef<any>(null)
  const editorDivRef = useRef<HTMLDivElement>(null)
  const quillInitialized = useRef(false)

  useEffect(() => {
    if (!postId) return

    const loadPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error || !data) {
        setError('Failed to load post.')
        setLoading(false)
        return
      }

      const titleEl = document.getElementById('edit-title') as HTMLInputElement
      const deckEl = document.getElementById('edit-deck') as HTMLInputElement
      const authorEl = document.getElementById('edit-author') as HTMLInputElement
      const tagsEl = document.getElementById('edit-tags') as HTMLInputElement
      const slugEl = document.getElementById('edit-slug') as HTMLInputElement

      if (titleEl) titleEl.value = data.title || ''
      if (deckEl) deckEl.value = data.deck || ''
      if (authorEl) authorEl.value = data.author || ''
      if (tagsEl) tagsEl.value = (data.tags || []).join(', ')
      if (slugEl) slugEl.value = data.slug || ''
      setPublished(data.published || false)

      await initQuill(data.content || '')
      setLoading(false)
    }

    loadPost()
  }, [postId])

  const initQuill = async (content: string) => {
    if (quillInitialized.current || !editorDivRef.current) return
    const Quill = await loadQuillFromCDN()
    quillRef.current = new Quill(editorDivRef.current!, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean'],
        ],
      },
      placeholder: 'Write your article content here...',
    })
    if (content) quillRef.current.root.innerHTML = content
    quillInitialized.current = true
  }

  const handleSave = async (publishOverride?: boolean) => {
    setSaving(true)
    setError('')
    setSuccess('')

    const title = (document.getElementById('edit-title') as HTMLInputElement)?.value?.trim()
    const deck = (document.getElementById('edit-deck') as HTMLInputElement)?.value?.trim()
    const author = (document.getElementById('edit-author') as HTMLInputElement)?.value?.trim()
    const tagsRaw = (document.getElementById('edit-tags') as HTMLInputElement)?.value?.trim()
    const slug = (document.getElementById('edit-slug') as HTMLInputElement)?.value?.trim()
    const content = quillRef.current ? quillRef.current.root.innerHTML : ''

    if (!title) {
      setError('Title is required.')
      setSaving(false)
      return
    }

    const tags = tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    const isPublished = publishOverride !== undefined ? publishOverride : published

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title,
        deck,
        author,
        tags,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        content,
        published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (updateError) {
      setError('Failed to save: ' + updateError.message)
    } else {
      setPublished(isPublished)
      setSuccess(isPublished ? 'Post saved and published!' : 'Draft saved.')
    }

    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      setError('Failed to delete post.')
    } else {
      router.push('/dashboard/posts')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Source Sans 3, sans-serif', color: '#2D2626' }}>
        Loading post...
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'Source Sans 3, sans-serif', color: '#2D2626' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Alegreya, serif', fontSize: '28px', margin: 0 }}>Edit Post</h1>
        <button
          onClick={() => router.push('/dashboard/posts')}
          style={{ background: 'none', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', position: 'relative', zIndex: 3 }}
        >
          ← Back to Posts
        </button>
      </div>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #CC2827', color: '#CC2827', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#efe', border: '1px solid #2a7', color: '#155', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Title *</label>
          <input id="edit-title" type="text" placeholder="Post title" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Slug (URL path)</label>
          <input id="edit-slug" type="text" placeholder="post-url-slug" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Deck (subtitle / excerpt)</label>
          <input id="edit-deck" type="text" placeholder="Brief description shown in post listings" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Author</label>
          <input id="edit-author" type="text" placeholder="Author name" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Tags (comma-separated)</label>
          <input id="edit-tags" type="text" placeholder="e.g. family law, contracts, property" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Content</label>
          <div
            ref={editorDivRef}
            style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '6px', minHeight: '400px', position: 'relative', zIndex: 2 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => handleSave(false)} disabled={saving} style={{ ...buttonStyle, background: '#666' }}>
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button onClick={() => handleSave(true)} disabled={saving} style={{ ...buttonStyle, background: '#E39010' }}>
          {saving ? 'Saving...' : published ? 'Update Published Post' : 'Publish'}
        </button>
        {published && (
          <button onClick={() => handleSave(false)} disabled={saving} style={{ ...buttonStyle, background: '#888' }}>
            Unpublish
          </button>
        )}
        <button onClick={handleDelete} style={{ ...buttonStyle, background: '#CC2827', marginLeft: 'auto' }}>
          Delete Post
        </button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '14px', color: '#888' }}>
        Status: <strong>{published ? '🟢 Published' : '🟡 Draft'}</strong>
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  fontSize: '15px',
  fontFamily: 'Source Sans 3, sans-serif',
  boxSizing: 'border-box',
  position: 'relative',
  zIndex: 2,
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 24px',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  position: 'relative',
  zIndex: 3,
}
