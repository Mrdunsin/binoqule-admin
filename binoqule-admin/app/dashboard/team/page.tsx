'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, MoveUp, MoveDown, Save, X } from 'lucide-react'

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    focus_area: '',
    bio: '',
    photo_url: '',
  })

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('order_position')

      if (error) throw error
      setMembers(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading team:', error)
      setLoading(false)
    }
  }

  const startEdit = (member: any) => {
    setEditingId(member.id)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      focus_area: member.focus_area || '',
      bio: member.bio || '',
      photo_url: member.photo_url || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: '', email: '', role: '', focus_area: '', bio: '', photo_url: '' })
  }

  const saveEdit = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      alert('Please fill in required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('authors')
        .update(formData)
        .eq('id', editingId)

      if (error) throw error
      loadMembers()
      cancelEdit()
    } catch (error: any) {
      console.error('Error updating member:', error)
      alert(error.message || 'Failed to update team member')
    }
  }

  const addMember = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      alert('Please fill in required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('authors')
        .insert([{ ...formData, order_position: members.length }])

      if (error) throw error
      loadMembers()
      cancelEdit()
    } catch (error: any) {
      console.error('Error adding member:', error)
      alert(error.message || 'Failed to add team member')
    }
  }

  const deleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const { error } = await supabase
        .from('authors')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadMembers()
    } catch (error) {
      console.error('Error deleting member:', error)
      alert('Failed to delete team member')
    }
  }

  const moveUp = async (index: number) => {
    if (index === 0) return
    const newMembers = [...members]
    const temp = newMembers[index]
    newMembers[index] = newMembers[index - 1]
    newMembers[index - 1] = temp

    await updateOrder(newMembers)
  }

  const moveDown = async (index: number) => {
    if (index === members.length - 1) return
    const newMembers = [...members]
    const temp = newMembers[index]
    newMembers[index] = newMembers[index + 1]
    newMembers[index + 1] = temp

    await updateOrder(newMembers)
  }

  const updateOrder = async (newMembers: any[]) => {
    try {
      const updates = newMembers.map((member, index) => ({
        id: member.id,
        order_position: index,
      }))

      for (const update of updates) {
        await supabase
          .from('authors')
          .update({ order_position: update.order_position })
          .eq('id', update.id)
      }

      setMembers(newMembers)
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading team...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Team Members</h1>
          <p className="text-gray-600 mt-1">{members.length} team members</p>
        </div>
        <button
          onClick={() => setEditingId('new')}
          className="flex items-center gap-2 bg-amber hover:bg-red text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      {/* Add/Edit Form */}
      {editingId && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber">
          <h3 className="text-lg font-semibold text-dark mb-4">
            {editingId === 'new' ? 'Add New Member' : 'Edit Member'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value })}
                  placeholder="e.g., Co-Founder & Editor"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Focus Area</label>
                <input
                  type="text"
                  value={formData.focus_area}
                  onChange={(e) => setFormData(prev => ({ ...prev, focus_area: e.target.value })}
                  placeholder="e.g., Data & Internet Policy"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none"
              />
              {formData.photo_url && (
                <img src={formData.photo_url} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button
                onClick={editingId === 'new' ? addMember : saveEdit}
                className="flex items-center gap-2 bg-amber hover:bg-red text-white px-4 py-2 rounded-lg"
              >
                <Save size={18} />
                {editingId === 'new' ? 'Add Member' : 'Save Changes'}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team List */}
      <div className="space-y-4">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="bg-white p-6 rounded-lg shadow flex items-start gap-6"
          >
            <img
              src={member.photo_url || 'https://via.placeholder.com/100'}
              alt={member.name}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-dark">{member.name}</h3>
              <p className="text-sm text-amber font-semibold">{member.role}</p>
              {member.focus_area && (
                <p className="text-sm text-gray-600 mt-1">{member.focus_area}</p>
              )}
              {member.bio && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{member.bio}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                title="Move up"
              >
                <MoveUp size={18} />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === members.length - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                title="Move down"
              >
                <MoveDown size={18} />
              </button>
              <button
                onClick={() => startEdit(member)}
                className="p-2 text-gray-600 hover:text-amber hover:bg-gray-100 rounded"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => deleteMember(member.id)}
                className="p-2 text-gray-600 hover:text-red hover:bg-gray-100 rounded"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
