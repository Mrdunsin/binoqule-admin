'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Download, Trash2, UserX } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    loadSubscribers()
  }, [])

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubscribers(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading subscribers:', error)
      setLoading(false)
    }
  }

  const addSubscriber = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Please enter a valid email')
      return
    }

    try {
      const { error} = await supabase
        .from('subscribers')
        .insert([{ email: newEmail, source: 'manual' }])

      if (error) throw error
      setNewEmail('')
      setShowAddForm(false)
      loadSubscribers()
    } catch (error: any) {
      console.error('Error adding subscriber:', error)
      alert(error.message || 'Failed to add subscriber')
    }
  }

  const unsubscribe = async (id: string) => {
    if (!confirm('Mark this subscriber as unsubscribed?')) return

    try {
      const { error } = await supabase
        .from('subscribers')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      loadSubscribers()
    } catch (error) {
      console.error('Error unsubscribing:', error)
      alert('Failed to unsubscribe')
    }
  }

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Permanently delete this subscriber? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadSubscribers()
    } catch (error) {
      console.error('Error deleting subscriber:', error)
      alert('Failed to delete subscriber')
    }
  }

  const exportCSV = () => {
    const csv = [
      ['Email', 'Status', 'Source', 'Subscribed At'],
      ...subscribers.map(sub => [
        sub.email,
        sub.status,
        sub.source,
        new Date(sub.created_at).toLocaleDateString(),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `binoqule-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCount = subscribers.filter(s => s.status === 'active').length
  const unsubscribedCount = subscribers.filter(s => s.status === 'unsubscribed').length

  if (loading) {
    return <div className="text-center py-12">Loading subscribers...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Subscribers</h1>
          <p className="text-gray-600 mt-1">
            {activeCount} active · {unsubscribedCount} unsubscribed
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={20} />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-amber hover:bg-red text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Add Subscriber
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber">
          <h3 className="text-lg font-semibold text-dark mb-4">Add New Subscriber</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="subscriber@example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addSubscriber()}
            />
            <button
              onClick={addSubscriber}
              className="bg-amber hover:bg-red text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewEmail('')
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search subscribers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredSubscribers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No subscribers match your search' : 'No subscribers yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 text-amber hover:text-red"
              >
                <Plus size={20} />
                Add your first subscriber
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Subscribed
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-dark">{sub.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      sub.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.source}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {sub.status === 'active' && (
                        <button
                          onClick={() => unsubscribe(sub.id)}
                          className="p-2 text-gray-600 hover:text-amber hover:bg-gray-100 rounded transition-colors"
                          title="Unsubscribe"
                        >
                          <UserX size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteSubscriber(sub.id)}
                        className="p-2 text-gray-600 hover:text-red hover:bg-gray-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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
