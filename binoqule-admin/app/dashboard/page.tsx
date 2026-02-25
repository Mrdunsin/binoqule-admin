'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FileText, Users, Mail, Inbox, TrendingUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalSubscribers: 0,
    activeSubscribers: 0,
    pendingSubmissions: 0,
    totalTeamMembers: 0,
  })
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get stats
      const [postsRes, subscribersRes, submissionsRes, teamRes] = await Promise.all([
        supabase.from('posts').select('id, status'),
        supabase.from('subscribers').select('id, status'),
        supabase.from('lawyer_submissions').select('id, status'),
        supabase.from('authors').select('id'),
      ])

      // Calculate stats
      const postsData = postsRes.data || []
      const subscribersData = subscribersRes.data || []
      const submissionsData = submissionsRes.data || []

      setStats({
        totalPosts: postsData.length,
        publishedPosts: postsData.filter(p => p.status === 'published').length,
        draftPosts: postsData.filter(p => p.status === 'draft').length,
        totalSubscribers: subscribersData.length,
        activeSubscribers: subscribersData.filter(s => s.status === 'active').length,
        pendingSubmissions: submissionsData.filter(s => s.status === 'pending').length,
        totalTeamMembers: teamRes.data?.length || 0,
      })

      // Get recent posts
      const { data: recentPostsData } = await supabase
        .from('posts')
        .select('id, title, status, created_at, author:authors(name)')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentPosts(recentPostsData || [])

      // Get recent submissions
      const { data: recentSubmissionsData } = await supabase
        .from('lawyer_submissions')
        .select('id, first_name, last_name, area_of_law, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentSubmissions(recentSubmissionsData || [])

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back to Binoqule Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/posts" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-3xl font-bold text-dark mt-2">{stats.totalPosts}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.publishedPosts} published · {stats.draftPosts} drafts
              </p>
            </div>
            <FileText className="text-amber" size={40} />
          </div>
        </Link>

        <Link href="/dashboard/subscribers" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subscribers</p>
              <p className="text-3xl font-bold text-dark mt-2">{stats.activeSubscribers}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalSubscribers} total
              </p>
            </div>
            <Mail className="text-amber" size={40} />
          </div>
        </Link>

        <Link href="/dashboard/submissions" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-dark mt-2">{stats.pendingSubmissions}</p>
              <p className="text-sm text-gray-500 mt-1">
                Ask A Lawyer
              </p>
            </div>
            <Inbox className="text-red" size={40} />
          </div>
        </Link>

        <Link href="/dashboard/team" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-3xl font-bold text-dark mt-2">{stats.totalTeamMembers}</p>
              <p className="text-sm text-gray-500 mt-1">
                Active editors
              </p>
            </div>
            <Users className="text-amber" size={40} />
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark">Recent Posts</h2>
              <Link href="/dashboard/posts" className="text-sm text-amber hover:text-red">
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPosts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No posts yet. <Link href="/dashboard/posts/new" className="text-amber hover:text-red">Create your first post</Link>
              </div>
            ) : (
              recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/dashboard/posts/${post.id}`}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-dark">{post.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{post.author?.name || 'Unknown'}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {post.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark">Recent Lawyer Requests</h2>
              <Link href="/dashboard/submissions" className="text-sm text-amber hover:text-red">
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSubmissions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No submissions yet
              </div>
            ) : (
              recentSubmissions.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/dashboard/submissions/${sub.id}`}
                  className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-dark">
                      {sub.first_name} {sub.last_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{sub.area_of_law}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sub.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : sub.status === 'assigned'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {sub.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
