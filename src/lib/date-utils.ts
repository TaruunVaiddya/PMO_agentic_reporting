export function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)

  // Check if date is invalid
  if (isNaN(date.getTime())) return 'Invalid date'

  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()

  // Handle future dates
  if (diffInMs < 0) return 'In the future'

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  } else {
    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
  }
}