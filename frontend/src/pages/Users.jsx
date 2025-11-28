import { Container, Card, Table, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import api from '../lib/axios'

function Users() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <Container>
      <h1 className="my-4">Users</h1>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Card>
        <Card.Body>
          {customers.length === 0 ? (
            <Alert variant="info">No users registered yet.</Alert>
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
                  {customers.map((customer) => {
                    const expired = isExpired(customer.expiration_date)
                    return (
                      <tr key={customer.id}>
                        <td>
                          <span 
                            className={`badge ${expired ? 'bg-danger' : 'bg-success'}`}
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
    </Container>
  )
}

export default Users

