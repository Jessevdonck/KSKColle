"use client"

import { lazy, Suspense } from 'react'
import { LazyComponent } from '@/components/LazyComponent'

// Lazy load the UserList component
const UserList = lazy(() => import('../admin/Users/UserList'))

interface LazyUserListProps {
  users: any[]
  onDelete: (userId: number) => Promise<void>
  isDeleting?: boolean
  pagination?: any
  onRefresh: () => void
  onUserDeleted: (userId: number) => void
}

export function LazyUserList(props: LazyUserListProps) {
  return (
    <LazyComponent 
      fallback={
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <UserList {...props} />
    </LazyComponent>
  )
}
