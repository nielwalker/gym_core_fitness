import { useState } from 'react'
import { Container, Card, Form, Button, Alert } from 'react-bootstrap'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { checkHardcodedAdmin } from '../lib/auth'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check for hardcoded admin first
      const adminCheck = checkHardcodedAdmin(username, password)
      if (adminCheck) {
        // Store admin user in localStorage
        localStorage.setItem('gymcore_user', JSON.stringify(adminCheck.user))
        localStorage.setItem('gymcore_is_admin', 'true')
        // Dispatch custom event to notify App component
        window.dispatchEvent(new Event('gymcore-login'))
        navigate('/dashboard')
        return
      }

      // If not admin, try Supabase authentication (using username as email)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: username, // Use username as email for Supabase
        password,
      })

      if (authError) throw authError

      if (data.user) {
        // Store Supabase user
        localStorage.setItem('gymcore_user', JSON.stringify(data.user))
        localStorage.setItem('gymcore_is_admin', 'false')
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">
            <h2>Gym Core</h2>
            <p className="text-muted">Sign in to your account</p>
          </Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Login

