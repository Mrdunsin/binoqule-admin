'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Mail, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submission, setSubmission] = useState<any>(null)
  const [authors, setAuthors] = useState<any[]>([])
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      const [subRes, authorsRes] = await Promise.all([
        supabase
          .from('lawyer_submissions')
          .select('*, assigned_lawyer:authors(name)')
          .eq('id', params.id)
          .single(),
        supabase
          .from('authors')
          .select('*')
          .order('name')
      ])

      if (subRes.error) throw subRes.error

      setSubmission(subRes.data)
      setAssignedTo(subRes.data.assigned_to || '')
      setStatus(subRes.data.status)
      setNotes(subRes.data.notes || '')
      setAuthors(authorsRes.data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading submission:', error)
      alert('Failed to load submission')
      router.push('/dashboard/submissions')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('lawyer_submissions')
        .update({
          assigned_to: assignedTo || null,
          status,
          notes,
        })
        .eq('id', params.id)

      if (error) throw error
      
      alert('Submission updated successfully')
      loadData()
      setSaving(false)
    } catch (error: any) {
      console.error('Error updating submission:', error)
      alert(error.message || 'Failed to update submission')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('lawyer_submissions')
        .delete()
        .eq('id', params.id)

      if (error) throw error
      router.push('/dashboard/submissions')
    } catch (error) {
      console.error('Error deleting submission:', error)
      alert('Failed to delete submission')
    }
  }

  const sendEmail = () => {
    const subject = encodeURIComponent(`Re: Your legal inquiry - ${submission.area_of_law}`)
    const body = encodeURIComponent(`Hi ${submission.first_name},\n\nThank you for reaching out to Binoqule.\n\n`)
    window.location.href = `mailto:${submission.email}?subject=${subject}&body=${body}`
  }

  if (loading) {
    return <div className="text-center py-12">Loading submission...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/submissions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-dark">
              {submission.first_name} {submission.last_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Submitted {format(new Date(submission.created_at), 'PPP')}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-red hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
          Delete
        </button>
      </div>

      {/* Contact Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-dark mb-4">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="text-dark font-medium">{submission.email}</p>
          </div>
          {submission.phone && (
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <p className="text-dark font-medium">{submission.phone}</p>
            </div>
          )}
        </div>
        <button
          onClick={sendEmail}
          className="mt-4 flex items-center gap-2 text-amber hover:text-red transition-colors"
        >
          <Mail size={18} />
          Send Email
        </button>
      </div>

      {/* Legal Issue */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-dark mb-4">Legal Issue</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">Area of Law</label>
            <p className="text-dark font-medium">{submission.area_of_law}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Urgency</label>
            <p className="text-dark font-medium capitalize">{submission.urgency || 'Normal'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Description</label>
            <p className="text-dark mt-2 whitespace-pre-wrap leading-relaxed">
              {submission.issue}
            </p>
          </div>
        </div>
      </div>

      {/* Management */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold text-dark mb-4">Manage Submission</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none"
            >
              <option value="">Unassigned</option>
              {authors.map(author => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none"
            >
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Internal Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add notes about this submission..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-amber hover:bg-red text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/dashboard/submissions"
            className="px-6 py-3 text-gray-600 hover:text-dark transition-colors"
          >
            Back to List
          </Link>
        </div>
      </div>
    </div>
  )
}
