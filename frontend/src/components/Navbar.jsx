import { Nav, NavDropdown } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { isHardcodedAdmin } from '../lib/auth'
import api from '../lib/axios'
import './Sidebar.css'

function Sidebar({ user, onCollapseChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userRole, setUserRole] = useState('staff')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleToggle = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (onCollapseChange) {
      onCollapseChange(newState)
    }
  }

  useEffect(() => {
    // Check if user is hardcoded admin
    if (user && isHardcodedAdmin(user)) {
      setUserRole('admin')
      return
    }

    // For Supabase users, fetch role from API
    const fetchUserRole = async () => {
      try {
        const response = await api.get(`/user/role/${user.id}`)
        setUserRole(response.data.role)
      } catch (error) {
        console.error('Error fetching user role:', error)
        // Default to staff if API call fails
        setUserRole('staff')
      }
    }
    if (user) {
      fetchUserRole()
    }
  }, [user])

  const handleLogout = async () => {
    // Sign out from Supabase if not hardcoded admin
    if (user && !isHardcodedAdmin(user)) {
      await supabase.auth.signOut()
    }
    
    // Clear localStorage
    localStorage.removeItem('gymcore_user')
    localStorage.removeItem('gymcore_is_admin')
    
    // Dispatch custom logout event to notify App component
    window.dispatchEvent(new Event('gymcore-logout'))
    
    // Navigate to login
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h4 className="sidebar-brand">Gym Core</h4>
        <button 
          className="sidebar-toggle btn btn-link text-white p-0"
          onClick={handleToggle}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? '≡' : '×'}
        </button>
      </div>
      
      <Nav className="flex-column sidebar-nav">
        <Nav.Link 
          className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          {!isCollapsed && <span>Dashboard</span>}
        </Nav.Link>
        
        {userRole === 'staff' && (
          <>
            <Nav.Link 
              className={`sidebar-link ${isActive('/customers/register') ? 'active' : ''}`}
              onClick={() => navigate('/customers/register')}
            >
              {!isCollapsed && <span>Register Customer</span>}
            </Nav.Link>
            <Nav.Link 
              className={`sidebar-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => navigate('/products')}
            >
              {!isCollapsed && <span>Products</span>}
            </Nav.Link>
            <Nav.Link 
              className={`sidebar-link ${isActive('/sales') ? 'active' : ''}`}
              onClick={() => navigate('/sales')}
            >
              {!isCollapsed && <span>Sales</span>}
            </Nav.Link>
          </>
        )}
        
        {userRole === 'admin' && (
          <>
            <Nav.Link 
              className={`sidebar-link ${isActive('/admin/register') ? 'active' : ''}`}
              onClick={() => navigate('/admin/register')}
            >
              {!isCollapsed && <span>Register</span>}
            </Nav.Link>
            <Nav.Link 
              className={`sidebar-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => navigate('/products')}
            >
              {!isCollapsed && <span>Products</span>}
            </Nav.Link>
            <Nav.Link 
              className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
              onClick={() => navigate('/admin/users')}
            >
              {!isCollapsed && <span>Users</span>}
            </Nav.Link>
            <Nav.Link 
              className={`sidebar-link ${isActive('/admin/sales') ? 'active' : ''}`}
              onClick={() => navigate('/admin/sales')}
            >
              {!isCollapsed && <span>Sales Tracking</span>}
            </Nav.Link>
          </>
        )}
      </Nav>
      
      <div className="sidebar-footer">
        <NavDropdown 
          title={
            <span>
              {!isCollapsed && <span>{user?.username || user?.email || 'User'}</span>}
            </span>
          }
          id="user-dropdown"
          className="sidebar-user-dropdown"
        >
          <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
        </NavDropdown>
      </div>
    </div>
  )
}

export default Sidebar

