import React from 'react'
import Link from 'next/link'
import { Home, Users, Trophy, Settings } from 'lucide-react'

const Sidebar = () => {
  return (
    <div className="w-64 bg-mainAccent text-white p-6">
      <h2 className="text-2xl font-bold mb-8">KSK Colle Admin</h2>
      <nav>
        <ul className="space-y-4">
          <li>
            <Link href="/admin" className="flex items-center space-x-2 hover:text-neutral-200">
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="flex items-center space-x-2 hover:text-neutral-200">
              <Users size={20} />
              <span>Users</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/tournaments" className="flex items-center space-x-2 hover:text-neutral-200">
              <Trophy size={20} />
              <span>Tournaments</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/settings" className="flex items-center space-x-2 hover:text-neutral-200">
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar