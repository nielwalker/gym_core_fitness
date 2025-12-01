import { Container, Card, Table, Row, Col, Form, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import api from '../../lib/axios'
import { getTodayLocal, isTodayLocal, formatDateLocal } from '../../lib/dateUtils'

function SalesTracking() {
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState({})
  const [selectedDate, setSelectedDate] = useState(getTodayLocal())
  const [daySales, setDaySales] = useState([])
  const [dayCustomers, setDayCustomers] = useState([])
  const [dayLogbook, setDayLogbook] = useState([])
  const [dayExpenses, setDayExpenses] = useState([])
  const [dayStats, setDayStats] = useState({})

  useEffect(() => {
    fetchSales()
    fetchStats()
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

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/sales')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchDaySales = async (date) => {
    try {
      const response = await api.get(`/sales/date?date=${date}`)
      setDaySales(response.data.sales || [])
      setDayCustomers(response.data.customers || [])
      setDayLogbook(response.data.logbook || [])
      setDayExpenses(response.data.expenses || [])
      setDayStats(response.data.stats || {})
    } catch (error) {
      console.error('Error fetching day sales:', error)
      setDaySales([])
      setDayCustomers([])
      setDayLogbook([])
      setDayExpenses([])
      setDayStats({})
    }
  }


  return (
    <Container>
      <h1 className="my-4">Sales Tracking</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="bg-success text-white">
            <Card.Body>
              <Card.Title>Today's Revenue</Card.Title>
              <h3>₱{stats.todayRevenue?.toFixed(2) || '0.00'}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="bg-primary text-white">
            <Card.Body>
              <Card.Title>Net Revenue</Card.Title>
              <h3>₱{stats.todayNetRevenue?.toFixed(2) || stats.todayRevenue?.toFixed(2) || '0.00'}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
                {isTodayLocal(selectedDate) ? 'Day Sales (Today)' : `Day Sales for ${formatDateLocal(selectedDate)}`}
              </h5>
              <p className="text-muted mb-0">
                Revenue: ₱{dayStats.revenue?.toFixed(2) || '0.00'} | 
                Expenses: ₱{dayStats.expenses?.toFixed(2) || '0.00'} | 
                Net Revenue: ₱{dayStats.netRevenue?.toFixed(2) || '0.00'} | 
                Total: {dayStats.count || 0} 
                ({dayStats.salesCount || 0} Sales, {dayStats.customersCount || 0} Registrations, {dayStats.logbookCount || 0} Log Book)
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {daySales.length === 0 && dayCustomers.length === 0 && dayLogbook.length === 0 && dayExpenses.length === 0 ? (
            <Alert variant="info" className="text-center">
              <strong>No sales or expenses recorded for this date</strong>
            </Alert>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Staff</th>
                </tr>
              </thead>
              <tbody>
                {/* Product Sales */}
                {daySales.map((sale) => (
                  <tr key={`sale-${sale.id}`}>
                    <td>{new Date(sale.created_at).toLocaleString()}</td>
                    <td><span className="badge bg-primary">Product Sale</span></td>
                    <td>
                      {sale.product?.name || 'N/A'} (Qty: {sale.quantity})
                      <br />
                      <small className="text-muted">Unit Price: ₱{sale.product?.price ? parseFloat(sale.product.price).toFixed(2) : '0.00'}</small>
                    </td>
                    <td>{sale.payment_method || 'Cash'}</td>
                    <td>₱{parseFloat(sale.total_amount).toFixed(2)}</td>
                    <td>
                      {sale.staff_id && sale.staff ? 
                        (sale.staff.name || sale.staff.username || sale.staff.email || 'Staff') : 
                        'Admin'}
                    </td>
                  </tr>
                ))}
                
                {/* Customer Registrations */}
                {dayCustomers.map((customer) => (
                  <tr key={`customer-${customer.id}`}>
                    <td>{new Date(customer.created_at).toLocaleString()}</td>
                    <td><span className="badge bg-success">Registration</span></td>
                    <td>
                      {customer.name} - {customer.registration_type}
                      <br />
                      <small className="text-muted">
                        {customer.contact_no} | {customer.payment_method}
                        {customer.payment_method === 'Partial' && customer.remaining_amount > 0 && 
                          ` | Remaining: ₱${parseFloat(customer.remaining_amount).toFixed(2)}`}
                      </small>
                    </td>
                    <td>
                      {customer.payment_method === 'Partial' 
                        ? `₱${parseFloat(customer.partial_amount || 0).toFixed(2)}`
                        : `₱${parseFloat(customer.amount || 0).toFixed(2)}`}
                    </td>
                    <td>
                      {customer.staff_id && customer.staff ? 
                        (customer.staff.name || customer.staff.username || customer.staff.email || 'Staff') : 
                        'Admin'}
                    </td>
                  </tr>
                ))}
                
                {/* Log Book Entries */}
                {dayLogbook.map((entry) => (
                  <tr key={`logbook-${entry.id}`}>
                    <td>{new Date(entry.created_at).toLocaleString()}</td>
                    <td><span className="badge bg-info">Log Book</span></td>
                    <td>
                      {entry.name} - {entry.type}
                      <br />
                      <small className="text-muted">
                        {entry.address}
                        {entry.payment_method && ` | ${entry.payment_method}`}
                      </small>
                    </td>
                    <td>{entry.amount ? `₱${parseFloat(entry.amount).toFixed(2)}` : '-'}</td>
                    <td>
                      {entry.staff_id && entry.staff ? 
                        (entry.staff.name || entry.staff.username || entry.staff.email || 'Staff') : 
                        'Admin'}
                    </td>
                  </tr>
                ))}
                
                {/* Expenses */}
                {dayExpenses.map((expense) => (
                  <tr key={`expense-${expense.id}`}>
                    <td>{new Date(expense.created_at).toLocaleString()}</td>
                    <td><span className="badge bg-danger">Expense</span></td>
                    <td>{expense.name}</td>
                    <td className="text-danger">-₱{parseFloat(expense.amount).toFixed(2)}</td>
                    <td>
                      {expense.staff_id && expense.staff ? 
                        (expense.staff.name || expense.staff.username || expense.staff.email || 'Staff') : 
                        'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {(() => {
                  // Calculate Cash revenue from all sources
                  // 1. Product Sales
                  const cashFromSales = daySales
                    .filter(sale => sale.payment_method === 'Cash')
                    .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0)
                  
                  // 2. Log Book entries
                  const cashFromLogbook = dayLogbook
                    .filter(entry => entry.payment_method === 'Cash' && entry.amount)
                    .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
                  
                  // 3. Customer Registrations
                  const cashFromRegistrations = dayCustomers
                    .filter(customer => customer.payment_method === 'Cash')
                    .reduce((sum, customer) => {
                      const amount = customer.payment_method === 'Partial' 
                        ? parseFloat(customer.partial_amount || 0)
                        : parseFloat(customer.amount || 0)
                      return sum + amount
                    }, 0)
                  
                  const totalCashRevenue = cashFromSales + cashFromLogbook + cashFromRegistrations
                  
                  // Calculate Gcash revenue from all sources
                  // 1. Product Sales
                  const gcashFromSales = daySales
                    .filter(sale => sale.payment_method === 'Gcash')
                    .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0)
                  
                  // 2. Log Book entries
                  const gcashFromLogbook = dayLogbook
                    .filter(entry => entry.payment_method === 'Gcash' && entry.amount)
                    .reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0)
                  
                  // 3. Customer Registrations
                  const gcashFromRegistrations = dayCustomers
                    .filter(customer => customer.payment_method === 'Gcash')
                    .reduce((sum, customer) => {
                      const amount = customer.payment_method === 'Partial' 
                        ? parseFloat(customer.partial_amount || 0)
                        : parseFloat(customer.amount || 0)
                      return sum + amount
                    }, 0)
                  
                  const totalGcashRevenue = gcashFromSales + gcashFromLogbook + gcashFromRegistrations
                  
                  return (
                    <>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Cash Revenue:</td>
                        <td className="fw-bold">₱{totalCashRevenue.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Gcash Revenue:</td>
                        <td className="fw-bold">₱{totalGcashRevenue.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold">Total Revenue:</td>
                        <td className="fw-bold">₱{dayStats.revenue?.toFixed(2) || '0.00'}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold text-danger">Total Expenses:</td>
                        <td className="fw-bold text-danger">-₱{dayStats.expenses?.toFixed(2) || '0.00'}</td>
                        <td></td>
                      </tr>
                      <tr className="table-success">
                        <td colSpan="4" className="text-end fw-bold">Net Revenue:</td>
                        <td className="fw-bold">₱{dayStats.netRevenue?.toFixed(2) || '0.00'}</td>
                        <td></td>
                      </tr>
                    </>
                  )
                })()}
              </tfoot>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}

export default SalesTracking

