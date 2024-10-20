import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { getAll, deleteById } from '../../api/index'
import * as usersApi from '../../api/users'
import { User } from '@/data/types'

type NewUser = Omit<User, 'user_id' | 'participations' | 'speler1Games' | 'speler2Games' | 'gewonnenGames'>;

export default function UsersManagement() {
  const [newUser, setNewUser] = useState<NewUser>({
    voornaam: '',
    achternaam: '',
    geboortedatum: new Date(),
    schaakrating_elo: 0,
    lid_sinds: new Date(),
    fide_id: undefined,
    nationaal_id: undefined,
    is_admin: false,
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const { data: users, error, mutate } = useSWR<User[]>('spelers', getAll)
  const { trigger: deleteUser } = useSWRMutation('spelers', deleteById)

  const handleAddUser = async () => {
    try {
      await usersApi.addUser(newUser)
      setNewUser({
        voornaam: '',
        achternaam: '',
        geboortedatum: new Date(),
        schaakrating_elo: 0,
        lid_sinds: new Date(),
        fide_id: undefined,
        nationaal_id: undefined,
        is_admin: false,
      })
      mutate()
      toast({ title: "Success", description: "User added successfully" })
    } catch (error) {
      console.error('Error adding user:', error)
      toast({ title: "Error", description: "Failed to add user", variant: "destructive" })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    try {
      await usersApi.updateUser(selectedUser.user_id, selectedUser)
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
      <h2 className="text-2xl font-semibold mb-4">Add User</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
         {/* Voornaam */}
        <div>
          <label htmlFor="voornaam" className="block text-sm font-semibold text-textColor">
            Voornaam
          </label>
          <Input
            id="voornaam"
            placeholder="Voornaam"
            value={newUser.voornaam}
            onChange={(e) => setNewUser({ ...newUser, voornaam: e.target.value.trim() })}
          />
        </div>

        {/* Achternaam */}
        <div>
          <label htmlFor="achternaam" className="block text-sm font-semibold text-textColor">
            Achternaam
          </label>
          <Input
            id="achternaam"
            placeholder="Achternaam"
            value={newUser.achternaam}
            onChange={(e) => setNewUser({ ...newUser, achternaam: e.target.value.trim() })}
          />
        </div>

        {/* Geboortedatum */}
        <div>
          <label htmlFor="geboortedatum" className="block text-sm font-semibold text-textColor">
            Geboortedatum
          </label>
          <Input
            id="geboortedatum"
            type="date"
            placeholder="Geboortedatum"
            value={
              newUser.geboortedatum ? newUser.geboortedatum.toISOString().split('T')[0] : ''
            }
            onChange={(e) => setNewUser({ ...newUser, geboortedatum: new Date(e.target.value) })}
          />
        </div>

        {/* Clubrating */}
        <div>
          <label htmlFor="clubrating" className="block text-sm font-semibold text-textColor">
            Clubrating
          </label>
          <Input
            id="clubrating"
            type="number"
            placeholder="Clubrating"
            value={newUser.schaakrating_elo || ''}
            onChange={(e) => {
              const newElo = parseInt(e.target.value);
              if (!isNaN(newElo)) {
                setNewUser((prevUser) => ({
                  ...prevUser,
                  schaakrating_elo: newElo,
                  schaakrating_max:
                    newElo >= (prevUser.schaakrating_max || 0) ? newElo : prevUser.schaakrating_max,
                }));
              }
            }}
          />
        </div>

        {/* FIDE ID */}
        <div>
          <label htmlFor="fide_id" className="block text-sm font-semibold text-textColor">
            FIDE ID
          </label>
          <Input
            id="fide_id"
            type="number"
            placeholder="FIDE ID"
            value={newUser.fide_id || ''}
            onChange={(e) => setNewUser({ ...newUser, fide_id: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>

        {/* Nationaal ID */}
        <div>
          <label htmlFor="nationaal_id" className="block text-sm font-semibold text-textColor">
            Nationaal ID
          </label>
          <Input
            id="nationaal_id"
            type="number"
            placeholder="Nationaal ID"
            value={newUser.nationaal_id || ''}
            onChange={(e) => setNewUser({ ...newUser, nationaal_id: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>
        
        {/*Max rating*/ }
        <div>
          <label htmlFor="max_rating" className="block text-sm font-semibold text-textColor">
            Max Rating
          </label>
          <Input
            id="max_rating"
            type="number"
            placeholder="Max Rating"
            value={newUser.schaakrating_max || ''}
            onChange={(e) => setNewUser({ ...newUser, schaakrating_max: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>

        {/*Lid Sinds*/ }
        <div>
          <label htmlFor="lid_sinds" className="block text-sm font-semibold text-textColor">
            Lid Sinds
          </label>
          <Input
            id="lid_sinds"
            type="date"
            placeholder="Lid Sinds"
            value={
              newUser.lid_sinds ? newUser.lid_sinds.toISOString().split('T')[0] : ''
            }
            onChange={(e) => setNewUser({ ...newUser, lid_sinds: new Date(e.target.value) })}
          />
        </div>
      </div>

      
      <Button onClick={handleAddUser} className="bg-mainAccent text-white hover:bg-mainAccentDark">Add User</Button>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Users List</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Geboortedatum</TableHead>
            <TableHead>ELO Rating</TableHead>
            <TableHead>FIDE ID</TableHead>
            <TableHead>Nationaal ID</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell>{`${user.voornaam} ${user.achternaam}`}</TableCell>
              <TableCell>{new Date(user.geboortedatum).toLocaleDateString('nl-NL')}</TableCell>
              <TableCell>{user.schaakrating_elo}</TableCell>
              <TableCell>{user.fide_id || 'N/A'}</TableCell>
              <TableCell>{user.nationaal_id || 'N/A'}</TableCell>
              <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button onClick={() => setSelectedUser(user)} className="mr-2 bg-mainAccent text-white hover:bg-mainAccentDark">Edit</Button>
                <Button onClick={() => handleDeleteUser(user.user_id)} variant="destructive">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && (
  <div className="mt-8">
    <h2 className="text-2xl font-semibold mb-4">Edit User</h2>
    <div className="grid grid-cols-2 gap-4 mb-4">
      {/* Voornaam */}
      <div>
        <label htmlFor="voornaamEdit" className="block text-sm font-semibold text-textColor">
          Voornaam
        </label>
        <Input
          id="voornaamEdit"
          placeholder="Voornaam"
          value={selectedUser.voornaam}
          onChange={(e) => setSelectedUser({ ...selectedUser, voornaam: e.target.value.trim() })}
        />
      </div>

      {/* Achternaam */}
      <div>
        <label htmlFor="achternaamEdit" className="block text-sm font-semibold text-textColor">
          Achternaam
        </label>
        <Input
          id="achternaamEdit"
          placeholder="Achternaam"
          value={selectedUser.achternaam}
          onChange={(e) => setSelectedUser({ ...selectedUser, achternaam: e.target.value.trim() })}
        />
      </div>

      {/* Geboortedatum */}
      <div>
        <label htmlFor="geboortedatumEdit" className="block text-sm font-semibold text-textColor">
          Geboortedatum
        </label>
        <Input
          id="geboortedatumEdit"
          type="date"
          placeholder="Geboortedatum"
          value={
            selectedUser.geboortedatum
              ? new Date(selectedUser.geboortedatum).toISOString().split('T')[0]
              : ''
          }
          onChange={(e) => setSelectedUser({ ...selectedUser, geboortedatum: new Date(e.target.value) })}
        />
      </div>

      {/* Clubrating */}
      <div>
              <label htmlFor="clubratingEdit" className="block text-sm font-semibold text-textColor">
                Clubrating
              </label>
              <Input
                id="clubratingEdit"
                type="number"
                placeholder="Clubrating"
                value={selectedUser.schaakrating_elo}
                onChange={(e) => {
                  const newElo = parseInt(e.target.value);
                  setSelectedUser((prevUser): User => {
                    if (!prevUser) throw new Error("Unexpected null selectedUser");
                    return {
                      ...prevUser,
                      schaakrating_elo: newElo,
                      schaakrating_max: newElo > (prevUser.schaakrating_max || 0) ? newElo : prevUser.schaakrating_max
                    };
                  });
                }}
              />
      </div>

      {/* FIDE ID */}
      <div>
        <label htmlFor="fide_idEdit" className="block text-sm font-semibold text-textColor">
          FIDE ID
        </label>
        <Input
          id="fide_idEdit"
          type="number"
          placeholder="FIDE ID"
          value={selectedUser.fide_id || ''}
          onChange={(e) => setSelectedUser({ ...selectedUser, fide_id: e.target.value ? parseInt(e.target.value) : undefined })}
        />
      </div>

      {/* Max rating */}
      <div>
        <label htmlFor="max_ratingEdit" className="block text-sm font-semibold text-textColor">
          Max Rating
        </label>
        <Input
          id="max_ratingEdit"
          type="number"
          placeholder="Max rating"
          value={selectedUser.schaakrating_max || ''}
          onChange={(e) => setSelectedUser({ ...selectedUser, schaakrating_max: e.target.value ? parseInt(e.target.value) : undefined })}
        />
      </div>

      {/* Nationaal ID */}
      <div>
        <label htmlFor="nationaal_idEdit" className="block text-sm font-semibold text-textColor">
          Nationaal ID
        </label>
        <Input
          id="nationaal_idEdit"
          type="number"
          placeholder="Nationaal ID"
          value={selectedUser.nationaal_id || ''}
          onChange={(e) => setSelectedUser({ ...selectedUser, nationaal_id: e.target.value ? parseInt(e.target.value) : undefined })}
        />
      </div>

      {/* Lid Sinds */}
      <div>
        <label htmlFor="lidSindsEdit" className="block text-sm font-semibold text-textColor">
          Lid Sinds
        </label>
        <Input
          id="lidSindsEdit"
          type="date"
          placeholder="Lid Sinds"
          value={
            selectedUser.lid_sinds
              ? new Date(selectedUser.lid_sinds).toISOString().split('T')[0]
              : ''
          }
          onChange={(e) => setSelectedUser({ ...selectedUser, lid_sinds: new Date(e.target.value) })}
        />
      </div>
    </div>

    
    
    <Button onClick={handleUpdateUser} className="bg-mainAccent text-white hover:bg-mainAccentDark">
      Update User
    </Button>
  </div>
)}
    </div>
  )
}