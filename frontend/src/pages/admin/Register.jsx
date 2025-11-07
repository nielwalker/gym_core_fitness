import { useState } from 'react'
import { Container, Card, Form, Button, Alert, Nav } from 'react-bootstrap'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import { isHardcodedAdmin } from '../../lib/auth'
import { getTodayLocal, calculateExpirationDateLocal } from '../../lib/dateUtils'

function Register({ user }) {
  const [activeTab, setActiveTab] = useState('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Customer form data
  const [customerData, setCustomerData] = useState({
    name: '',
    address: '',
    contact_no: '',
    payment_method: 'Cash',
    amount: '',
    partial_amount: '',
    registration_type: 'Monthly'
  })

  // Staff form data
  const [staffData, setStaffData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  })

  const handleCustomerChange = (e) => {
    const { name, value } = e.target
    setCustomerData({ ...customerData, [name]: value })
  }

  const handleStaffChange = (e) => {
    const { name, value } = e.target
    setStaffData({ ...staffData, [name]: value })
  }


  const handleCustomerSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let expirationDate = calculateExpirationDateLocal()
      let amount = 0
      let partialAmount = null
      let remainingAmount = 0

      if (customerData.payment_method === 'Partial') {
        amount = parseFloat(customerData.amount || 0) // Total amount
        partialAmount = parseFloat(customerData.partial_amount || 0)
        remainingAmount = amount - partialAmount
      } else if (customerData.payment_method === 'Cash') {
        amount = parseFloat(customerData.amount || 0)
        remainingAmount = 0
      } else if (customerData.payment_method === 'Gcash') {
        // For Gcash, amount is not required, set to 0
        amount = 0
        remainingAmount = 0
      }

      // Check if customer exists for all registration types
      try {
        const checkResponse = await api.get(`/customers/check?contact_no=${encodeURIComponent(customerData.contact_no)}`)
        if (checkResponse.data && checkResponse.data.exists) {
          const existingCustomer = checkResponse.data.customer
          const isActive = checkResponse.data.isActive

          // If customer subscription is still active, show notification
          if (isActive) {
            setError('This user is already Registered and Active')
            setLoading(false)
            return
          }

          // Customer exists but expired - only allow renewal for Monthly registration
          if (customerData.registration_type === 'Monthly') {
            let staffId = null
            if (user && isHardcodedAdmin(user)) {
              // For hardcoded admin, use null since admin doesn't exist in users table
              staffId = null
            } else {
              const { data: { user: currentUser } } = await supabase.auth.getUser()
              staffId = currentUser?.id || user?.id
            }

            const response = await api.post('/customers/renew', {
              customerId: existingCustomer.id,
              name: customerData.name,
              address: customerData.address,
              contact_no: customerData.contact_no,
              payment_method: customerData.payment_method,
              amount: amount,
              partial_amount: partialAmount,
              remaining_amount: remainingAmount,
              staff_id: staffId
            })
            setSuccess('Customer account renewed successfully!')
            setCustomerData({
              name: '',
              address: '',
              contact_no: '',
              payment_method: 'Cash',
              amount: '',
              partial_amount: '',
              registration_type: 'Monthly'
            })
            setLoading(false)
            return
          } else {
            // For Membership type, if customer exists (even if expired), show notification
            setError('This user is already Registered and Active')
            setLoading(false)
            return
          }
        }
      } catch (checkError) {
        // Customer doesn't exist or error checking, proceed with new registration
      }

      // Get staff_id
      let staffId = null
      if (user && isHardcodedAdmin(user)) {
        // For hardcoded admin, use null since admin doesn't exist in users table
        staffId = null
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        staffId = currentUser?.id || user?.id
      }

      // Create new customer
      const customerPayload = {
        name: customerData.name,
        address: customerData.address,
        contact_no: customerData.contact_no,
        payment_method: customerData.payment_method,
        amount: amount,
        partial_amount: partialAmount,
        remaining_amount: remainingAmount,
        registration_type: customerData.registration_type,
        expiration_date: expirationDate,
        start_date: getTodayLocal(),
        staff_id: staffId
      }

      await api.post('/customers', customerPayload)
      setSuccess('Customer registered successfully!')
      setCustomerData({
        name: '',
        address: '',
        contact_no: '',
        payment_method: 'Cash',
        amount: '',
        partial_amount: '',
        registration_type: 'Monthly'
      })
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register customer')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (staffData.password !== staffData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Use username as email for Supabase (since Supabase requires email)
      // Format: username@gymcore.com (using .com instead of .local for valid email)
      const emailForAuth = `${staffData.username}@gymcore.com`
      
      // Create user in Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: emailForAuth,
        password: staffData.password,
        options: {
          data: {
            name: staffData.name,
            username: staffData.username
          }
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      // Update user record with name and username via backend API
      if (data.user) {
        try {
          await api.post('/api/users/update', {
            userId: data.user.id,
            name: staffData.name,
            username: staffData.username
          })
        } catch (updateError) {
          console.error('Error updating user:', updateError)
          // Don't throw here, user was created successfully
        }
      }

      setSuccess('Staff member registered successfully!')
      setStaffData({
        name: '',
        username: '',
        password: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Registration error:', error)
      const errorMessage = error.message || error.response?.data?.error || 'Failed to register staff member'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <h1 className="my-4">Register</h1>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card>
        <Card.Body>
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="customer">Customer Registration</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="staff">Staff Registration</Nav.Link>
            </Nav.Item>
          </Nav>
          
          {activeTab === 'customer' && (
              <Form onSubmit={handleCustomerSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={customerData.name}
                    onChange={handleCustomerChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address *</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={customerData.address}
                    onChange={handleCustomerChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Contact No *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="contact_no"
                    value={customerData.contact_no}
                    onChange={handleCustomerChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Method *</Form.Label>
                  <Form.Select
                    name="payment_method"
                    value={customerData.payment_method}
                    onChange={handleCustomerChange}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Gcash">Gcash</option>
                    <option value="Partial">Partial</option>
                  </Form.Select>
                </Form.Group>

                {customerData.payment_method === 'Partial' && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Partial Amount *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="partial_amount"
                        value={customerData.partial_amount}
                        onChange={handleCustomerChange}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Amount *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="amount"
                        value={customerData.amount}
                        onChange={handleCustomerChange}
                        required
                      />
                    </Form.Group>
                  </>
                )}

                {customerData.payment_method === 'Cash' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Amount *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="amount"
                      value={customerData.amount}
                      onChange={handleCustomerChange}
                      required
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Registration Type *</Form.Label>
                  <Form.Select
                    name="registration_type"
                    value={customerData.registration_type}
                    onChange={handleCustomerChange}
                    required
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Membership">Membership</option>
                  </Form.Select>
                </Form.Group>

                <Button variant="primary" type="submit" disabled={loading} className="w-100">
                  {loading ? 'Registering...' : 'Register Customer'}
                </Button>
              </Form>
          )}

          {activeTab === 'staff' && (
              <Form onSubmit={handleStaffSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={staffData.name}
                    onChange={handleStaffChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Username *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={staffData.username}
                    onChange={handleStaffChange}
                    required
                    pattern="[a-zA-Z0-9_]+"
                    title="Username can only contain letters, numbers, and underscores"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={staffData.password}
                    onChange={handleStaffChange}
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={staffData.confirmPassword}
                    onChange={handleStaffChange}
                    required
                    minLength={6}
                  />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={loading} className="w-100">
                  {loading ? 'Registering...' : 'Register Staff'}
                </Button>
              </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Register

