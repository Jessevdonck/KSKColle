'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User } from '@/data/types'
import EditForm from './components/forms/EditForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserListProps {
  users: User[]
  onDelete: (userId: number) => void
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
              <TableCell>
                <Button
                  variant="link"
                  onClick={() => setEditingUser(user)}
                  className="p-0 h-auto font-normal"
                >
                  {`${user.voornaam} ${user.achternaam}`}
                </Button>
              </TableCell>
              <TableCell>{new Date(user.geboortedatum).toLocaleDateString('nl-NL')}</TableCell>
              <TableCell>{user.schaakrating_elo}</TableCell>
              <TableCell>{user.fide_id || 'N/A'}</TableCell>
              <TableCell>{user.nationaal_id || 'N/A'}</TableCell>
              <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button onClick={() => setEditingUser(user)} className="mr-2 bg-mainAccent text-white hover:bg-mainAccentDark">Edit</Button>
                <Button onClick={() => onDelete(user.user_id)} variant="destructive">Delete</Button>
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