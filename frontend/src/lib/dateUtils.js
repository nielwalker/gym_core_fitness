/**
 * Date utility functions to ensure accurate date handling across timezones
 */

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 * This ensures we get the local date, not UTC date
 */
export const getTodayLocal = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a date string (YYYY-MM-DD) is today in local timezone
 */
export const isTodayLocal = (dateString) => {
  if (!dateString) return false
  return dateString === getTodayLocal()
}

/**
 * Format a date string (YYYY-MM-DD) to a readable format
 * Handles timezone correctly by treating the date as local
 */
export const formatDateLocal = (dateString) => {
  if (!dateString) return ''
  
  // Parse date as local date (YYYY-MM-DD format)
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

/**
 * Check if an expiration date has passed (using local date)
 */
export const isExpiredLocal = (expirationDate) => {
  if (!expirationDate) return false
  
  // Parse expiration date as local date
  const expDate = new Date(expirationDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expDate.setHours(0, 0, 0, 0)
  
  return expDate < today
}

/**
 * Calculate expiration date (1 month from today) in local timezone
 */
export const calculateExpirationDateLocal = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get start of day in local timezone as ISO string for database queries
 * This ensures we query for the correct local day
 */
export const getStartOfDayLocal = (dateString) => {
  if (!dateString) return null
  
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  return date.toISOString()
}

/**
 * Get end of day in local timezone as ISO string for database queries
 */
export const getEndOfDayLocal = (dateString) => {
  if (!dateString) return null
  
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day, 23, 59, 59, 999)
  return date.toISOString()
}

