'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Trophy } from 'lucide-react'

const Sidebar = () => {
  const pathname = usePathname()

  const menuItems = [
    { href: '#dashboard', icon: Home, label: 'Dashboard' },
    { href: '#users', icon: Users, label: 'Users' },
    { href: '#tournaments', icon: Trophy, label: 'Tournaments' },
  ]

  return (
    <div className="w-64 bg-mainAccent text-white p-6">
      <h2 className="text-2xl font-bold mb-8">KSK Colle Admin</h2>
      <nav>
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={`flex items-center space-x-2 hover:text-neutral-200 ${
                  pathname === '/admin' && window.location.hash === item.href ? 'text-neutral-200' : ''
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar