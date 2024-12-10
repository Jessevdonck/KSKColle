import React, { useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getAll, deleteById } from '../../api/index'
import { User } from '@/data/types'
import AddOrEditUser from './components/AddOrEditUser'
import UserList from './UserList'
import EditForm from './components/forms/EditForm'

export default function UsersManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const { data: users, error, mutate } = useSWR<User[]>('users', getAll)
  const { trigger: deleteUser } = useSWRMutation('users', deleteById)

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
    <div className='flex flex-col justift-center items-center'>
      <h1 className="text-3xl font-bold text-textColor my-10">Spelers Beheren</h1>
      <AddOrEditUser />
      <UserList 
        users={users} 
        onEdit={setSelectedUser} 
        onDelete={handleDeleteUser} 
      />
      {selectedUser && (
        <EditForm 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}