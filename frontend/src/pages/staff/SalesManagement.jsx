import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Table, Alert, Modal, Row, Col } from 'react-bootstrap'
import api from '../../lib/axios'
import { supabase } from '../../lib/supabase'
import { getTodayLocal, isTodayLocal, formatDateLocal } from '../../lib/dateUtils'

function SalesManagement() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedDate, setSelectedDate] = useState(getTodayLocal())
  const [daySales, setDaySales] = useState([])
  const [dayStats, setDayStats] = useState({})
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    quantity: 1
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchSales()
    fetchProducts()
    fetchCustomers()
    fetchDaySales(selectedDate)
  }, [])

  useEffect(() => {
    fetchDaySales(selectedDate)
  }, [selectedDate])

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales')
      setSales(response.data)
    } catch (error) {
      console.error('Error fetching sales:', error)
    }
  }

  const fetchDaySales = async (date) => {
    try {
      const response = await api.get(`/sales/date?date=${date}`)
      setDaySales(response.data.sales || [])
      setDayStats(response.data.stats || {})
    } catch (error) {
      console.error('Error fetching day sales:', error)
      setDaySales([])
      setDayStats({})
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers')
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleProductChange = (e) => {
    const productId = e.target.value
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product)
    setFormData({ ...formData, product_id: productId })
  }

  const calculateTotal = () => {
    if (selectedProduct && formData.quantity) {
      return (parseFloat(selectedProduct.price) * parseInt(formData.quantity)).toFixed(2)
    }
    return '0.00'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const totalAmount = calculateTotal()

      await api.post('/sales', {
        ...formData,
        total_amount: totalAmount,
        staff_id: user.id
      })
      setSuccess('Sale processed successfully!')
      setFormData({
        customer_id: '',
        product_id: '',
        quantity: 1
      })
      setSelectedProduct(null)
      fetchSales()
      fetchDaySales(selectedDate)
      fetchProducts() // Refresh to update stock
      setShowModal(false)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process sale')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Sales Management</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + New Sale
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Group>
                <Form.Label><strong>Select Date to View Sales</strong></Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <h5 className="mb-0">
                {isTodayLocal(selectedDate) 
                  ? 'Day Sales (Today)' 
                  : `Day Sales for ${formatDateLocal(selectedDate)}`}
              </h5>
              <p className="text-muted mb-0">
                Revenue: ₱{dayStats.revenue?.toFixed(2) || '0.00'} | 
                Total Sales: {dayStats.count || 0}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {daySales.length === 0 ? (
            <Alert variant="info" className="text-center">
              <strong>No sales recorded for this date</strong>
            </Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {daySales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.created_at).toLocaleString()}</td>
                    <td>{sale.customers?.name || 'N/A'}</td>
                    <td>{sale.products?.name || 'N/A'}</td>
                    <td>{sale.quantity}</td>
                    <td>₱{parseFloat(sale.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Process New Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Customer *</Form.Label>
              <Form.Select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product *</Form.Label>
              <Form.Select
                name="product_id"
                value={formData.product_id}
                onChange={handleProductChange}
                required
              >
                <option value="">Select a product</option>
                {products.filter(p => p.stock_quantity > 0).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₱{product.price} (Stock: {product.stock_quantity})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {selectedProduct && (
              <Alert variant="info">
                Available Stock: {selectedProduct.stock_quantity}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max={selectedProduct?.stock_quantity || 1}
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </Form.Group>
            {selectedProduct && (
              <Alert variant="success">
                <strong>Total: ₱{calculateTotal()}</strong>
              </Alert>
            )}
            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? 'Processing...' : 'Process Sale'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default SalesManagement

