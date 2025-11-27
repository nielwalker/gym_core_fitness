import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set (length: ' + supabaseServiceKey.length + ')' : 'Missing')
  process.exit(1)
}

// Log key info (first 20 chars only for security)
console.log('Supabase URL:', supabaseUrl)
console.log('Service Role Key loaded:', supabaseServiceKey.substring(0, 20) + '...' + supabaseServiceKey.substring(supabaseServiceKey.length - 10))

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// CORS configuration - allow all origins for Vercel deployment
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type']
}

app.use(cors(corsOptions))

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Test Supabase connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database connection test failed:', error)
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: error.message,
        hint: error.hint
      })
    }
    
    res.json({ status: 'connected', message: 'Database connection successful' })
  } catch (error) {
    console.error('Error testing database:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Staff login endpoint (bypasses email auth restrictions using service role)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    
    // Format email from username
    const email = username.includes('@') ? username : `${username}@gymcore.com`
    
    // Create a client with service role key to bypass email auth restrictions
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Try to sign in using service role (bypasses email auth restrictions)
    const { data, error: authError } = await adminSupabase.auth.signInWithPassword({
      email: email,
      password: password,
    })
    
    if (authError) {
      console.error('Login error:', authError)
      if (authError.message.includes('Invalid login credentials')) {
        return res.status(401).json({ error: 'Invalid username or password' })
      } else if (authError.message.includes('Email not confirmed')) {
        return res.status(401).json({ error: 'Email not confirmed. Please contact an administrator.' })
      } else if (authError.message.includes('Email logins are disabled') || authError.message.includes('disabled')) {
        // If email auth is disabled, try to get user info and provide helpful error
        try {
          const { data: userList } = await supabase.auth.admin.listUsers()
          const user = userList?.users?.find(u => u.email === email)
          if (user) {
            return res.status(403).json({ 
              error: 'Email authentication is disabled in Supabase. Please enable email/password authentication in Supabase Dashboard → Authentication → Providers → Email.' 
            })
          }
        } catch (e) {
          // Ignore errors when checking user list
        }
        return res.status(403).json({ 
          error: 'Email authentication is disabled. Please enable email/password authentication in Supabase Dashboard → Authentication → Providers → Email.' 
        })
      } else {
        return res.status(401).json({ error: authError.message || 'Login failed' })
      }
    }
    
    if (data.user) {
      // Get user details from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, username, email, role')
        .eq('id', data.user.id)
        .single()
      
      // Return user data with session
      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          ...(userData && {
            name: userData.name,
            username: userData.username,
            role: userData.role || 'staff'
          })
        },
        session: data.session
      })
    } else {
      res.status(401).json({ error: 'Login failed' })
    }
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Get user role
app.get('/api/user/role/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
      return res.status(500).json({ error: 'Failed to fetch user role' })
    }
    
    res.json({ role: data?.role || 'staff' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create staff user with Supabase Auth (email auto-confirmed)
app.post('/api/users/create', async (req, res) => {
  try {
    const { name, username, password } = req.body
    
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required' })
    }
    
    // Format email from username for Supabase Auth (required by Supabase)
    const email = `${username}@gymcore.com`
    
    // Create user using Supabase Admin API with email auto-confirmed
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        name: name,
        username: username
      }
    })
    
    if (authError) {
      console.error('Error creating user:', authError)
      return res.status(500).json({ error: 'Failed to create user', details: authError.message })
    }
    
    // Wait a bit for the trigger to create the user record
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Update user record with name and username
    try {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ name, username })
        .eq('id', authUser.user.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating user record:', updateError)
        // User was created in auth, but update failed - not critical
      }
    } catch (updateError) {
      console.error('Error updating user record:', updateError)
    }
    
    res.json({ 
      success: true, 
      user: {
        id: authUser.user.id,
        name: name,
        username: username,
        role: 'staff'
      },
      message: 'Staff member created successfully and can login immediately'
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Update user (name and username)
app.post('/api/users/update', async (req, res) => {
  try {
    const { userId, name, username } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    
    // Get user email from auth.users using admin API
    let userEmail = null
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
      if (!authError && authUser?.user) {
        userEmail = authUser.user.email
      }
    } catch (adminError) {
      console.warn('Could not fetch user from auth:', adminError)
    }
    
    // First, check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()
    
    // If user doesn't exist, create it
    if (checkError && checkError.code === 'PGRST116') {
      if (!userEmail) {
        return res.status(404).json({ error: 'User not found in auth. Please ensure the user was created successfully.' })
      }
      
      // Create user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          role: 'staff',
          name: name || null,
          username: username || null
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user:', createError)
        return res.status(500).json({ error: 'Failed to create user record', details: createError.message })
      }
      
      return res.json(newUser)
    }
    
    // Update existing user
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (username !== undefined) updateData.username = username
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user:', error)
      return res.status(500).json({ error: 'Failed to update user', details: error.message })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username, email, last_sign_in_at, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ error: 'Failed to fetch users' })
    }
    
    res.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Confirm user email (for existing unconfirmed users)
app.post('/api/users/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params
    
    // Update user to confirm email using admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(id, {
      email_confirm: true
    })
    
    if (authError) {
      console.error('Error confirming user email:', authError)
      return res.status(500).json({ error: 'Failed to confirm user email', details: authError.message })
    }
    
    res.json({ success: true, message: 'User email confirmed successfully', user: authUser.user })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // First delete from auth.users (this will cascade delete from public.users due to ON DELETE CASCADE)
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    
    if (authError) {
      console.error('Error deleting user from auth:', authError)
      // If auth deletion fails, try to delete from public.users directly
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
      
      if (dbError) {
        console.error('Error deleting user from database:', dbError)
        return res.status(500).json({ error: 'Failed to delete user', details: dbError.message })
      }
    }
    
    res.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

// Check if customer exists
app.get('/api/customers/check', async (req, res) => {
  try {
    const { contact_no } = req.query
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('contact_no', contact_no)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking customer:', error)
      return res.status(500).json({ error: 'Failed to check customer' })
    }
    
    if (!data) {
      return res.json({ exists: false })
    }
    
    // Check if subscription is active
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expirationDate = data.expiration_date ? new Date(data.expiration_date) : null
    const isActive = expirationDate && expirationDate >= today
    
    res.json({
      exists: true,
      customer: data,
      isActive: isActive || false,
      expirationDate: data.expiration_date
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all customers
app.get('/api/customers/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        staff:staff_id (
          name,
          username,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching customers:', error)
      return res.status(500).json({ error: 'Failed to fetch customers' })
    }
    
    res.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create customer
app.post('/api/customers', async (req, res) => {
  try {
    const {
      name,
      address,
      contact_no,
      payment_method,
      amount,
      partial_amount,
      remaining_amount,
      registration_type,
      expiration_date,
      start_date,
      staff_id
    } = req.body
    
    if (!name || !contact_no) {
      return res.status(400).json({ error: 'Name and contact number are required' })
    }
    
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name,
        address,
        contact_no,
        payment_method,
        amount: amount || 0,
        partial_amount: partial_amount || null,
        remaining_amount: remaining_amount || 0,
        registration_type,
        expiration_date,
        start_date: start_date || new Date().toISOString().split('T')[0],
        staff_id: staff_id || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating customer:', error)
      return res.status(500).json({ error: 'Failed to create customer', details: error.message })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Renew customer
app.post('/api/customers/renew', async (req, res) => {
  try {
    const {
      customerId,
      name,
      address,
      contact_no,
      payment_method,
      amount,
      partial_amount,
      remaining_amount,
      staff_id
    } = req.body
    
    // Calculate new expiration date (1 month from today)
    const expirationDate = new Date()
    expirationDate.setMonth(expirationDate.getMonth() + 1)
    const expirationDateStr = expirationDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('customers')
      .update({
        name,
        address,
        contact_no,
        payment_method,
        amount: amount || 0,
        partial_amount: partial_amount || null,
        remaining_amount: remaining_amount || 0,
        expiration_date: expirationDateStr,
        start_date: new Date().toISOString().split('T')[0],
        staff_id: staff_id || null
      })
      .eq('id', customerId)
      .select()
      .single()
    
    if (error) {
      console.error('Error renewing customer:', error)
      return res.status(500).json({ error: 'Failed to renew customer' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating customer:', error)
      return res.status(500).json({ error: 'Failed to update customer' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting customer:', error)
      return res.status(500).json({ error: 'Failed to delete customer' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Mark customer as paid
app.put('/api/customers/:id/paid', async (req, res) => {
  try {
    const { id } = req.params
    
    const { data, error } = await supabase
      .from('customers')
      .update({ remaining_amount: 0 })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating customer:', error)
      return res.status(500).json({ error: 'Failed to update customer' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching products:', error)
      return res.status(500).json({ error: 'Failed to fetch products', details: error.message })
    }
    
    res.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, stock_quantity, description } = req.body
    
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' })
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        price: parseFloat(price),
        stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
        description: description || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating product:', error)
      return res.status(500).json({ error: 'Failed to create product', details: error.message })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, price, stock_quantity, description } = req.body
    
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = parseFloat(price)
    if (stock_quantity !== undefined) updateData.stock_quantity = parseInt(stock_quantity)
    if (description !== undefined) updateData.description = description
    
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating product:', error)
      return res.status(500).json({ error: 'Failed to update product' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting product:', error)
      return res.status(500).json({ error: 'Failed to delete product' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all sales
app.get('/api/sales', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        product:product_id (*),
        staff:staff_id (
          name,
          username,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching sales:', error)
      return res.status(500).json({ error: 'Failed to fetch sales' })
    }
    
    res.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create sale
app.post('/api/sales', async (req, res) => {
  try {
    const { product_id, quantity, total_amount, staff_id } = req.body
    
    if (!product_id || !quantity || total_amount === undefined) {
      return res.status(400).json({ error: 'Product ID, quantity, and total amount are required' })
    }
    
    // Get product to update stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single()
    
    if (productError) {
      return res.status(400).json({ error: 'Product not found' })
    }
    
    // Update stock
    const newStock = (product.stock_quantity || 0) - quantity
    await supabase
      .from('products')
      .update({ stock_quantity: Math.max(0, newStock) })
      .eq('id', product_id)
    
    // Create sale
    const { data, error } = await supabase
      .from('sales')
      .insert({
        product_id,
        quantity,
        total_amount: parseFloat(total_amount),
        staff_id: staff_id || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating sale:', error)
      return res.status(500).json({ error: 'Failed to create sale' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update sale
app.put('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { product_id, quantity, total_amount } = req.body
    
    if (!product_id || !quantity || total_amount === undefined) {
      return res.status(400).json({ error: 'Product ID, quantity, and total amount are required' })
    }
    
    // Get old sale to restore stock
    const { data: oldSale, error: oldSaleError } = await supabase
      .from('sales')
      .select('product_id, quantity')
      .eq('id', id)
      .single()
    
    if (oldSaleError) {
      return res.status(404).json({ error: 'Sale not found' })
    }
    
    // Restore old stock
    if (oldSale.product_id) {
      const { data: oldProduct } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', oldSale.product_id)
        .single()
      
      if (oldProduct) {
        await supabase
          .from('products')
          .update({ stock_quantity: (oldProduct.stock_quantity || 0) + oldSale.quantity })
          .eq('id', oldSale.product_id)
      }
    }
    
    // Get new product to update stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', product_id)
      .single()
    
    if (productError) {
      return res.status(400).json({ error: 'Product not found' })
    }
    
    // Update stock
    const newStock = (product.stock_quantity || 0) - quantity
    await supabase
      .from('products')
      .update({ stock_quantity: Math.max(0, newStock) })
      .eq('id', product_id)
    
    // Update sale
    const { data, error } = await supabase
      .from('sales')
      .update({
        product_id,
        quantity,
        total_amount: parseFloat(total_amount)
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating sale:', error)
      return res.status(500).json({ error: 'Failed to update sale' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete sale
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Get sale to restore stock
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('product_id, quantity')
      .eq('id', id)
      .single()
    
    if (saleError) {
      return res.status(404).json({ error: 'Sale not found' })
    }
    
    // Restore stock
    if (sale.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', sale.product_id)
        .single()
      
      if (product) {
        await supabase
          .from('products')
          .update({ stock_quantity: (product.stock_quantity || 0) + sale.quantity })
          .eq('id', sale.product_id)
      }
    }
    
    // Delete sale
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting sale:', error)
      return res.status(500).json({ error: 'Failed to delete sale' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get sales by date
app.get('/api/sales/date', async (req, res) => {
  try {
    const { date } = req.query
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' })
    }
    
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number)
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
    
    const startISO = startDate.toISOString()
    const endISO = endDate.toISOString()
    
    // Get sales for the date
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        product:product_id (*),
        staff:staff_id (
          name,
          username,
          email
        )
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })
    
    // Get customers registered on this date
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select(`
        *,
        staff:staff_id (
          name,
          username,
          email
        )
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })
    
    // Get logbook entries for this date
    const { data: logbook, error: logbookError } = await supabase
      .from('logbook')
      .select(`
        *,
        staff:staff_id (
          name,
          username,
          email
        )
      `)
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })
    
    if (salesError || customersError || logbookError) {
      console.error('Error fetching date data:', { salesError, customersError, logbookError })
      return res.status(500).json({ error: 'Failed to fetch date data' })
    }
    
    // Calculate revenue for the date
    const salesRevenue = (sales || []).reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0)
    const customerRevenue = (customers || []).reduce((sum, customer) => {
      // For partial payments, use partial_amount, otherwise use amount
      const amount = customer.payment_method === 'Partial' 
        ? (parseFloat(customer.partial_amount) || 0)
        : (parseFloat(customer.amount) || 0)
      return sum + amount
    }, 0)
    const logbookRevenue = (logbook || []).reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0)
    const totalRevenue = salesRevenue + customerRevenue + logbookRevenue

    res.json({
      sales: sales || [],
      customers: customers || [],
      logbook: logbook || [],
      stats: {
        revenue: totalRevenue,
        salesCount: (sales || []).length,
        customersCount: (customers || []).length,
        logbookCount: (logbook || []).length,
        count: (sales || []).length + (customers || []).length + (logbook || []).length
      }
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get sales statistics
app.get('/api/stats/sales', async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    const tomorrowISO = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
    
    // Get today's sales
    const { data: todaySales, error: salesError } = await supabase
      .from('sales')
      .select('total_amount')
      .gte('created_at', todayISO)
      .lt('created_at', tomorrowISO)
    
    // Get today's customer registrations
    const { data: todayCustomers, error: customersError } = await supabase
      .from('customers')
      .select('amount')
      .gte('created_at', todayISO)
      .lt('created_at', tomorrowISO)
    
    // Get today's logbook entries
    const { data: todayLogbook, error: logbookError } = await supabase
      .from('logbook')
      .select('amount')
      .gte('created_at', todayISO)
      .lt('created_at', tomorrowISO)
    
    if (salesError || customersError || logbookError) {
      console.error('Error fetching stats:', { salesError, customersError, logbookError })
      return res.status(500).json({ error: 'Failed to fetch statistics' })
    }
    
    const salesRevenue = (todaySales || []).reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0)
    const customerRevenue = (todayCustomers || []).reduce((sum, customer) => {
      // For partial payments, use partial_amount, otherwise use amount
      const amount = customer.payment_method === 'Partial' 
        ? (parseFloat(customer.partial_amount) || 0)
        : (parseFloat(customer.amount) || 0)
      return sum + amount
    }, 0)
    const logbookRevenue = (todayLogbook || []).reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0)
    
    const todayRevenue = salesRevenue + customerRevenue + logbookRevenue
    
    res.json({
      todayRevenue,
      todaySalesCount: (todaySales || []).length
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create logbook entry
app.post('/api/logbook', async (req, res) => {
  try {
    const { name, address, type, amount, payment_method, staff_id } = req.body
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' })
    }
    
    const { data, error } = await supabase
      .from('logbook')
      .insert({
        name,
        address: address || null,
        type,
        amount: type === 'regular' ? null : (amount ? parseFloat(amount) : null),
        payment_method: type === 'regular' ? null : (payment_method || null),
        staff_id: staff_id || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating logbook entry:', error)
      return res.status(500).json({ error: 'Failed to create logbook entry' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update logbook entry
app.put('/api/logbook/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    // Handle amount for regular type
    if (updateData.type === 'regular') {
      updateData.amount = null
      updateData.payment_method = null
    }
    
    const { data, error } = await supabase
      .from('logbook')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating logbook entry:', error)
      return res.status(500).json({ error: 'Failed to update logbook entry' })
    }
    
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete logbook entry
app.delete('/api/logbook/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const { error } = await supabase
      .from('logbook')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting logbook entry:', error)
      return res.status(500).json({ error: 'Failed to delete logbook entry' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Export for Vercel
export default app

