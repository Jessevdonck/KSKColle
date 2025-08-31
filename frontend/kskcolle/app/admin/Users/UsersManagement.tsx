"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getAll, deleteById } from "../../api/index"
import type { User } from "@/data/types"
import AddOrEditUser from "./components/AddOrEditUser"
import UserList from "./UserList"
import EditForm from "./components/forms/EditForm"
import { Users, Settings } from "lucide-react"

export default function UsersManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const { data: users, error, mutate } = useSWR<User[]>("users", getAll)
  
  const refreshUsers = () => {
    mutate()
  }
  const { trigger: deleteUser, isMutating: isDeleting } = useSWRMutation("users", deleteById)

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId)
      mutate((currentUsers) => currentUsers?.filter((user) => user.user_id !== userId), false)
      toast({ title: "Success", description: "Speler succesvol verwijderd" })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({ title: "Error", description: "Kon speler niet verwijderen", variant: "destructive" })
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Fout bij laden van spelers</h2>
          <p className="text-gray-600 text-sm">Er is een probleem opgetreden bij het ophalen van de spelersgegevens.</p>
        </div>
      </div>
    )
  }

  if (!users) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-3"></div>
          <p className="text-gray-600 text-base">Spelers worden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textColor">Spelers Beheren</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{users.length} geregistreerde spelers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <AddOrEditUser onRefresh={refreshUsers} />
          <UserList users={users} onEdit={setSelectedUser} onDelete={handleDeleteUser} isDeleting={isDeleting} onRefresh={refreshUsers} />
        </div>
      </div>

      {/* Edit Modal */}
      {selectedUser && <EditForm user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  )
}
