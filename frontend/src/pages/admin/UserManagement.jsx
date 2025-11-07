import { Container, Card, Table, Nav, Modal, Button, Form, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import api from '../../lib/axios'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [customers, setCustomers] = useState([])
  const [activeTab, setActiveTab] = useState('staff')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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

  useEffect(() => {
    fetchUsers()
    fetchCustomers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/all')
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer)
    setEditData({
      name: customer.name || '',
      address: customer.address || '',
      contact_no: customer.contact_no || '',
      payment_method: customer.payment_method || 'Cash',
      amount: customer.amount || '',
      partial_amount: customer.partial_amount || '',
      registration_type: customer.registration_type || 'Monthly',
      expiration_date: customer.expiration_date || ''
    })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedCustomer(null)
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
        handleCloseModal()
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/customers/${selectedCustomer.id}`)
      setSuccess('Customer deleted successfully!')
      fetchCustomers()
      setTimeout(() => {
        handleCloseModal()
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
        handleCloseModal()
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to clear remaining balance')
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (expirationDate) => {
    if (!expirationDate) return false
    // Parse expiration date and compare with today's date (local timezone)
    const expDate = new Date(expirationDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expDate.setHours(0, 0, 0, 0)
    return expDate < today
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Container>
      <h1 className="my-4">User Management</h1>
      <Card>
        <Card.Body>
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="staff">Staff Users</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="customers">Customers</Nav.Link>
            </Nav.Item>
          </Nav>
          
          {activeTab === 'staff' && (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Last Sign In</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name || 'N/A'}</td>
                      <td>{user.username || 'N/A'}</td>
                      <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
          )}

          {activeTab === 'customers' && (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Contact No</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Remaining Amount</th>
                    <th>Registration Type</th>
                    <th>Registered Date</th>
                    <th>Expiration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const expired = isExpired(customer.expiration_date)
                    return (
                      <tr 
                        key={customer.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleCustomerClick(customer)}
                      >
                        <td>
                          <span 
                            className="badge rounded-pill"
                            style={{ 
                              backgroundColor: expired ? '#dc3545' : '#28a745',
                              width: '12px',
                              height: '12px',
                              display: 'inline-block'
                            }}
                            title={expired ? 'Expired' : 'Active'}
                          ></span>
                        </td>
                        <td>
                          {customer.name}
                          {customer.remaining_amount > 0 && (
                            <small className="text-muted d-block">
                              Remaining: ₱{parseFloat(customer.remaining_amount).toFixed(2)}
                            </small>
                          )}
                        </td>
                        <td>{customer.address || 'N/A'}</td>
                        <td>{customer.contact_no || 'N/A'}</td>
                        <td>{customer.payment_method || 'N/A'}</td>
                        <td>₱{customer.amount ? parseFloat(customer.amount).toFixed(2) : '0.00'}</td>
                        <td>₱{customer.remaining_amount ? parseFloat(customer.remaining_amount).toFixed(2) : '0.00'}</td>
                        <td>{customer.registration_type || 'N/A'}</td>
                        <td>{formatDate(customer.start_date || customer.created_at)}</td>
                        <td>{formatDate(customer.expiration_date)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Customer Account Management</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

          {selectedCustomer && (
            <>
              <h5>Customer Details</h5>
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

                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="amount"
                    value={editData.amount}
                    onChange={handleEditChange}
                  />
                </Form.Group>

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

                {selectedCustomer.remaining_amount > 0 && (
                  <Alert variant="warning">
                    <strong>Remaining Balance: ₱{parseFloat(selectedCustomer.remaining_amount).toFixed(2)}</strong>
                  </Alert>
                )}
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedCustomer && selectedCustomer.remaining_amount > 0 && (
            <Button variant="success" onClick={handlePaid} disabled={loading}>
              Paid
            </Button>
          )}
          <Button variant="primary" onClick={handleUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Update'}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default UserManagement
