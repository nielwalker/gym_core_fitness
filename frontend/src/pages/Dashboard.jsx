import { Container, Row, Col, Card, Button, Modal, Form, Table, Alert, InputGroup } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isHardcodedAdmin } from '../lib/auth'
import api from '../lib/axios'
import { supabase } from '../lib/supabase'
import { getTodayLocal, isTodayLocal, formatDateLocal } from '../lib/dateUtils'

function Dashboard({ user }) {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState('staff')
  const [stats, setStats] = useState({})
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayLocal())
  const [todayCustomers, setTodayCustomers] = useState([])
  const [todaySales, setTodaySales] = useState([])
  const [todayLogbook, setTodayLogbook] = useState([])
  const [showLogbookModal, setShowLogbookModal] = useState(false)
  const [showLogbookEditModal, setShowLogbookEditModal] = useState(false)
  const [selectedLogbookEntry, setSelectedLogbookEntry] = useState(null)
  const [logbookData, setLogbookData] = useState({
    name: '',
    address: '',
    type: 'walk-in',
    amount: '',
    payment_method: 'Cash'
  })
  const [editLogbookData, setEditLogbookData] = useState({
    name: '',
    address: '',
    type: 'walk-in',
    amount: '',
    payment_method: 'Cash'
  })

  useEffect(() => {
    const fetchData = async () => {
      // Check if user is hardcoded admin
      if (user && isHardcodedAdmin(user)) {
        setUserRole('admin')
        try {
          const [statsResponse, dateResponse] = await Promise.all([
            api.get('/stats/sales'),
            api.get(`/sales/date?date=${selectedDate}`)
          ])
          setStats(statsResponse.data)
          setTodayCustomers(dateResponse.data.customers || [])
          setTodaySales(dateResponse.data.sales || [])
          setTodayLogbook(dateResponse.data.logbook || [])
        } catch (error) {
          console.error('Error fetching data:', error)
        }
        return
      }

      // For Supabase users, fetch role from API
      try {
        const roleResponse = await api.get(`/user/role/${user.id}`)
        setUserRole(roleResponse.data.role)

        if (roleResponse.data.role === 'admin') {
          const [statsResponse, dateResponse] = await Promise.all([
            api.get('/stats/sales'),
            api.get(`/sales/date?date=${selectedDate}`)
          ])
          setStats(statsResponse.data)
          setTodayCustomers(dateResponse.data.customers || [])
          setTodaySales(dateResponse.data.sales || [])
          setTodayLogbook(dateResponse.data.logbook || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [user, selectedDate])

  useEffect(() => {
    if (showSalesModal) {
      fetchProducts()
    }
  }, [showSalesModal])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchDateData = async (date) => {
    try {
      const response = await api.get(`/sales/date?date=${date}`)
      setTodayCustomers(response.data.customers || [])
      setTodaySales(response.data.sales || [])
      setTodayLogbook(response.data.logbook || [])
    } catch (error) {
      console.error('Error fetching date data:', error)
    }
  }



  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
  }

  const calculateTotal = () => {
    if (selectedProduct && quantity) {
      return (parseFloat(selectedProduct.price) * parseInt(quantity)).toFixed(2)
    }
    return '0.00'
  }

  const handleLogbookChange = (e) => {
    const { name, value } = e.target
    setLogbookData({ ...logbookData, [name]: value })
  }

  const handleLogbookSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate amount if type is not regular
      if (logbookData.type !== 'regular' && (!logbookData.amount || parseFloat(logbookData.amount) <= 0)) {
        setError('Amount is required for student and walk-in types')
        setLoading(false)
        return
      }

      let staffId = null
      if (user && isHardcodedAdmin(user)) {
        // For hardcoded admin, use null since admin doesn't exist in users table
        staffId = null
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        staffId = currentUser?.id || user?.id
      }

      await api.post('/logbook', {
        name: logbookData.name,
        address: logbookData.address,
        type: logbookData.type,
        amount: logbookData.type === 'regular' ? null : logbookData.amount,
        payment_method: logbookData.type === 'regular' ? null : logbookData.payment_method,
        staff_id: staffId
      })

      setSuccess('Logbook entry added successfully!')
      setLogbookData({
        name: '',
        address: '',
        type: 'walk-in',
        amount: '',
        payment_method: 'Cash'
      })

      // Refresh stats and logbook if admin
      if (userRole === 'admin') {
        const statsResponse = await api.get('/stats/sales')
        setStats(statsResponse.data)
        fetchDateData(selectedDate)
      }

      setTimeout(() => {
        setShowLogbookModal(false)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add logbook entry')
    } finally {
      setLoading(false)
    }
  }

  const handleLogbookRowClick = (entry) => {
    setSelectedLogbookEntry(entry)
    setEditLogbookData({
      name: entry.name,
      address: entry.address,
      type: entry.type,
      amount: entry.amount ? entry.amount.toString() : '',
      payment_method: entry.payment_method || 'Cash'
    })
    setShowLogbookEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleEditLogbookChange = (e) => {
    const { name, value } = e.target
    setEditLogbookData({ ...editLogbookData, [name]: value })
  }

  const handleEditLogbookSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate amount if type is not regular
      if (editLogbookData.type !== 'regular' && (!editLogbookData.amount || parseFloat(editLogbookData.amount) <= 0)) {
        setError('Amount is required for student and walk-in types')
        setLoading(false)
        return
      }

      await api.put(`/logbook/${selectedLogbookEntry.id}`, {
        name: editLogbookData.name,
        address: editLogbookData.address,
        type: editLogbookData.type,
        amount: editLogbookData.type === 'regular' ? null : editLogbookData.amount,
        payment_method: editLogbookData.type === 'regular' ? null : editLogbookData.payment_method
      })

      setSuccess('Logbook entry updated successfully!')

      // Refresh stats and logbook if admin
      if (userRole === 'admin') {
        const statsResponse = await api.get('/stats/sales')
        setStats(statsResponse.data)
        fetchDateData(selectedDate)
      }

      setTimeout(() => {
        setShowLogbookEditModal(false)
        setSelectedLogbookEntry(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update logbook entry')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLogbook = async () => {
    if (!selectedLogbookEntry) return
    
    if (!window.confirm('Are you sure you want to delete this logbook entry?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/logbook/${selectedLogbookEntry.id}`)
      setSuccess('Logbook entry deleted successfully!')

      // Refresh stats and logbook if admin
      if (userRole === 'admin') {
        const statsResponse = await api.get('/stats/sales')
        setStats(statsResponse.data)
        fetchDateData(selectedDate)
      }

      setTimeout(() => {
        setShowLogbookEditModal(false)
        setSelectedLogbookEntry(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete logbook entry')
    } finally {
      setLoading(false)
    }
  }

  const handleSalesSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProduct) {
      setError('Please select a product')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let staffId = null
      if (user && isHardcodedAdmin(user)) {
        // For hardcoded admin, use null since admin doesn't exist in users table
        staffId = null
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        staffId = currentUser?.id || user?.id
      }
      
      const totalAmount = calculateTotal()

      await api.post('/sales', {
        customer_id: null,
        product_id: selectedProduct.id,
        quantity: quantity,
        total_amount: totalAmount,
        staff_id: staffId
      })
      
      setSuccess('Sale processed successfully!')
      setSelectedProduct(null)
      setQuantity(1)
      setSearchTerm('')
      fetchProducts()
      
      // Refresh stats and today's data if admin
      if (userRole === 'admin') {
        const statsResponse = await api.get('/stats/sales')
        setStats(statsResponse.data)
        fetchDateData(selectedDate)
      }
      
      setTimeout(() => {
        setShowSalesModal(false)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process sale')
    } finally {
      setLoading(false)
    }
  }


  return (
    <Container>
      <h1 className="my-4">Welcome to Gym Core</h1>
      {userRole === 'admin' && (
        <Row className="mb-4">
          <Col md={12}>
            <Card className="h-100 shadow-sm bg-success text-white">
              <Card.Body>
                <Card.Title>Today's Revenue</Card.Title>
                <h2>₱{stats.todayRevenue?.toFixed(2) || '0.00'}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      <Row className="mb-4">
        <Col md={6} className="mb-3">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-100 py-3"
            onClick={() => setShowSalesModal(true)}
          >
            Sales
          </Button>
        </Col>
        <Col md={6} className="mb-3">
          <Button 
            variant="info" 
            size="lg" 
            className="w-100 py-3"
            onClick={() => setShowLogbookModal(true)}
          >
            Log Book
          </Button>
        </Col>
      </Row>

      {userRole === 'admin' && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label><strong>Select Date to View Records</strong></Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={8}>
                  <h5 className="mb-0">
                    {isTodayLocal(selectedDate) ? 'Records for Today' : `Records for ${formatDateLocal(selectedDate)}`}
                  </h5>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    {isTodayLocal(selectedDate) ? 'New Registrations Today' : `New Registrations - ${formatDateLocal(selectedDate)}`}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {todayCustomers.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      {isTodayLocal(selectedDate) ? 'No new registrations today' : `No new registrations for ${formatDateLocal(selectedDate)}`}
                    </Alert>
                  ) : (
                    <>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Payment</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todayCustomers.map((customer) => (
                            <tr key={customer.id}>
                              <td>{customer.name}</td>
                              <td>{customer.contact_no}</td>
                              <td>{customer.payment_method}</td>
                              <td>
                                {customer.payment_method === 'Partial' 
                                  ? `₱${parseFloat(customer.partial_amount || 0).toFixed(2)}`
                                  : `₱${parseFloat(customer.amount || 0).toFixed(2)}`}
                              </td>
                              <td>{customer.registration_type}</td>
                              <td>
                                {customer.staff_id && customer.staff ? 
                                  (customer.staff.name || customer.staff.username || customer.staff.email || 'Staff') : 
                                  'Admin'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end fw-bold">Total:</td>
                            <td className="fw-bold">
                              ₱{todayCustomers.reduce((sum, customer) => {
                                if (customer.payment_method === 'Partial') {
                                  return sum + parseFloat(customer.partial_amount || 0)
                                } else {
                                  return sum + parseFloat(customer.amount || 0)
                                }
                              }, 0).toFixed(2)}
                            </td>
                            <td></td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    {isTodayLocal(selectedDate) ? 'Sales Today' : `Sales - ${formatDateLocal(selectedDate)}`}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {todaySales.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      {isTodayLocal(selectedDate) ? 'No sales today' : `No sales for ${formatDateLocal(selectedDate)}`}
                    </Alert>
                  ) : (
                    <>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Amount</th>
                            <th>Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todaySales.map((sale) => (
                            <tr key={sale.id}>
                              <td>{sale.products?.name || 'N/A'}</td>
                              <td>{sale.quantity}</td>
                              <td>₱{parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                              <td>
                                {sale.staff_id && sale.staff ? 
                                  (sale.staff.name || sale.staff.username || sale.staff.email || 'Staff') : 
                                  'Admin'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="2" className="text-end fw-bold">Total:</td>
                            <td className="fw-bold">
                              ₱{todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    {isTodayLocal(selectedDate) ? 'Log Book Today' : `Log Book - ${formatDateLocal(selectedDate)}`}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {todayLogbook.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      {isTodayLocal(selectedDate) ? 'No logbook entries today' : `No logbook entries for ${formatDateLocal(selectedDate)}`}
                    </Alert>
                  ) : (
                    <>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Type</th>
                            <th>Payment</th>
                            <th>Amount</th>
                            <th>Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todayLogbook.map((entry) => (
                            <tr 
                              key={entry.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleLogbookRowClick(entry)}
                            >
                              <td>{entry.name}</td>
                              <td>{entry.address}</td>
                              <td>{entry.type}</td>
                              <td>{entry.payment_method || '-'}</td>
                              <td>{entry.amount ? `₱${parseFloat(entry.amount).toFixed(2)}` : '-'}</td>
                              <td>
                                {entry.staff_id && entry.staff ? 
                                  (entry.staff.name || entry.staff.username || entry.staff.email || 'Staff') : 
                                  'Admin'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="4" className="text-end fw-bold">Total:</td>
                            <td className="fw-bold">
                              ₱{todayLogbook.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Log Book Edit/Delete Modal */}
      <Modal show={showLogbookEditModal} onHide={() => {
        setShowLogbookEditModal(false)
        setSelectedLogbookEntry(null)
        setEditLogbookData({
          name: '',
          address: '',
          type: 'walk-in',
          amount: '',
          payment_method: 'Cash'
        })
        setError('')
        setSuccess('')
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Edit/Delete Log Book Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleEditLogbookSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editLogbookData.name}
                onChange={handleEditLogbookChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={editLogbookData.address}
                onChange={handleEditLogbookChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type *</Form.Label>
              <Form.Select
                name="type"
                value={editLogbookData.type}
                onChange={handleEditLogbookChange}
                required
              >
                <option value="student">Student</option>
                <option value="regular">Regular</option>
                <option value="walk-in">Walk-in</option>
              </Form.Select>
            </Form.Group>

            {editLogbookData.type !== 'regular' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method *</Form.Label>
                  <Form.Select
                    name="payment_method"
                    value={editLogbookData.payment_method}
                    onChange={handleEditLogbookChange}
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
                    value={editLogbookData.amount}
                    onChange={handleEditLogbookChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </>
            )}

            <div className="d-flex gap-2">
              <Button variant="warning" type="submit" disabled={loading} className="flex-fill">
                {loading ? 'Updating...' : 'Update'}
              </Button>
              <Button 
                variant="danger" 
                type="button" 
                onClick={handleDeleteLogbook}
                disabled={loading}
                className="flex-fill"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Log Book Modal */}
      <Modal show={showLogbookModal} onHide={() => {
        setShowLogbookModal(false)
        setLogbookData({
          name: '',
          address: '',
          type: 'walk-in',
          amount: '',
          payment_method: 'Cash'
        })
        setError('')
        setSuccess('')
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Log Book Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleLogbookSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={logbookData.name}
                onChange={handleLogbookChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={logbookData.address}
                onChange={handleLogbookChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type *</Form.Label>
              <Form.Select
                name="type"
                value={logbookData.type}
                onChange={handleLogbookChange}
                required
              >
                <option value="student">Student</option>
                <option value="regular">Regular</option>
                <option value="walk-in">Walk-in</option>
              </Form.Select>
            </Form.Group>

            {logbookData.type !== 'regular' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method *</Form.Label>
                  <Form.Select
                    name="payment_method"
                    value={logbookData.payment_method}
                    onChange={handleLogbookChange}
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
                    value={logbookData.amount}
                    onChange={handleLogbookChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </>
            )}

            <Button variant="info" type="submit" disabled={loading} className="w-100">
              {loading ? 'Adding...' : 'Add Entry'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Sales Modal */}
      <Modal show={showSalesModal} onHide={() => {
        setShowSalesModal(false)
        setSelectedProduct(null)
        setQuantity(1)
        setSearchTerm('')
        setError('')
        setSuccess('')
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Record Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleSalesSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Search Product</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>

            {filteredProducts.length > 0 ? (
              <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr 
                        key={product.id}
                        className={selectedProduct?.id === product.id ? 'table-primary' : ''}
                      >
                        <td>{product.name}</td>
                        <td>₱{parseFloat(product.price).toFixed(2)}</td>
                        <td>{product.stock_quantity}</td>
                        <td>
                          <Button 
                            variant={selectedProduct?.id === product.id ? 'success' : 'outline-primary'}
                            size="sm"
                            onClick={() => handleProductSelect(product)}
                          >
                            {selectedProduct?.id === product.id ? 'Selected' : 'Select'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <Alert variant="info">No products available or found.</Alert>
            )}

            {selectedProduct && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </Form.Group>
                <Alert variant="info">
                  <strong>Selected Product:</strong> {selectedProduct.name} - ₱{parseFloat(selectedProduct.price).toFixed(2)}
                  <br />
                  <strong>Available Stock:</strong> {selectedProduct.stock_quantity}
                </Alert>
                <Alert variant="success">
                  <strong>Total: ₱{calculateTotal()}</strong>
                </Alert>
              </>
            )}

            <Button variant="primary" type="submit" disabled={loading || !selectedProduct} className="w-100">
              {loading ? 'Processing...' : 'Process Sale'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

    </Container>
  )
}

export default Dashboard

