import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Table, Alert, Modal } from 'react-bootstrap'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import { getTodayLocal, calculateExpirationDateLocal, isExpiredLocal } from '../../lib/dateUtils'

function LockerManagement() {
  const [lockerData, setLockerData] = useState({
    name: '',
    locker_number: '',
    payment_method: 'Cash',
    amount: ''
  })
  const [lockers, setLockers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLocker, setSelectedLocker] = useState(null)
  const [editData, setEditData] = useState({
    name: '',
    locker_number: '',
    payment_method: 'Cash',
    amount: '',
    registered_date: '',
    expiration_date: ''
  })
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchLockers()
    // Get current user for staff_id
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const fetchLockers = async () => {
    try {
      const response = await api.get('/lockers')
      setLockers(response.data)
    } catch (error) {
      console.error('Error fetching lockers:', error)
      setError('Failed to load lockers. Please refresh the page.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setLockerData({ ...lockerData, [name]: value })
  }

  const handleLockerClick = (locker) => {
    setSelectedLocker(locker)
    setEditData({
      name: locker.name || '',
      locker_number: locker.locker_number || '',
      payment_method: locker.payment_method || 'Cash',
      amount: locker.amount ? locker.amount.toString() : '',
      registered_date: locker.registered_date ? locker.registered_date.split('T')[0] : '',
      expiration_date: locker.expiration_date ? locker.expiration_date.split('T')[0] : ''
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
      await api.put(`/lockers/${selectedLocker.id}`, editData)
      setSuccess('Locker updated successfully!')
      fetchLockers()
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedLocker(null)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update locker')
    } finally {
      setLoading(false)
    }
  }

  const handleRenew = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const staffId = currentUser?.id || user?.id

      await api.put(`/lockers/${selectedLocker.id}/renew`, {
        payment_method: editData.payment_method,
        amount: editData.amount,
        staff_id: staffId
      })
      setSuccess('Locker renewed successfully!')
      fetchLockers()
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedLocker(null)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to renew locker')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this locker registration?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/lockers/${selectedLocker.id}`)
      setSuccess('Locker deleted successfully!')
      fetchLockers()
      setTimeout(() => {
        setShowEditModal(false)
        setSelectedLocker(null)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete locker')
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
      const amount = parseFloat(lockerData.amount || 0)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      // Get staff_id
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      const staffId = currentUser?.id || user?.id

      // Create new locker registration
      const lockerPayload = {
        name: lockerData.name.trim(),
        locker_number: lockerData.locker_number.toString().trim(),
        payment_method: lockerData.payment_method,
        amount: amount,
        staff_id: staffId
      }

      await api.post('/lockers', lockerPayload)
      setSuccess('Locker registered successfully!')
      setLockerData({
        name: '',
        locker_number: '',
        payment_method: 'Cash',
        amount: ''
      })
      fetchLockers()
      setTimeout(() => {
        setShowModal(false)
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to register locker')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Locker Management</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Register User to Locker
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          {lockers.length === 0 ? (
            <Alert variant="info">No locker registrations yet.</Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Locker Number</th>
                  <th>Registered Date</th>
                  <th>Expiration Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lockers.map((locker) => {
                  const expirationDate = locker.expiration_date ? new Date(locker.expiration_date) : null
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  if (expirationDate) expirationDate.setHours(0, 0, 0, 0)
                  const isExpired = expirationDate && expirationDate < today
                  
                  return (
                    <tr 
                      key={locker.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleLockerClick(locker)}
                    >
                      <td>{locker.name}</td>
                      <td>{locker.locker_number}</td>
                      <td>{locker.registered_date ? new Date(locker.registered_date).toLocaleDateString() : 'N/A'}</td>
                      <td>{locker.expiration_date ? new Date(locker.expiration_date).toLocaleDateString() : 'N/A'}</td>
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

      {/* Register Locker Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false)
        setError('')
        setSuccess('')
        setLockerData({
          name: '',
          locker_number: '',
          payment_method: 'Cash',
          amount: ''
        })
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Register User to Locker</Modal.Title>
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
                value={lockerData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Locker Number *</Form.Label>
              <Form.Control
                type="text"
                name="locker_number"
                value={lockerData.locker_number}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="payment_method"
                value={lockerData.payment_method}
                onChange={handleChange}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Gcash">Gcash</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="amount"
                value={lockerData.amount}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? 'Registering...' : 'Register User to Locker'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit/Renew/Delete Locker Modal */}
      <Modal show={showEditModal} onHide={() => {
        setShowEditModal(false)
        setSelectedLocker(null)
        setError('')
        setSuccess('')
        setEditData({
          name: '',
          locker_number: '',
          payment_method: 'Cash',
          amount: '',
          registered_date: '',
          expiration_date: ''
        })
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update/Renew/Delete Locker</Modal.Title>
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
              <Form.Label>Locker Number *</Form.Label>
              <Form.Control
                type="text"
                name="locker_number"
                value={editData.locker_number}
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
              </Form.Select>
            </Form.Group>

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

            <Form.Group className="mb-3">
              <Form.Label>Registered Date *</Form.Label>
              <Form.Control
                type="date"
                name="registered_date"
                value={editData.registered_date}
                onChange={handleEditChange}
                required
              />
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

            <div className="d-flex gap-2">
              <Button 
                variant="warning" 
                onClick={handleUpdate} 
                disabled={loading} 
                className="flex-fill"
              >
                {loading ? 'Updating...' : 'Update'}
              </Button>
              <Button 
                variant="info" 
                onClick={handleRenew} 
                disabled={loading} 
                className="flex-fill"
              >
                {loading ? 'Renewing...' : 'Renew'}
              </Button>
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

export default LockerManagement

