'use client'

import React, { useEffect, useState } from 'react'
import AdminPage from './components/AdminPage'
import PrivateRoute from '../components/PrivateRoute'

const page = () => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <PrivateRoute>
      <AdminPage />
    </PrivateRoute>
  )
}

export default page