'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const quillRef = useRef<any>(null)
  const editorDivRef = useRef<HTMLDivElement>(null)
  const quillInitialized = useRef(false)

  // Initialize Quill when the editor div mounts
  const initQuill = (node: HTMLDivElement | null) => {
    if (!node || quillInitialized.current) return
    editorDivRef.current = node

    import('quill').then((QuillModule) => {
      const Quill = QuillModule.default
      quillRef.current = new Quill(node, {
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
  }

  const handleSave = async (publish: boolean) => {
    setSaving(true)
    setError('')
    setSuccess('')

    const title = (document.getElementById('new-title') as HTMLInputElement)?.value?.trim()
    const deck = (document.getElementById('new-deck') as HTMLInputElement)?.value?.trim()
    const author = (document.getElementById('new-author') as HTMLInputElement)?.value?.trim()
    const tagsRaw = (document.getElementById('new-tags') as HTMLInputElement)?.value?.trim()
    const slugRaw = (document.getElementById('new-slug') as HTMLInputElement)?.value?.trim()
    const content = quillRef.current ? quillRef.current.root.innerHTML : ''

    if (!title) {
      setError('Title is required.')
      setSaving(false)
      return
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
      : []

    const slug = slugRaw || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { error: insertError } = await supabase.from('posts').insert({
      title,
      deck,
      author,
      tags,
      slug,
      content,
      published: publish,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      setError('Failed to save: ' + insertError.message)
    } else {
      setSuccess(publish ? 'Post published successfully!' : 'Draft saved.')
      setTimeout(() => router.push('/dashboard/posts'), 1200)
    }

    setSaving(false)
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css" />

      <div style={{ padding: '32px', maxWidth: '900px', fontFamily: 'Source Sans 3, sans-serif', color: '#2D2626' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Alegreya, serif', fontSize: '28px', margin: 0 }}>New Post</h1>
          <button
            onClick={() => router.push('/dashboard/posts')}
            style={{ background: 'none', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
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
            <input id="new-title" type="text" placeholder="Post title" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Slug (URL path)</label>
            <input id="new-slug" type="text" placeholder="auto-generated from title if left blank" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Deck (subtitle / excerpt)</label>
            <input id="new-deck" type="text" placeholder="Brief description shown in post listings" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Author</label>
            <input id="new-author" type="text" placeholder="Author name" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Tags (comma-separated)</label>
            <input id="new-tags" type="text" placeholder="e.g. family law, contracts, property" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', pointerEvents: 'none' }}>Content</label>
            <div
              ref={initQuill}
              style={{
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '6px',
                minHeight: '400px',
                position: 'relative',
                zIndex: 2,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{ ...buttonStyle, background: '#666' }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{ ...buttonStyle, background: '#E39010' }}
          >
            {saving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>
    </>
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
