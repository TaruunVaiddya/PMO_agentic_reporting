import { useMemo } from 'react'

interface UseSearchFilterOptions<T> {
  items: T[]
  searchQuery: string
  searchFields: (keyof T)[]
  filterField?: keyof T
  filterValue?: string
}

export function useSearchFilter<T>({
  items,
  searchQuery,
  searchFields,
  filterField,
  filterValue
}: UseSearchFilterOptions<T>): T[] {
  return useMemo(() => {
    return items.filter(item => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        searchFields.some(field => {
          const value = item[field]
          return typeof value === 'string' &&
            value.toLowerCase().includes(searchQuery.toLowerCase())
        })

      // Category/Status filter
      const matchesFilter = !filterField || !filterValue ||
        filterValue === 'all' ||
        item[filterField] === filterValue

      return matchesSearch && matchesFilter
    })
  }, [items, searchQuery, searchFields, filterField, filterValue])
}
