import { Container, Card, Table, Alert, Modal, Button, Form, InputGroup } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import api from '../lib/axios'

function Users() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showModal, setShowModal] = useState(false)
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
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/customers/all')
      setCustomers(response.data)
      setError('')
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (expirationDate) => {
    if (!expirationDate) return true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiration = new Date(expirationDate)
    expiration.setHours(0, 0, 0, 0)
    return expiration < today
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
      let amount = 0
      let partialAmount = null
      let remainingAmount = 0

      if (editData.payment_method === 'Partial') {
        amount = parseFloat(editData.amount || 0)
        partialAmount = parseFloat(editData.partial_amount || 0)
        remainingAmount = amount - partialAmount
      } else if (editData.payment_method === 'Cash') {
        amount = parseFloat(editData.amount || 0)
        remainingAmount = 0
      } else if (editData.payment_method === 'Gcash') {
        amount = parseFloat(editData.amount || 0)
        remainingAmount = 0
      }

      await api.put(`/customers/${selectedCustomer.id}`, {
        name: editData.name,
        address: editData.address,
        contact_no: editData.contact_no,
        payment_method: editData.payment_method,
        amount: amount,
        partial_amount: partialAmount,
        remaining_amount: remainingAmount,
        registration_type: editData.registration_type,
        expiration_date: editData.expiration_date
      })
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
    if (!window.confirm(`Are you sure you want to delete customer "${selectedCustomer.name}"? This action cannot be undone.`)) {
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
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to clear remaining balance')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    )
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm.trim()) return true
    const searchLower = searchTerm.toLowerCase().trim()
    return customer.name?.toLowerCase().includes(searchLower)
  })

  return (
    <Container>
      <h1 className="my-4">Users</h1>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Form.Group>
            <Form.Label><strong>Search User</strong></Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setSearchTerm('')}
                >
                  Clear
                </Button>
              )}
            </InputGroup>
            {searchTerm && (
              <Form.Text className="text-muted">
                Showing {filteredCustomers.length} result(s) for "{searchTerm}"
              </Form.Text>
            )}
          </Form.Group>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {customers.length === 0 ? (
            <Alert variant="info">No users registered yet.</Alert>
          ) : filteredCustomers.length === 0 ? (
            <Alert variant="warning">
              No users found matching "{searchTerm}". Try a different search term.
            </Alert>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table striped bordered hover responsive>
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
                    <th>Start Date</th>
                    <th>Expiration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const expired = isExpired(customer.expiration_date)
                    return (
                      <tr 
                        key={customer.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleCustomerClick(customer)}
                      >
                        <td>
                          <span 
                            className={`badge ${expired ? 'bg-danger text-white' : 'bg-success text-white'}`}
                            style={{
                              fontSize: '0.875rem',
                              padding: '0.35em 0.65em',
                              fontWeight: '500',
                              backgroundColor: expired ? '#dc3545' : '#28a745'
                            }}
                          >
                            {expired ? 'Expired' : 'Active'}
                          </span>
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
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Edit/Delete Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Customer Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

          {selectedCustomer && (
            <>
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

                {(editData.payment_method === 'Cash' || editData.payment_method === 'Gcash') && (
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
              Mark as Paid
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

export default Users

