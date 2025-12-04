import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { getHardcodedAdminUser, isHardcodedAdmin } from './lib/auth'
import Sidebar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerRegistration from './pages/staff/CustomerRegistration'
import ProductManagement from './pages/staff/ProductManagement'
import SalesManagement from './pages/staff/SalesManagement'
import AdminDashboard from './pages/admin/AdminDashboard'
import Register from './pages/admin/Register'
import UserManagement from './pages/admin/UserManagement'
import SalesTracking from './pages/admin/SalesTracking'
import Expenses from './pages/admin/Expenses'
import LockerManagement from './pages/admin/LockerManagement'
import Users from './pages/Users'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Check for hardcoded admin in localStorage first
    const storedUser = localStorage.getItem('gymcore_user')
    const isAdmin = localStorage.getItem('gymcore_is_admin') === 'true'
    
    if (storedUser && isAdmin) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (isHardcodedAdmin(parsedUser)) {
          setUser(parsedUser)
          setLoading(false)
          return
        }
      } catch (e) {
        // Invalid stored user, continue to Supabase check
        localStorage.removeItem('gymcore_user')
        localStorage.removeItem('gymcore_is_admin')
      }
    }

    // Check active Supabase sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        localStorage.setItem('gymcore_user', JSON.stringify(session.user))
        localStorage.setItem('gymcore_is_admin', 'false')
        setUser(session.user)
      } else if (!storedUser) {
        setUser(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        localStorage.setItem('gymcore_user', JSON.stringify(session.user))
        localStorage.setItem('gymcore_is_admin', 'false')
        setUser(session.user)
      } else {
        // Only clear if not hardcoded admin
        const currentStored = localStorage.getItem('gymcore_user')
        if (currentStored) {
          try {
            const parsed = JSON.parse(currentStored)
            if (!isHardcodedAdmin(parsed)) {
              localStorage.removeItem('gymcore_user')
              localStorage.removeItem('gymcore_is_admin')
              setUser(null)
            }
          } catch (e) {
            localStorage.removeItem('gymcore_user')
            localStorage.removeItem('gymcore_is_admin')
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    })

    // Listen for custom login event (for hardcoded admin login in same tab)
    const handleLoginEvent = () => {
      const storedUser = localStorage.getItem('gymcore_user')
      const isAdmin = localStorage.getItem('gymcore_is_admin') === 'true'
      
      if (storedUser && isAdmin) {
        try {
          const parsedUser = JSON.parse(storedUser)
          if (isHardcodedAdmin(parsedUser)) {
            setUser(parsedUser)
          }
        } catch (e) {
          // Invalid stored user
        }
      }
    }

    // Listen for custom logout event (for hardcoded admin logout)
    const handleLogoutEvent = () => {
      setUser(null)
    }

    window.addEventListener('gymcore-login', handleLoginEvent)
    window.addEventListener('gymcore-logout', handleLogoutEvent)
    window.addEventListener('storage', handleLoginEvent)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('gymcore-login', handleLoginEvent)
      window.removeEventListener('gymcore-logout', handleLogoutEvent)
      window.removeEventListener('storage', handleLoginEvent)
    }
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className={user ? `app-with-sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}` : ''}>
        {user && <Sidebar user={user} onCollapseChange={setSidebarCollapsed} />}
        <div className={user ? 'main-content' : ''}>
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route
              path="/dashboard"
              element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/customers/register"
              element={user ? <CustomerRegistration /> : <Navigate to="/login" />}
            />
            <Route
              path="/products"
              element={user ? <ProductManagement /> : <Navigate to="/login" />}
            />
            <Route
              path="/sales"
              element={user ? <SalesManagement /> : <Navigate to="/login" />}
            />
            <Route
              path="/users"
              element={user ? <Users /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/dashboard"
              element={user ? <AdminDashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/register"
              element={user ? <Register user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/users"
              element={user ? <UserManagement user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/sales"
              element={user ? <SalesTracking /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/expenses"
              element={user ? <Expenses /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/lockers"
              element={user ? <LockerManagement /> : <Navigate to="/login" />}
            />
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App

