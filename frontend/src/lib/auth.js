// Hardcoded admin credentials
// Using a valid UUID format for admin ID
const HARDCODED_ADMIN = {
  username: 'admin',
  password: 'adminpassword',
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@gymcore.com',
  role: 'admin'
}

// Check if credentials match hardcoded admin
export const checkHardcodedAdmin = (username, password) => {
  if (username === HARDCODED_ADMIN.username && password === HARDCODED_ADMIN.password) {
    return {
      user: {
        id: HARDCODED_ADMIN.id,
        email: HARDCODED_ADMIN.email,
        username: HARDCODED_ADMIN.username,
        role: HARDCODED_ADMIN.role
      },
      isAdmin: true
    }
  }
  return null
}

// Get hardcoded admin user object
export const getHardcodedAdminUser = () => {
  return {
    id: HARDCODED_ADMIN.id,
    email: HARDCODED_ADMIN.email,
    username: HARDCODED_ADMIN.username,
    role: HARDCODED_ADMIN.role
  }
}

// Check if user is hardcoded admin
export const isHardcodedAdmin = (user) => {
  return user?.id === HARDCODED_ADMIN.id
}

