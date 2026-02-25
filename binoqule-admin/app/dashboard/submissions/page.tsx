'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'assigned' | 'resolved' | 'closed'>('all')

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('lawyer_submissions')
        .select(`
          *,
          assigned_lawyer:authors(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading submissions:', error)
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.area_of_law.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || sub.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const assignedCount = submissions.filter(s => s.status === 'assigned').length

  if (loading) {
    return <div className="text-center py-12">Loading submissions...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark">Ask A Lawyer Submissions</h1>
        <p className="text-gray-600 mt-1">
          {pendingCount} pending · {assignedCount} assigned · {submissions.length} total
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' ? 'No submissions match your filters' : 'No submissions yet'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Area of Law
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/submissions/${sub.id}`}
                      className="font-medium text-dark hover:text-amber"
                    >
                      {sub.first_name} {sub.last_name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{sub.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sub.area_of_law}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sub.urgency === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : sub.urgency === 'moderate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.urgency || 'normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sub.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : sub.status === 'assigned'
                        ? 'bg-blue-100 text-blue-700'
                        : sub.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sub.assigned_lawyer?.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
