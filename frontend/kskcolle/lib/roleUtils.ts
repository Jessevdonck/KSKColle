import { User } from '../data/types'

/**
 * Check if a user has any of the required roles
 * @param user - The user object to check
 * @param requiredRoles - Array of roles that are allowed
 * @returns true if user has at least one of the required roles
 */
export function hasRole(user: User | null | undefined, requiredRoles: string[]): boolean {
  if (!user || !user.roles) {
    return false
  }
  
  return requiredRoles.some(role => user.roles!.includes(role))
}

/**
 * Check if a user can view sensitive information (email, phone numbers)
 * Only users with 'user', 'bestuurslid', or 'admin' roles can see this info
 * @param user - The user object to check
 * @returns true if user can view sensitive information
 */
export function canViewSensitiveInfo(user: User | null | undefined): boolean {
  return hasRole(user, ['user', 'bestuurslid', 'admin'])
}

/**
 * Check if a user is an admin
 * @param user - The user object to check
 * @returns true if user is admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  return hasRole(user, ['admin'])
}

/**
 * Check if a user is a board member (bestuurslid)
 * @param user - The user object to check
 * @returns true if user is bestuurslid
 */
export function isBoardMember(user: User | null | undefined): boolean {
  return hasRole(user, ['bestuurslid'])
}
