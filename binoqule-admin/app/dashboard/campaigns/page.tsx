'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Send, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading campaigns:', error)
      setLoading(false)
    }
  }

  const sentCount = campaigns.filter(c => c.status === 'sent').length
  const draftCount = campaigns.filter(c => c.status === 'draft').length

  if (loading) {
    return <div className="text-center py-12">Loading campaigns...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark">Email Campaigns</h1>
          <p className="text-gray-600 mt-1">
            {sentCount} sent · {draftCount} drafts
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="flex items-center gap-2 bg-amber hover:bg-red text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          New Campaign
        </Link>
      </div>

      {/* Feature Coming Soon Notice */}
      <div className="bg-amber-50 border-2 border-amber rounded-lg p-6">
        <h3 className="text-lg font-semibold text-dark mb-2">📧 Email Campaigns Coming Soon</h3>
        <p className="text-gray-700 mb-4">
          This feature will allow you to compose and send newsletters to all your subscribers directly from the admin panel.
        </p>
        <p className="text-sm text-gray-600">
          <strong>What's included:</strong>
        </p>
        <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
          <li>Rich text email composer</li>
          <li>Send to all active subscribers</li>
          <li>Save drafts</li>
          <li>Track sent campaigns</li>
          <li>Integration with Resend for delivery</li>
        </ul>
        <p className="text-sm text-gray-600 mt-4">
          For now, you can continue using Substack to send your newsletters. This feature will be added in the next update.
        </p>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No campaigns yet</p>
            <p className="text-sm text-gray-400">Email campaign feature coming in next update</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-dark">
                    {campaign.subject}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      campaign.status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {campaign.recipient_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {campaign.sent_at 
                      ? formatDistanceToNow(new Date(campaign.sent_at), { addSuffix: true })
                      : formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })
                    }
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
