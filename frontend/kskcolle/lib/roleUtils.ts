import { User } from '../data/types'

/**
 * Check if a user has any of the required roles
 * @param user - The user object to check
 * @param requiredRoles - Array of roles that are allowed
 * @returns true if user has at least one of the required roles
 */
export function hasRole(user: User | null | undefined, requiredRoles: string[]): boolean {
  if (!user || !user.roles) {
    console.log('hasRole - No user or roles:', { user: !!user, hasRoles: !!user?.roles })
    return false
  }
  
  // Parse roles if it's a string, otherwise use as is
  let userRoles: string[] = []
  if (typeof user.roles === 'string') {
    try {
      userRoles = JSON.parse(user.roles)
      console.log('hasRole - Parsed string roles:', userRoles)
    } catch (e) {
      console.log('hasRole - Failed to parse roles string:', user.roles)
      userRoles = []
    }
  } else if (Array.isArray(user.roles)) {
    userRoles = user.roles
    console.log('hasRole - Already array:', userRoles)
  } else {
    console.log('hasRole - Unknown roles type:', typeof user.roles, user.roles)
  }
  
  const result = requiredRoles.some(role => userRoles.includes(role))
  console.log('hasRole - Check:', { userRoles, requiredRoles, result })
  return result
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
 * Check if a user can view sensitive information of another user
 * Regular users can only see contact info of other regular users (not ex-lids)
 * Admins and board members can see contact info of all users
 * @param viewer - The user who wants to view the information
 * @param targetUser - The user whose information is being viewed
 * @returns true if viewer can view sensitive information of targetUser
 */
export function canViewUserSensitiveInfo(viewer: User | null | undefined, targetUser: User | null | undefined): boolean {
  // If no viewer or target user, deny access
  if (!viewer || !targetUser) {
    return false
  }

  // Admins and board members can see all contact info
  if (hasRole(viewer, ['admin', 'bestuurslid'])) {
    return true
  }

  // Regular users can only see contact info of other regular users (not ex-lids)
  if (hasRole(viewer, ['user'])) {
    // Check if target user is an ex-lid
    const isTargetExLid = hasRole(targetUser, ['exlid'])
    return !isTargetExLid
  }

  // Default: deny access
  return false
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

/**
 * Check if a user is an author (can write articles)
 * @param user - The user object to check
 * @returns true if user is author
 */
export function isAuthor(user: User | null | undefined): boolean {
  return hasRole(user, ['author'])
}

/**
 * Check if a user can create/edit articles
 * @param user - The user object to check
 * @returns true if user is admin, bestuurslid, or author
 */
export function canManageArticles(user: User | null | undefined): boolean {
  return hasRole(user, ['admin', 'bestuurslid', 'author'])
}

/**
 * Check if a user is a puzzle master
 * @param user - The user object to check
 * @returns true if user is puzzlemaster or admin
 */
export function isPuzzleMaster(user: User | null | undefined): boolean {
  return hasRole(user, ['puzzlemaster', 'admin'])
}