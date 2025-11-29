import { Container, Card, Table, Row, Col, Form, Alert, Button, Modal } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import api from '../../lib/axios'
import { getTodayLocal, formatDateLocal } from '../../lib/dateUtils'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayLocal())
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: ''
  })

  useEffect(() => {
    fetchExpenses()
  }, [selectedDate])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/expenses?date=${selectedDate}`)
      setExpenses(response.data || [])
      setError('')
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setError('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.name || !formData.amount) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('gymcore_user') || '{}')
      const currentDate = getTodayLocal()
      
      if (editingExpense) {
        // When editing, keep the original date
        await api.put(`/expenses/${editingExpense.id}`, {
          date: editingExpense.date,
          name: formData.name,
          amount: parseFloat(formData.amount),
          staff_id: user.id || null
        })
        setSuccess('Expense updated successfully')
      } else {
        // When creating, use current date
        await api.post('/expenses', {
          date: currentDate,
          name: formData.name,
          amount: parseFloat(formData.amount),
          staff_id: user.id || null
        })
        setSuccess('Expense added successfully')
      }
      
      setShowModal(false)
      setEditingExpense(null)
      setFormData({
        name: '',
        amount: ''
      })
      fetchExpenses()
    } catch (error) {
      console.error('Error saving expense:', error)
      setError(error.response?.data?.error || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      name: expense.name,
      amount: expense.amount.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      setLoading(true)
      await api.delete(`/expenses/${id}`)
      setSuccess('Expense deleted successfully')
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      setError(error.response?.data?.error || 'Failed to delete expense')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingExpense(null)
    setFormData({
      name: '',
      amount: ''
    })
    setError('')
    setSuccess('')
  }

  const handleAddNew = () => {
    setFormData({
      name: '',
      amount: ''
    })
    setShowModal(true)
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)

  return (
    <Container>
      <h1 className="my-4">Expenses</h1>
      
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label><strong>Select Date</strong></Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={8} className="text-end">
              <Button variant="primary" onClick={handleAddNew}>
                Add New Expense
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {loading && expenses.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <Alert variant="info" className="text-center">
              <strong>No expenses recorded for {formatDateLocal(selectedDate)}</strong>
            </Alert>
          ) : (
            <>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Staff</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDateLocal(expense.date)}</td>
                      <td>{expense.name}</td>
                      <td>₱{parseFloat(expense.amount).toFixed(2)}</td>
                      <td>
                        {expense.staff_id && expense.staff ? 
                          (expense.staff.name || expense.staff.username || expense.staff.email || 'Staff') : 
                          'Admin'}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEdit(expense)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2" className="text-end fw-bold">Total Expenses:</td>
                    <td className="fw-bold">₱{totalExpenses.toFixed(2)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            {editingExpense && (
              <Alert variant="info" className="mb-3">
                <strong>Date:</strong> {formatDateLocal(editingExpense.date)}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Electricity, Water, Supplies"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingExpense ? 'Update' : 'Add'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Expenses

