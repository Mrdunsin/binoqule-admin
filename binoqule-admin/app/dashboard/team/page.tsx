'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, MoveUp, MoveDown, Save, X } from 'lucide-react'

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    const { data } = await supabase.from('authors').select('*').order('order_position')
    setMembers(data || [])
    setLoading(false)
  }

  const startEdit = (member: any) => {
    setEditingId(member.id)
    setTimeout(() => {
      (document.getElementById('edit-name') as HTMLInputElement).value = member.name || '';
      (document.getElementById('edit-email') as HTMLInputElement).value = member.email || '';
      (document.getElementById('edit-role') as HTMLInputElement).value = member.role || '';
      (document.getElementById('edit-focus') as HTMLInputElement).value = member.focus_area || '';
      (document.getElementById('edit-bio') as HTMLTextAreaElement).value = member.bio || '';
      (document.getElementById('edit-photo') as HTMLInputElement).value = member.photo_url || '';
    }, 10)
  }

  const startAdd = () => {
    setEditingId('new')
    setTimeout(() => {
      (document.getElementById('edit-name') as HTMLInputElement).value = '';
      (document.getElementById('edit-email') as HTMLInputElement).value = '';
      (document.getElementById('edit-role') as HTMLInputElement).value = '';
      (document.getElementById('edit-focus') as HTMLInputElement).value = '';
      (document.getElementById('edit-bio') as HTMLTextAreaElement).value = '';
      (document.getElementById('edit-photo') as HTMLInputElement).value = '';
    }, 10)
  }

  const handleSave = async () => {
    const name = (document.getElementById('edit-name') as HTMLInputElement)?.value
    const email = (document.getElementById('edit-email') as HTMLInputElement)?.value
    const role = (document.getElementById('edit-role') as HTMLInputElement)?.value
    const focus_area = (document.getElementById('edit-focus') as HTMLInputElement)?.value
    const bio = (document.getElementById('edit-bio') as HTMLTextAreaElement)?.value
    const photo_url = (document.getElementById('edit-photo') as HTMLInputElement)?.value

    if (!name || !email || !role) {
      alert('Please fill in Name, Email, and Role')
      return
    }

    try {
      if (editingId === 'new') {
        await supabase.from('authors').insert([{ name, email, role, focus_area, bio, photo_url, order_position: members.length }])
      } else {
        await supabase.from('authors').update({ name, email, role, focus_area, bio, photo_url }).eq('id', editingId)
      }
      loadMembers()
      setEditingId(null)
      alert('Saved!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const deleteMember = async (id: string) => {
    if (confirm('Delete this member?')) {
      await supabase.from('authors').delete().eq('id', id)
      loadMembers()
    }
  }

  const moveUp = async (index: number) => {
    if (index === 0) return
    const newMembers = [...members]
    ;[newMembers[index], newMembers[index - 1]] = [newMembers[index - 1], newMembers[index]]
    for (let i = 0; i < newMembers.length; i++) {
      await supabase.from('authors').update({ order_position: i }).eq('id', newMembers[i].id)
    }
    setMembers(newMembers)
  }

  const moveDown = async (index: number) => {
    if (index === members.length - 1) return
    const newMembers = [...members]
    ;[newMembers[index], newMembers[index + 1]] = [newMembers[index + 1], newMembers[index]]
    for (let i = 0; i < newMembers.length; i++) {
      await supabase.from('authors').update({ order_position: i }).eq('id', newMembers[i].id)
    }
    setMembers(newMembers)
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-dark">Team Members</h1><p className="text-gray-600 mt-1">{members.length} members</p></div>
        <button onClick={startAdd} className="flex items-center gap-2 bg-amber hover:bg-red text-white px-4 py-2 rounded-lg"><Plus size={20} />Add Member</button>
      </div>

      {editingId && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-amber">
          <h3 className="text-lg font-semibold mb-4">{editingId === 'new' ? 'Add New Member' : 'Edit Member'}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Name *</label><input id="edit-name" type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Email *</label><input id="edit-email" type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Role *</label><input id="edit-role" type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none" /></div>
              <div><label className="block text-sm font-medium mb-1">Focus Area</label><input id="edit-focus" type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Photo URL</label><input id="edit-photo" type="url" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none" /></div>
            <div><label className="block text-sm font-medium mb-1">Bio</label><textarea id="edit-bio" rows={4} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber outline-none resize-none" /></div>
            <div className="flex gap-3 pt-3 border-t">
              <button onClick={handleSave} className="flex items-center gap-2 bg-amber hover:bg-red text-white px-4 py-2 rounded-lg"><Save size={18} />Save</button>
              <button onClick={() => setEditingId(null)} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"><X size={18} />Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {members.map((m, i) => (
          <div key={m.id} className="bg-white p-6 rounded-lg shadow flex items-start gap-6">
            <img src={m.photo_url || 'https://via.placeholder.com/100'} alt={m.name} className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="text-lg font-bold">{m.name}</h3>
              <p className="text-sm text-amber font-semibold">{m.role}</p>
              {m.focus_area && <p className="text-sm text-gray-600 mt-1">{m.focus_area}</p>}
              {m.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{m.bio}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><MoveUp size={18} /></button>
              <button onClick={() => moveDown(i)} disabled={i === members.length - 1} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><MoveDown size={18} /></button>
              <button onClick={() => startEdit(m)} className="p-2 hover:bg-gray-100 rounded"><Edit size={18} /></button>
              <button onClick={() => deleteMember(m.id)} className="p-2 hover:bg-gray-100 rounded"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
