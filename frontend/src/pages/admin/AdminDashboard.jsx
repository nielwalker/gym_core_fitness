import { Container, Row, Col, Card } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import api from '../../lib/axios'

function AdminDashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    totalSales: 0,
    todaySales: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats/sales')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <Container>
      <h1 className="my-4">Admin Dashboard</h1>
      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm bg-success text-white">
            <Card.Body>
              <Card.Title>Today's Revenue</Card.Title>
              <h2>₱{stats.todayRevenue?.toFixed(2) || '0.00'}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm bg-info text-white">
            <Card.Body>
              <Card.Title>Total Sales</Card.Title>
              <h2>{stats.totalSales || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm bg-warning text-white">
            <Card.Body>
              <Card.Title>Today's Sales</Card.Title>
              <h2>{stats.todaySales || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminDashboard

