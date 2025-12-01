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
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayLocal())
  const [todayCustomers, setTodayCustomers] = useState([])
  const [todaySales, setTodaySales] = useState([])
  const [todayLogbook, setTodayLogbook] = useState([])
  const [todayNotes, setTodayNotes] = useState([])
  const [showLogbookModal, setShowLogbookModal] = useState(false)
  const [showLogbookEditModal, setShowLogbookEditModal] = useState(false)
  const [selectedLogbookEntry, setSelectedLogbookEntry] = useState(null)
  const [logbookData, setLogbookData] = useState({
    name: '',
    address: '',
    type: 'walk-in',
    amount: '',
    payment_method: 'Cash',
    note: ''
  })
  const [recordType, setRecordType] = useState('New')
  const [logbookSearchTerm, setLogbookSearchTerm] = useState('')
  const [logbookSearchResults, setLogbookSearchResults] = useState([])
  const [selectedOldRecord, setSelectedOldRecord] = useState(null)
  const [searchingLogbook, setSearchingLogbook] = useState(false)
  const [editLogbookData, setEditLogbookData] = useState({
    name: '',
    address: '',
    type: 'walk-in',
    amount: '',
    payment_method: 'Cash',
    note: ''
  })
  const [showSaleEditModal, setShowSaleEditModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [editSaleData, setEditSaleData] = useState({
    product_id: '',
    quantity: 1,
    payment_method: 'Cash'
  })
  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [editCustomerData, setEditCustomerData] = useState({
    name: '',
    address: '',
    contact_no: '',
    payment_method: 'Cash',
    amount: '',
    partial_amount: '',
    registration_type: 'Monthly'
  })
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showNotesEditModal, setShowNotesEditModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [notesData, setNotesData] = useState({
    name: '',
    note: '',
    amount: '',
    date: getTodayLocal()
  })
  const [editNotesData, setEditNotesData] = useState({
    name: '',
    note: '',
    amount: '',
    date: getTodayLocal()
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
          setTodayNotes(dateResponse.data.notes || [])
        } catch (error) {
          console.error('Error fetching data:', error)
        }
        return
      }

      // For Supabase users, fetch role from API
      try {
        const roleResponse = await api.get(`/user/role/${user.id}`)
        setUserRole(roleResponse.data.role)

        // Fetch stats and date data for both admin and staff
        const [statsResponse, dateResponse] = await Promise.all([
          api.get('/stats/sales'),
          api.get(`/sales/date?date=${selectedDate}`)
        ])
        setStats(statsResponse.data)
        setTodayCustomers(dateResponse.data.customers || [])
        setTodaySales(dateResponse.data.sales || [])
        setTodayLogbook(dateResponse.data.logbook || [])
        setTodayNotes(dateResponse.data.notes || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [user, selectedDate])

  useEffect(() => {
    if (showSalesModal || showSaleEditModal) {
      fetchProducts()
    }
  }, [showSalesModal, showSaleEditModal])

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
      setTodayNotes(response.data.notes || [])
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

  const handleRecordTypeChange = (e) => {
    const newType = e.target.value
    setRecordType(newType)
    setLogbookSearchTerm('')
    setLogbookSearchResults([])
    setSelectedOldRecord(null)
    if (newType === 'New') {
      setLogbookData({
        name: '',
        address: '',
        type: 'walk-in',
        amount: '',
        payment_method: 'Cash',
        note: ''
      })
    }
  }

  const handleLogbookSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      setLogbookSearchResults([])
      return
    }

    setSearchingLogbook(true)
    try {
      const response = await api.get(`/logbook/all?search=${encodeURIComponent(searchTerm)}`)
      setLogbookSearchResults(response.data || [])
    } catch (error) {
      console.error('Error searching logbook:', error)
      setError('Failed to search logbook records')
    } finally {
      setSearchingLogbook(false)
    }
  }

  const handleOldRecordSelect = (record) => {
    setSelectedOldRecord(record)
    setLogbookData({
      name: record.name || '',
      address: record.address || '',
      type: record.type || 'walk-in',
      amount: record.amount ? record.amount.toString() : '',
      payment_method: record.payment_method || 'Cash',
      note: record.note || ''
    })
  }

  const handleLogbookSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate amount for all types
      if (!logbookData.amount || parseFloat(logbookData.amount) <= 0) {
        setError('Amount is required')
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
        amount: logbookData.amount ? parseFloat(logbookData.amount) : null,
        payment_method: logbookData.payment_method || null,
        staff_id: staffId,
        note: logbookData.note || null
      })

      setSuccess('Logbook entry added successfully!')
      setLogbookData({
        name: '',
        address: '',
        type: 'walk-in',
        amount: '',
        payment_method: 'Cash',
        note: ''
      })

      // Refresh stats and logbook
      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)

      // Don't auto-close - let user close manually with close icon
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
      payment_method: entry.payment_method || 'Cash',
      note: entry.note || ''
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
      // Validate amount for all types
      if (!editLogbookData.amount || parseFloat(editLogbookData.amount) <= 0) {
        setError('Amount is required')
        setLoading(false)
        return
      }

      await api.put(`/logbook/${selectedLogbookEntry.id}`, {
        name: editLogbookData.name,
        address: editLogbookData.address,
        type: editLogbookData.type,
        amount: editLogbookData.amount ? parseFloat(editLogbookData.amount) : null,
        payment_method: editLogbookData.payment_method || null,
        note: editLogbookData.note || null
      })

      setSuccess('Logbook entry updated successfully!')

      // Refresh stats and logbook
      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)

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

      // Refresh stats and logbook
      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)

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

  const handleSaleClick = (sale) => {
    setSelectedSale(sale)
    setEditSaleData({
      product_id: sale.product_id,
      quantity: sale.quantity,
      payment_method: sale.payment_method || 'Cash'
    })
    setShowSaleEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleEditSaleChange = (e) => {
    const { name, value } = e.target
    setEditSaleData({ ...editSaleData, [name]: value })
  }

  const handleUpdateSale = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const product = products.find(p => p.id === editSaleData.product_id)
      if (!product) {
        setError('Please select a valid product')
        setLoading(false)
        return
      }

      const totalAmount = (parseFloat(product.price) * parseInt(editSaleData.quantity)).toFixed(2)

      await api.put(`/sales/${selectedSale.id}`, {
        product_id: editSaleData.product_id,
        quantity: parseInt(editSaleData.quantity),
        total_amount: totalAmount,
        payment_method: editSaleData.payment_method || null
      })

      setSuccess('Sale updated successfully!')
      fetchProducts()
      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)

      setTimeout(() => {
        setShowSaleEditModal(false)
        setSelectedSale(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update sale')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSale = async () => {
    if (!selectedSale) return
    
    if (!window.confirm('Are you sure you want to delete this sale? This will restore the product stock.')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/sales/${selectedSale.id}`)
      setSuccess('Sale deleted successfully!')

      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)

      setTimeout(() => {
        setShowSaleEditModal(false)
        setSelectedSale(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete sale')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer)
    setEditCustomerData({
      name: customer.name || '',
      address: customer.address || '',
      contact_no: customer.contact_no || '',
      payment_method: customer.payment_method || 'Cash',
      amount: customer.amount ? customer.amount.toString() : '',
      partial_amount: customer.partial_amount ? customer.partial_amount.toString() : '',
      registration_type: customer.registration_type || 'Monthly'
    })
    setShowCustomerEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleEditCustomerChange = (e) => {
    const { name, value } = e.target
    setEditCustomerData({ ...editCustomerData, [name]: value })
  }

  const handleUpdateCustomer = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let amount = 0
      let partialAmount = null
      let remainingAmount = 0

      if (editCustomerData.payment_method === 'Partial') {
        amount = parseFloat(editCustomerData.amount || 0)
        partialAmount = parseFloat(editCustomerData.partial_amount || 0)
        remainingAmount = amount - partialAmount
      } else if (editCustomerData.payment_method === 'Cash') {
        amount = parseFloat(editCustomerData.amount || 0)
        remainingAmount = 0
      } else if (editCustomerData.payment_method === 'Gcash') {
        amount = parseFloat(editCustomerData.amount || 0)
        remainingAmount = 0
      }

      await api.put(`/customers/${selectedCustomer.id}`, {
        name: editCustomerData.name,
        address: editCustomerData.address,
        contact_no: editCustomerData.contact_no,
        payment_method: editCustomerData.payment_method,
        amount: amount,
        partial_amount: partialAmount,
        remaining_amount: remainingAmount,
        registration_type: editCustomerData.registration_type
      })

      setSuccess('Customer updated successfully!')
      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)

      setTimeout(() => {
        setShowCustomerEditModal(false)
        setSelectedCustomer(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return
    
    if (!window.confirm('Are you sure you want to delete this customer registration?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/customers/${selectedCustomer.id}`)
      setSuccess('Customer deleted successfully!')

      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)

      setTimeout(() => {
        setShowCustomerEditModal(false)
        setSelectedCustomer(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete customer')
    } finally {
      setLoading(false)
    }
  }

  const handleNotesChange = (e) => {
    const { name, value } = e.target
    setNotesData({ ...notesData, [name]: value })
  }

  const handleNotesSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let staffId = null
      if (user && isHardcodedAdmin(user)) {
        staffId = null
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        staffId = currentUser?.id || user?.id
      }

      await api.post('/notes', {
        name: notesData.name.trim(),
        note: notesData.note?.trim() || null,
        amount: notesData.amount ? parseFloat(notesData.amount) : null,
        date: notesData.date,
        staff_id: staffId
      })

      setSuccess('Note added successfully!')
      setNotesData({
        name: '',
        note: '',
        amount: '',
        date: selectedDate
      })
      fetchDateData(selectedDate)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  const handleNoteClick = (note) => {
    setSelectedNote(note)
    setEditNotesData({
      name: note.name,
      note: note.note || '',
      amount: note.amount ? note.amount.toString() : '',
      date: note.date
    })
    setShowNotesEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleEditNotesChange = (e) => {
    const { name, value } = e.target
    setEditNotesData({ ...editNotesData, [name]: value })
  }

  const handleEditNotesSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.put(`/notes/${selectedNote.id}`, {
        name: editNotesData.name.trim(),
        note: editNotesData.note?.trim() || null,
        amount: editNotesData.amount ? parseFloat(editNotesData.amount) : null,
        date: editNotesData.date
      })

      setSuccess('Note updated successfully!')
      fetchDateData(selectedDate)

      setTimeout(() => {
        setShowNotesEditModal(false)
        setSelectedNote(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update note')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!selectedNote) return
    
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/notes/${selectedNote.id}`)
      setSuccess('Note deleted successfully!')
      fetchDateData(selectedDate)

      setTimeout(() => {
        setShowNotesEditModal(false)
        setSelectedNote(null)
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete note')
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
        staff_id: staffId,
        payment_method: paymentMethod || 'Cash'
      })
      
      setSuccess('Sale processed successfully!')
      setSelectedProduct(null)
      setQuantity(1)
      setPaymentMethod('Cash')
      setSearchTerm('')
      fetchProducts()
      
      // Refresh stats and today's data
      const statsResponse = await api.get('/stats/sales')
      setStats(statsResponse.data)
      fetchDateData(selectedDate)
      
      // Don't auto-close - let user close manually with close icon
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to process sale')
    } finally {
      setLoading(false)
    }
  }


  return (
    <Container>
      <h1 className="my-4">Welcome to Gym Core</h1>
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
                            <tr 
                              key={customer.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleCustomerClick(customer)}
                            >
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
                            <th>Payment Method</th>
                            <th>Amount</th>
                            <th>Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todaySales.map((sale) => (
                            <tr 
                              key={sale.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleSaleClick(sale)}
                            >
                              <td>{sale.product?.name || 'N/A'}</td>
                              <td>{sale.quantity}</td>
                              <td>{sale.payment_method || 'Cash'}</td>
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
                            <td colSpan="3" className="text-end fw-bold">Total:</td>
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
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {isTodayLocal(selectedDate) ? 'Notes' : `Notes - ${formatDateLocal(selectedDate)}`}
                  </h5>
                  {isHardcodedAdmin(user) && (
                    <Button variant="primary" size="sm" onClick={() => {
                      setNotesData({
                        name: '',
                        note: '',
                        amount: '',
                        date: selectedDate
                      })
                      setShowNotesModal(true)
                    }}>
                      + Add Note
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  {todayNotes.length === 0 ? (
                    <Alert variant="info" className="mb-0">
                      {isTodayLocal(selectedDate) ? 'No notes today' : `No notes for ${formatDateLocal(selectedDate)}`}
                    </Alert>
                  ) : (
                    <>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Note</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Staff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todayNotes.map((note) => (
                            <tr 
                              key={note.id}
                              style={{ cursor: isHardcodedAdmin(user) ? 'pointer' : 'default' }}
                              onClick={() => isHardcodedAdmin(user) && handleNoteClick(note)}
                            >
                              <td>{note.name}</td>
                              <td>{note.note || '-'}</td>
                              <td>{note.amount ? `₱${parseFloat(note.amount).toFixed(2)}` : '-'}</td>
                              <td>{note.date}</td>
                              <td>
                                {note.staff_id && note.staff ? 
                                  (note.staff.name || note.staff.username || note.staff.email || 'Staff') : 
                                  'Admin'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
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

      {/* Log Book Edit/Delete Modal */}
      <Modal show={showLogbookEditModal} onHide={() => {
        setShowLogbookEditModal(false)
        setSelectedLogbookEntry(null)
        setEditLogbookData({
          name: '',
          address: '',
          type: 'walk-in',
          amount: '',
          payment_method: 'Cash',
          note: ''
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

            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="note"
                value={editLogbookData.note}
                onChange={handleEditLogbookChange}
                placeholder="Enter optional note"
              />
            </Form.Group>

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
          payment_method: 'Cash',
          note: ''
        })
        setRecordType('New')
        setLogbookSearchTerm('')
        setLogbookSearchResults([])
        setSelectedOldRecord(null)
        setError('')
        setSuccess('')
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Log Book Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleLogbookSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Record *</Form.Label>
              <Form.Select
                value={recordType}
                onChange={handleRecordTypeChange}
                required
              >
                <option value="New">New</option>
                <option value="Old">Old</option>
              </Form.Select>
            </Form.Group>

            {recordType === 'Old' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Search Log Book Records</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Search by name..."
                      value={logbookSearchTerm}
                      onChange={(e) => {
                        const term = e.target.value
                        setLogbookSearchTerm(term)
                        handleLogbookSearch(term)
                      }}
                    />
                    {logbookSearchTerm && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                          setLogbookSearchTerm('')
                          setLogbookSearchResults([])
                          setSelectedOldRecord(null)
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </InputGroup>
                </Form.Group>

                {logbookSearchResults.length > 0 && !selectedOldRecord && (
                  <div className="mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Type</th>
                          <th>Payment</th>
                          <th>Amount</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logbookSearchResults.map((record) => (
                          <tr 
                            key={record.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOldRecordSelect(record)}
                          >
                            <td>{record.name}</td>
                            <td>{record.address}</td>
                            <td>{record.type}</td>
                            <td>{record.payment_method || '-'}</td>
                            <td>{record.amount ? `₱${parseFloat(record.amount).toFixed(2)}` : '-'}</td>
                            <td>{new Date(record.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {selectedOldRecord && (
                  <Alert variant="info" className="mb-3">
                    Selected: <strong>{selectedOldRecord.name}</strong> - Click below to edit details before logging in.
                  </Alert>
                )}
              </>
            )}

            {(recordType === 'New' || selectedOldRecord) && (
              <>
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

                <Form.Group className="mb-3">
                  <Form.Label>Note</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="note"
                    value={logbookData.note}
                    onChange={handleLogbookChange}
                    placeholder="Enter optional note"
                  />
                </Form.Group>

                <Button variant="info" type="submit" disabled={loading} className="w-100">
                  {loading ? 'Logging in...' : 'Log in'}
                </Button>
              </>
            )}

            {recordType === 'Old' && !selectedOldRecord && logbookSearchTerm && logbookSearchResults.length === 0 && !searchingLogbook && (
              <Alert variant="info">
                No records found. Try a different search term or select "New" to create a new entry.
              </Alert>
            )}
          </Form>
        </Modal.Body>
      </Modal>

      {/* Sales Modal */}
      <Modal show={showSalesModal} onHide={() => {
        setShowSalesModal(false)
        setSelectedProduct(null)
        setQuantity(1)
        setPaymentMethod('Cash')
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
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method *</Form.Label>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Gcash">Gcash</option>
                  </Form.Select>
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

      {/* Sale Edit Modal */}
      <Modal show={showSaleEditModal} onHide={() => {
        setShowSaleEditModal(false)
        setSelectedSale(null)
        setError('')
        setSuccess('')
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleUpdateSale}>
            <Form.Group className="mb-3">
              <Form.Label>Product *</Form.Label>
              <Form.Select
                name="product_id"
                value={editSaleData.product_id}
                onChange={handleEditSaleChange}
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₱{parseFloat(product.price).toFixed(2)} (Stock: {product.stock_quantity})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                name="quantity"
                value={editSaleData.quantity}
                onChange={handleEditSaleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="payment_method"
                value={editSaleData.payment_method}
                onChange={handleEditSaleChange}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Gcash">Gcash</option>
              </Form.Select>
            </Form.Group>

            {editSaleData.product_id && (
              <Alert variant="info">
                <strong>Total: ₱{(() => {
                  const product = products.find(p => p.id === editSaleData.product_id)
                  if (product && editSaleData.quantity) {
                    return (parseFloat(product.price) * parseInt(editSaleData.quantity)).toFixed(2)
                  }
                  return '0.00'
                })()}</strong>
              </Alert>
            )}

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading} className="flex-fill">
                {loading ? 'Updating...' : 'Update Sale'}
              </Button>
              <Button variant="danger" onClick={handleDeleteSale} disabled={loading}>
                Delete
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Notes Modal */}
      <Modal show={showNotesModal} onHide={() => {
        setShowNotesModal(false)
        setNotesData({
          name: '',
          note: '',
          amount: '',
          date: selectedDate
        })
        setError('')
        setSuccess('')
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleNotesSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={notesData.name}
                onChange={handleNotesChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="note"
                value={notesData.note}
                onChange={handleNotesChange}
                placeholder="Enter optional note"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="amount"
                value={notesData.amount}
                onChange={handleNotesChange}
                min="0"
                placeholder="Enter optional amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={notesData.date}
                onChange={handleNotesChange}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? 'Adding...' : 'Add Note'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Notes Edit Modal */}
      <Modal show={showNotesEditModal} onHide={() => {
        setShowNotesEditModal(false)
        setSelectedNote(null)
        setError('')
        setSuccess('')
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Edit/Delete Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleEditNotesSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editNotesData.name}
                onChange={handleEditNotesChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Note</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="note"
                value={editNotesData.note}
                onChange={handleEditNotesChange}
                placeholder="Enter optional note"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="amount"
                value={editNotesData.amount}
                onChange={handleEditNotesChange}
                min="0"
                placeholder="Enter optional amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={editNotesData.date}
                onChange={handleEditNotesChange}
                required
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="warning" type="submit" disabled={loading} className="flex-fill">
                {loading ? 'Updating...' : 'Update'}
              </Button>
              <Button 
                variant="danger" 
                type="button" 
                onClick={handleDeleteNote}
                disabled={loading}
                className="flex-fill"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Customer Edit Modal */}
      <Modal show={showCustomerEditModal} onHide={() => {
        setShowCustomerEditModal(false)
        setSelectedCustomer(null)
        setError('')
        setSuccess('')
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Customer Registration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Form onSubmit={handleUpdateCustomer}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editCustomerData.name}
                onChange={handleEditCustomerChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={editCustomerData.address}
                onChange={handleEditCustomerChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact No *</Form.Label>
              <Form.Control
                type="tel"
                name="contact_no"
                value={editCustomerData.contact_no}
                onChange={handleEditCustomerChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="payment_method"
                value={editCustomerData.payment_method}
                onChange={handleEditCustomerChange}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Gcash">Gcash</option>
                <option value="Partial">Partial</option>
              </Form.Select>
            </Form.Group>

            {editCustomerData.payment_method === 'Partial' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Partial Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="partial_amount"
                    value={editCustomerData.partial_amount}
                    onChange={handleEditCustomerChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="amount"
                    value={editCustomerData.amount}
                    onChange={handleEditCustomerChange}
                    required
                  />
                </Form.Group>
              </>
            )}

            {(editCustomerData.payment_method === 'Cash' || editCustomerData.payment_method === 'Gcash') && (
              <Form.Group className="mb-3">
                <Form.Label>Amount *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="amount"
                  value={editCustomerData.amount}
                  onChange={handleEditCustomerChange}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Registration Type *</Form.Label>
              <Form.Select
                name="registration_type"
                value={editCustomerData.registration_type}
                onChange={handleEditCustomerChange}
                required
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading} className="flex-fill">
                {loading ? 'Updating...' : 'Update Customer'}
              </Button>
              <Button variant="danger" onClick={handleDeleteCustomer} disabled={loading}>
                Delete
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default Dashboard

