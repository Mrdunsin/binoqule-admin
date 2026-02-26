'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([])
  const [selectedAuthorId, setSelectedAuthorId] = useState('')
  const [externalAuthor, setExternalAuthor] = useState('')

  const quillRef = useRef<any>(null)
  const editorDivRef = useRef<HTMLDivElement>(null)
  const quillInitialized = useRef(false)

  useEffect(() => {
    // Load team members for dropdown
    supabase.from('authors').select('id, name').order('order_position').then(({ data }) => {
      if (data) setAuthors(data)
    })

    // Init Quill editor
    loadQuillFromCDN().then((Quill) => {
      if (quillInitialized.current || !editorDivRef.current) return
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
      quillInitialized.current = true
    })
  }, [])

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError('')
    setSuccess('')

    const title = (document.getElementById('new-title') as HTMLInputElement)?.value?.trim()
    const deck = (document.getElementById('new-deck') as HTMLInputElement)?.value?.trim()
    const category = (document.getElementById('new-category') as HTMLInputElement)?.value?.trim()
    const tagsRaw = (document.getElementById('new-tags') as HTMLInputElement)?.value?.trim()
    const slugRaw = (document.getElementById('new-slug') as HTMLInputElement)?.value?.trim()
    const readTimeRaw = (document.getElementById('new-read-time') as HTMLInputElement)?.value?.trim()
    const content = quillRef.current ? quillRef.current.root.innerHTML : ''

    if (!title) {
      setError('Title is required.')
      setSaving(false)
      return
    }

    if (!category) {
      setError('Category is required.')
      setSaving(false)
      return
    }

    const tags = tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean) : []
    const slug = slugRaw || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const readTime = readTimeRaw ? parseInt(readTimeRaw) : null

    // Use selected team member ID, or null if external author is typed
    const authorId = externalAuthor.trim() ? null : selectedAuthorId || null

    const { error: insertError } = await supabase.from('posts').insert({
      title,
      deck,
      category,
      tags,
      slug,
      content,
      author_id: authorId,
      read_time: readTime,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })

    if (insertError) {
      setError('Failed to save: ' + insertError.message)
    } else {
      setSuccess(status === 'published' ? 'Post published successfully!' : 'Draft saved.')
      setTimeout(() => router.push('/dashboard/posts'), 1200)
    }

    setSaving(false)
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'Source Sans 3, sans-serif', color: '#2D2626' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Alegreya, serif', fontSize: '28px', margin: 0 }}>New Post</h1>
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
          <input id="new-title" type="text" placeholder="Post title" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Slug (URL path)</label>
          <input id="new-slug" type="text" placeholder="auto-generated from title if left blank" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Deck (subtitle / excerpt)</label>
          <input id="new-deck" type="text" placeholder="Brief description shown in post listings" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Category *</label>
          <input id="new-category" type="text" placeholder="e.g. Policy Review, Startup Law, Fintech" style={inputStyle} />
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
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#999' }}>
            Note: external author names are not yet stored in the database — this field is for reference only until an external_author column is added.
          </p>
        </div>

        <div>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input id="new-tags" type="text" placeholder="e.g. family law, contracts, property" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Read time (minutes)</label>
          <input id="new-read-time" type="number" placeholder="e.g. 5" style={{ ...inputStyle, width: '120px' }} />
        </div>

        <div>
          <label style={labelStyle}>Content</label>
          <div
            ref={editorDivRef}
            style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '6px', minHeight: '400px', position: 'relative', zIndex: 2 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button onClick={() => handleSave('draft')} disabled={saving} style={{ ...buttonStyle, background: '#666' }}>
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button onClick={() => handleSave('published')} disabled={saving} style={{ ...buttonStyle, background: '#E39010' }}>
          {saving ? 'Saving...' : 'Publish'}
        </button>
      </div>
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
