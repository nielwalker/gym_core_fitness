import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Table, Alert, Modal } from 'react-bootstrap'
import api from '../../lib/axios'

function ProductManagement() {
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const productData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category: editingProduct ? editingProduct.category : 'supplements',
        description: formData.description.trim() || ''
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, {
          name: productData.name,
          price: productData.price,
          stock_quantity: productData.stock_quantity,
          description: productData.description
        })
        setSuccess('Product updated successfully!')
      } else {
        await api.post('/products', productData)
        setSuccess('Product created successfully!')
      }
      setFormData({
        name: '',
        price: '',
        stock_quantity: '',
        description: ''
      })
      setEditingProduct(null)
      fetchProducts()
      setShowModal(false)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price,
      stock_quantity: product.stock_quantity || 0,
      description: product.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/products/${id}`)
      setSuccess('Product deleted successfully!')
      fetchProducts()
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete product')
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      price: '',
      stock_quantity: '',
      description: ''
    })
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Product Management</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Add Product
        </Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      <Card>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.description}</td>
                  <td>₱{parseFloat(product.price).toFixed(2)}</td>
                  <td>{product.stock_quantity}</td>
                  <td>{product.category}</td>
                  <td>
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(product)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(product.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Product Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Price *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock Quantity *</Form.Label>
              <Form.Control
                type="number"
                min="0"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description (optional)"
              />
            </Form.Group>
            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default ProductManagement

