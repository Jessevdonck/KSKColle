'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User } from '@/data/types'
import EditForm from './components/forms/EditForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type UserListProps = {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: number) => Promise<void>
}

export default function UserList({ users, onDelete }: UserListProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)

  if (!users || users.length === 0) {
    return <div>No users found.</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mt-8 mb-4">Users List</h2>
      <Table>
        <TableHeader>
          <TableRow >
            <TableHead>Name</TableHead>
            <TableHead>Geboortedatum</TableHead>
            <TableHead>ELO Rating</TableHead>
            <TableHead>FIDE ID</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead className=''>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell>
                <Button
                  variant="link"
                  onClick={() => setEditingUser(user)}
                  className="p-0 h-auto font-normal"
                  
                >
                  <span data-cy="name_output">{`${user.voornaam} ${user.achternaam}`}</span>
                </Button>
              </TableCell>
              <TableCell ><span data-cy="birthdate_output">{new Date(user.geboortedatum).toLocaleDateString('nl-NL')}</span></TableCell>
              <TableCell ><span data-cy="rating_output">{user.schaakrating_elo}</span></TableCell>
              <TableCell ><span data-cy="fide_output">{user.fide_id || 'N/A'}</span></TableCell>
              <TableCell ><span data-cy="admin_output">{user.is_admin ? 'Yes' : 'No'}</span></TableCell>
              <TableCell className=''>
                <Button onClick={() => setEditingUser(user)} className="mr-2 bg-mainAccent text-white hover:bg-mainAccentDark" data-cy="edit_button">Edit</Button>
                <Button onClick={() => onDelete(user.user_id)} variant="destructive" data-cy="delete_button">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wijzig Gebruiker</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <EditForm user={editingUser} onClose={() => setEditingUser(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}