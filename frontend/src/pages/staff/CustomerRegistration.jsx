import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Table, Alert, Modal } from 'react-bootstrap'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import { getTodayLocal, calculateExpirationDateLocal } from '../../lib/dateUtils'

function CustomerRegistration() {
  const [customerData, setCustomerData] = useState({
    name: '',
    address: '',
    contact_no: '',
    payment_method: 'Cash',
    amount: '',
    partial_amount: '',
    registration_type: 'Monthly'
  })
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [editData, setEditData] = useState({
    name: '',
    address: '',
    contact_no: '',
    payment_method: 'Cash',
    amount: '',
    partial_amount: '',
    registration_type: 'Monthly',
    expiration_date: ''
  })
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchCustomers()
    // Get current user for staff_id
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/all')
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Failed to load customers. Please refresh the page.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setCustomerData({ ...customerData, [name]: value })
  }

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer)
    setEditData({
      name: customer.name || '',
      address: customer.address || '',
      contact_no: customer.contact_no || '',
      payment_method: customer.payment_method || 'Cash',
      amount: customer.amount ? customer.amount.toString() : '',
      partial_amount: customer.partial_amount ? customer.partial_amount.toString() : '',
      registration_type: customer.registration_type || 'Monthly',
      expiration_date: customer.expiration_date ? customer.expiration_date.split('T')[0] : ''
    })
    setShowEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData({ ...editData, [name]: value })
  }

  const handleUpdate = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.put(`/customers/${selectedCustomer.id}`, editData)
      setSuccess('Customer updated successfully!')
      fetchCustomers()
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedCustomer(null)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/customers/${selectedCustomer.id}`)
      setSuccess('Customer deleted successfully!')
      fetchCustomers()
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedCustomer(null)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete customer')
    } finally {
      setLoading(false)
    }
  }

  const handlePaid = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.put(`/customers/${selectedCustomer.id}/paid`, {})
      setSuccess('Remaining balance cleared successfully!')
      fetchCustomers()
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedCustomer(null)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to clear remaining balance')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
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
        amount = parseFloat(customerData.amount || 0)
        partialAmount = parseFloat(customerData.partial_amount || 0)
        remainingAmount = amount - partialAmount
      } else if (customerData.payment_method === 'Cash') {
        amount = parseFloat(customerData.amount || 0)
        remainingAmount = 0
      } else if (customerData.payment_method === 'Gcash') {
        amount = parseFloat(customerData.amount || 0)
        remainingAmount = 0
      }

      // Check if customer exists
      try {
        const checkResponse = await api.get(`/customers/check?contact_no=${encodeURIComponent(customerData.contact_no)}`)
        if (checkResponse.data && checkResponse.data.exists) {
          const existingCustomer = checkResponse.data.customer
          const isActive = checkResponse.data.isActive

          if (isActive) {
            setError('This user is already Registered and Active')
            setLoading(false)
            return
          }

          // Customer exists but expired - allow renewal for Monthly registration
          if (customerData.registration_type === 'Monthly') {
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            const staffId = currentUser?.id || user?.id

            await api.post('/customers/renew', {
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
            fetchCustomers()
            setTimeout(() => {
              setShowModal(false)
            }, 1500)
            setLoading(false)
            return
          } else {
            setError('This user is already Registered and Active')
            setLoading(false)
            return
          }
        }
      } catch (checkError) {
        // Customer doesn't exist, proceed with new registration
      }

      // Get staff_id
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const staffId = currentUser?.id || user?.id

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
      fetchCustomers()
      setTimeout(() => {
        setShowModal(false)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Customer Registration</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Register New Customer
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          {customers.length === 0 ? (
            <Alert variant="info">No customers registered yet.</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Contact No</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Remaining</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>Expiration Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const expirationDate = customer.expiration_date ? new Date(customer.expiration_date) : null
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  if (expirationDate) expirationDate.setHours(0, 0, 0, 0)
                  const isExpired = expirationDate && expirationDate < today
                  
                  return (
                    <tr 
                      key={customer.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <td>{customer.name}</td>
                      <td>{customer.address || 'N/A'}</td>
                      <td>{customer.contact_no}</td>
                      <td>{customer.payment_method || 'N/A'}</td>
                      <td>₱{customer.amount ? parseFloat(customer.amount).toFixed(2) : '0.00'}</td>
                      <td>₱{customer.remaining_amount ? parseFloat(customer.remaining_amount).toFixed(2) : '0.00'}</td>
                      <td>{customer.registration_type || 'N/A'}</td>
                      <td>{customer.start_date ? new Date(customer.start_date).toLocaleDateString() : 'N/A'}</td>
                      <td>{customer.expiration_date ? new Date(customer.expiration_date).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`badge ${isExpired ? 'bg-danger' : 'bg-success'}`}>
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => {
        setShowModal(false)
        setError('')
        setSuccess('')
        setCustomerData({
          name: '',
          address: '',
          contact_no: '',
          payment_method: 'Cash',
          amount: '',
          partial_amount: '',
          registration_type: 'Monthly'
        })
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Register New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={customerData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={customerData.address}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact No *</Form.Label>
              <Form.Control
                type="tel"
                name="contact_no"
                value={customerData.contact_no}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="payment_method"
                value={customerData.payment_method}
                onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            )}

            {customerData.payment_method === 'Gcash' && (
              <Form.Group className="mb-3">
                <Form.Label>Amount *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="amount"
                  value={customerData.amount}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Registration Type *</Form.Label>
              <Form.Select
                name="registration_type"
                value={customerData.registration_type}
                onChange={handleChange}
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
        </Modal.Body>
      </Modal>

      {/* Edit/Delete Customer Modal */}
      <Modal show={showEditModal} onHide={() => {
        setShowEditModal(false)
        setSelectedCustomer(null)
        setError('')
        setSuccess('')
        setEditData({
          name: '',
          address: '',
          contact_no: '',
          payment_method: 'Cash',
          amount: '',
          partial_amount: '',
          registration_type: 'Monthly',
          expiration_date: ''
        })
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit/Delete Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={editData.address}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact No *</Form.Label>
              <Form.Control
                type="tel"
                name="contact_no"
                value={editData.contact_no}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="payment_method"
                value={editData.payment_method}
                onChange={handleEditChange}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Gcash">Gcash</option>
                <option value="Partial">Partial</option>
              </Form.Select>
            </Form.Group>

            {editData.payment_method === 'Partial' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Partial Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="partial_amount"
                    value={editData.partial_amount}
                    onChange={handleEditChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="amount"
                    value={editData.amount}
                    onChange={handleEditChange}
                    required
                  />
                </Form.Group>
              </>
            )}

            {editData.payment_method === 'Cash' && (
              <Form.Group className="mb-3">
                <Form.Label>Amount *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="amount"
                  value={editData.amount}
                  onChange={handleEditChange}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Registration Type *</Form.Label>
              <Form.Select
                name="registration_type"
                value={editData.registration_type}
                onChange={handleEditChange}
                required
              >
                <option value="Monthly">Monthly</option>
                <option value="Membership">Membership</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Expiration Date *</Form.Label>
              <Form.Control
                type="date"
                name="expiration_date"
                value={editData.expiration_date}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            {selectedCustomer && selectedCustomer.remaining_amount > 0 && (
              <Alert variant="warning" className="mb-3">
                <strong>Remaining Balance:</strong> ₱{parseFloat(selectedCustomer.remaining_amount).toFixed(2)}
              </Alert>
            )}

            <div className="d-flex gap-2">
              <Button 
                variant="warning" 
                onClick={handleUpdate} 
                disabled={loading} 
                className="flex-fill"
              >
                {loading ? 'Updating...' : 'Update'}
              </Button>
              {selectedCustomer && selectedCustomer.remaining_amount > 0 && (
                <Button 
                  variant="info" 
                  onClick={handlePaid} 
                  disabled={loading} 
                  className="flex-fill"
                >
                  {loading ? 'Processing...' : 'Mark as Paid'}
                </Button>
              )}
              <Button 
                variant="danger" 
                onClick={handleDelete} 
                disabled={loading} 
                className="flex-fill"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default CustomerRegistration

