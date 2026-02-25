'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { FileText, Users, Mail, Inbox, Send, LogOut, LayoutDashboard } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-dark text-lg">Loading...</div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/posts', label: 'Posts', icon: FileText },
    { href: '/dashboard/team', label: 'Team', icon: Users },
    { href: '/dashboard/subscribers', label: 'Subscribers', icon: Mail },
    { href: '/dashboard/submissions', label: 'Ask A Lawyer', icon: Inbox },
    { href: '/dashboard/campaigns', label: 'Email Campaigns', icon: Send },
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-dark text-white">
        <div className="h-full flex flex-direction-column">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold">Binoqule</h1>
            <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                              (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-700">
            <div className="px-4 py-3 bg-gray-800 rounded-lg mb-3">
              <p className="text-sm text-gray-400">Logged in as</p>
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8" style={{ pointerEvents: 'auto' }}>
        <div className="max-w-7xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
