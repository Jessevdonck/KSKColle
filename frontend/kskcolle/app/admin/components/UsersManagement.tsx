import React, { useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getAll, deleteById } from '../../api/index'
import * as usersApi from '../../api/users'
import { User } from '@/data/types'
import AddOrEditUser from './AddOrEditUser'
import UserList from './UserList'
import EditForm from '../components/forms/EditForm'

export default function UsersManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const { data: users, error, mutate } = useSWR<User[]>('spelers', getAll)
  const { trigger: deleteUser } = useSWRMutation('spelers', deleteById)

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await usersApi.updateUser(updatedUser.user_id, updatedUser)
      mutate()
      setSelectedUser(null)
      toast({ title: "Success", description: "User updated successfully" })
    } catch (error) {
      console.error('Error updating user:', error)
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" })
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId)
      mutate((currentUsers) => currentUsers?.filter(user => user.user_id !== userId), false)
      toast({ title: "Success", description: "User deleted successfully" })
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" })
    }
  }

  if (error) return <div>Failed to load users</div>
  if (!users) return <div>Loading...</div>

  return (
    <div>
      <AddOrEditUser />
      <UserList 
        users={users} 
        onEdit={setSelectedUser} 
        onDelete={handleDeleteUser} 
      />
      {selectedUser && (
        <EditForm 
          user={selectedUser} 
          onSubmit={handleUpdateUser} 
        />
      )}
    </div>
  )
}