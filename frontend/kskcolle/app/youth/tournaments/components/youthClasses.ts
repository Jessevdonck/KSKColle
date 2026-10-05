/**
 * Reeksen van een jeugdtoernooi, hoogste stap eerst ("Stap 3+" vóór "Stap 1+2").
 * Toernooien zonder reeksnaam komen achteraan.
 */
export const sortYouthClasses = <T extends { class_name?: string | null }>(tournaments: T[]): T[] =>
  [...tournaments].sort((a, b) => {
    if (!a.class_name && !b.class_name) return 0
    if (!a.class_name) return 1
    if (!b.class_name) return -1
    return b.class_name.localeCompare(a.class_name, 'nl', { numeric: true })
  })
