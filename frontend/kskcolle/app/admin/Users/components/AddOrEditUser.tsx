"use client"

import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getAll, save } from "../../../api/index"
import UserForm from "./forms/UserForm"
import AsyncData from "../../../components/AsyncData"
import type { User } from "@/data/types"
import { UserPlus } from "lucide-react"

export default function AddOrEditUser() {
  const { trigger: saveUser, error: saveError, isMutating } = useSWRMutation("users", save)

  const { isLoading, error } = useSWR<User[]>("users", getAll)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus className="h-6 w-6" />
          Nieuwe Speler Toevoegen
        </h2>
      </div>
      <div className="p-8">
        <AsyncData error={saveError || error} loading={isLoading}>
          <UserForm saveUser={saveUser} isMutating={isMutating} />
        </AsyncData>
      </div>
    </div>
  )
}
