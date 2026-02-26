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
  const [postStatus, setPostStatus] = useState('draft')
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([])
  const [selectedAuthorId, setSelectedAuthorId] = useState('')
  const [externalAuthor, setExternalAuthor] = useState('')

  const quillRef = useRef<any>(null)
  const editorDivRef = useRef<HTMLDivElement>(null)
  const quillInitialized = useRef(false)

  useEffect(() => {
    if (!postId) return

    const init = async () => {
      // Load team members
      const { data: authorData } = await supabase.from('authors').select('id, name').order('order_position')
      const teamMembers = authorData || []
      setAuthors(teamMembers)

      // Load post
      const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single()

      if (error || !data) {
        setError('Failed to load post.')
        setLoading(false)
        return
      }

      // Populate fields
      const set = (id: string, val: string) => {
        const el = document.getElementById(id) as HTMLInputElement
        if (el) el.value = val
      }

      set('edit-title', data.title || '')
      set('edit-slug', data.slug || '')
      set('edit-deck', data.deck || '')
      set('edit-category', data.category || '')
      set('edit-tags', (data.tags || []).join(', '))
      set('edit-read-time', data.read_time ? String(data.read_time) : '')

      setPostStatus(data.status || 'draft')

      // Set author — check if author_id matches a team member
      if (data.author_id) {
        const match = teamMembers.find((a) => a.id === data.author_id)
        if (match) setSelectedAuthorId(match.id)
      }

      // Init Quill
      const Quill = await loadQuillFromCDN()
      if (!quillInitialized.current && editorDivRef.current) {
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

        // Load content — handle both HTML string and JSONB object
        if (data.content) {
          if (typeof data.content === 'string') {
            quillRef.current.root.innerHTML = data.content
          } else if (data.content.html) {
            quillRef.current.root.innerHTML = data.content.html
          }
        }

        quillInitialized.current = true
      }

      setLoading(false)
    }

    init()
  }, [postId])

  const handleSave = async (newStatus: 'draft' | 'published' | 'unpublish') => {
    setSaving(true)
    setError('')
    setSuccess('')

    const get = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value?.trim()

    const title = get('edit-title')
    const deck = get('edit-deck')
    const category = get('edit-category')
    const tagsRaw = get('edit-tags')
    const slug = get('edit-slug')
    const readTimeRaw = get('edit-read-time')
    const content = quillRef.current ? quillRef.current.root.innerHTML : ''

    if (!title) { setError('Title is required.'); setSaving(false); return }
    if (!category) { setError('Category is required.'); setSaving(false); return }

    const tags = tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    const readTime = readTimeRaw ? parseInt(readTimeRaw) : null
    const authorId = externalAuthor.trim() ? null : selectedAuthorId || null
    const status = newStatus === 'unpublish' ? 'draft' : newStatus

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title,
        deck,
        category,
        tags,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        content,
        author_id: authorId,
        read_time: readTime,
        status,
        published_at: status === 'published' && postStatus !== 'published' ? new Date().toISOString() : undefined,
      })
      .eq('id', postId)

    if (updateError) {
      setError('Failed to save: ' + updateError.message)
    } else {
      setPostStatus(status)
      setSuccess(
        status === 'published' ? 'Post saved and published!' :
        newStatus === 'unpublish' ? 'Post unpublished.' : 'Draft saved.'
      )
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
    return <div style={{ padding: '40px', fontFamily: 'Source Sans 3, sans-serif', color: '#2D2626' }}>Loading post...</div>
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
          <label style={labelStyle}>Title *</label>
          <input id="edit-title" type="text" placeholder="Post title" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Slug (URL path)</label>
          <input id="edit-slug" type="text" placeholder="post-url-slug" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Deck (subtitle / excerpt)</label>
          <input id="edit-deck" type="text" placeholder="Brief description shown in post listings" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Category *</label>
          <input id="edit-category" type="text" placeholder="e.g. Policy Review, Startup Law, Fintech" style={inputStyle} />
        </div>

        {/* Author */}
        <div style={{ border: '1px solid #e0d9d5', borderRadius: '8px', padding: '16px', background: '#faf7f5' }}>
          <label style={{ ...labelStyle, marginBottom: '12px' }}>Author</label>

          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px', pointerEvents: 'none' }}>
            Team member
          </label>
          <select
            value={selectedAuthorId}
            onChange={(e) => {
              setSelectedAuthorId(e.target.value)
              if (e.target.value) setExternalAuthor('')
            }}
            style={{ ...inputStyle, marginBottom: '12px' }}
          >
            <option value="">— Select a team member —</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px', pointerEvents: 'none' }}>
            Or type an external / guest author name
          </label>
          <input
            type="text"
            placeholder="e.g. John Smith"
            value={externalAuthor}
            onChange={(e) => {
              setExternalAuthor(e.target.value)
              if (e.target.value) setSelectedAuthorId('')
            }}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input id="edit-tags" type="text" placeholder="e.g. family law, contracts, property" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Read time (minutes)</label>
          <input id="edit-read-time" type="number" placeholder="e.g. 5" style={{ ...inputStyle, width: '120px' }} />
        </div>

        <div>
          <label style={labelStyle}>Content</label>
          <div
            ref={editorDivRef}
            style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '6px', minHeight: '400px', position: 'relative', zIndex: 2 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => handleSave('draft')} disabled={saving} style={{ ...buttonStyle, background: '#666' }}>
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button onClick={() => handleSave('published')} disabled={saving} style={{ ...buttonStyle, background: '#E39010' }}>
          {saving ? 'Saving...' : postStatus === 'published' ? 'Update Post' : 'Publish'}
        </button>
        {postStatus === 'published' && (
          <button onClick={() => handleSave('unpublish')} disabled={saving} style={{ ...buttonStyle, background: '#888' }}>
            Unpublish
          </button>
        )}
        <button onClick={handleDelete} style={{ ...buttonStyle, background: '#CC2827', marginLeft: 'auto' }}>
          Delete Post
        </button>
      </div>

      <p style={{ marginTop: '12px', fontSize: '14px', color: '#888' }}>
        Status: <strong>{postStatus === 'published' ? '🟢 Published' : '🟡 Draft'}</strong>
      </p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: '600',
  marginBottom: '6px',
  pointerEvents: 'none',
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
