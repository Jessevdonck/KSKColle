import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseRoles(roles: any): string[] {
  if (Array.isArray(roles)) {
    return roles;
  }
  if (typeof roles === 'string') {
    try {
      return JSON.parse(roles);
    } catch (e) {
      return [];
    }
  }
  return [];
}
