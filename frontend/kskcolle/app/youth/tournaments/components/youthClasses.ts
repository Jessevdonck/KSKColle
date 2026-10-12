/**
 * Reeksen van een jeugdtoernooi, laagste stap eerst ("Stap 1+2" vóór "Stap 3+").
 * Toernooien zonder reeksnaam komen achteraan.
 */
export const sortYouthClasses = <T extends { class_name?: string | null }>(tournaments: T[]): T[] =>
  [...tournaments].sort((a, b) => {
    if (!a.class_name && !b.class_name) return 0
    if (!a.class_name) return 1
    if (!b.class_name) return -1
    return a.class_name.localeCompare(b.class_name, 'nl', { numeric: true })
  })
