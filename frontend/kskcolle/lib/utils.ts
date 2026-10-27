import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseRoles(roles: any): string[] {
  let list: unknown = roles
  if (typeof roles === 'string') {
    try {
      list = JSON.parse(roles)
    } catch (e) {
      return []
    }
  }
  if (!Array.isArray(list)) return []
  // Sommige records bevatten een "ingepakte" lijst, bv. ['["bestuurslid","user"]', 'admin']
  return [...new Set(list.flatMap((role) =>
    typeof role === 'string' && role.trim().startsWith('[') ? parseRoles(role) : [String(role)],
  ))]
}
