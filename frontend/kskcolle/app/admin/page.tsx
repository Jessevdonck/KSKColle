import React from 'react'
import AdminPage from './components/AdminPage'
import PrivateRoute from '../components/PrivateRoute'

const page = () => {
  return (
    <PrivateRoute>
      <AdminPage />
    </PrivateRoute>
  )
}

export default page