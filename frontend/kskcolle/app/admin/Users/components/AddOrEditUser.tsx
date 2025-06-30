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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Nieuwe Speler Toevoegen
        </h2>
      </div>
      <div className="p-6">
        <AsyncData error={saveError || error} loading={isLoading}>
          <UserForm saveUser={saveUser} isMutating={isMutating} />
        </AsyncData>
      </div>
    </div>
  )
}
