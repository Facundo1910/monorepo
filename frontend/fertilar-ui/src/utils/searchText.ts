export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function matchesSearch(
  query: string,
  ...fields: (string | number | null | undefined)[]
): boolean {
  const normalized = normalizeSearchText(query)
  if (!normalized) return true
  return fields.some((field) => {
    if (field == null) return false
    return normalizeSearchText(String(field)).includes(normalized)
  })
}
