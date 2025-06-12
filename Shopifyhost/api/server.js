// server.js (CommonJS version)
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log environment variables for debugging
console.log('Environment variables loaded:', {
  DB_HOST: process.env.DB_HOST,
  MYSQL_PORT: process.env.MYSQL_PORT,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  SHOPIFY_SHOP: process.env.SHOPIFY_SHOP,
  SHOPIFY_TOKEN: process.env.SHOPIFY_TOKEN ? 'Present (hidden for security)' : 'MISSING',
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Present' : 'MISSING',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Present (hidden for security)' : 'MISSING',
  FRONTEND_URL: process.env.FRONTEND_URL || 'Using default'
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://ceymox-internship.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_TOKEN;

if (!SHOP || !TOKEN) {
  console.error('❌ Missing required environment variables. Please check your .env file.');
  console.error('Required: SHOPIFY_SHOP, SHOPIFY_TOKEN');
  process.exit(1);
}

// MySQL connection pool for better performance with serverless
let pool;
async function getConnection() {
  if (!pool) {
    // Hardcode the connection details directly
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('Created connection pool to Railway MySQL');
  }
  return pool;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Function to initialize Supabase database
async function initializeSupabase() {
  try {
    // Check if the products table exists by trying to get its schema
    const { error: schemaError } = await supabase
      .from('products')
      .select('*')
      .limit(0);
    
    // If table doesn't exist, we'll get an error
    if (schemaError && schemaError.message.includes('does not exist')) {
      console.log('Creating products table in Supabase...');
      
      // Create the table using SQL - requires service_role key with enough permissions
      const { error: createError } = await supabase.rpc('create_products_table');
      
      if (createError) {
        console.error('Failed to create products table:', createError.message);
        return false;
      }
      
      console.log('✅ Supabase products table created');
    }
    
    console.log('✅ Connected to Supabase database');
    return true;
  } catch (err) {
    console.error('❌ Supabase initialization failed:', err.message);
    return false;
  }
}

// Function to test Supabase connection
async function testSupabaseConnection() {
  try {
    // Just check if we can connect to Supabase
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('✅ Connected to Supabase');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    return false;
  }
}


// Test database connection
async function testConnection() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT 1');
    console.log('✅ Connected to MySQL database');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

// Initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    const connection = await getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        image VARCHAR(1024)
      )
    `);
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Failed to initialize database tables:', err.message);
  }
}

// Initialize the database on startup
testConnection().then(connected => {
  if (connected) {
    initializeDatabase();
  }
});

// Test Supabase connection
testSupabaseConnection().then(connected => {
  if (connected) {
    console.log('Supabase is ready to use');
    
    // Test if we can access the products table
    supabase
      .from('products')
      .select('*')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.log('Error accessing products table:', error.message);
        } else {
          console.log('✅ Successfully connected to Supabase products table');
        }
      });
  }
});

// ✅ Fetch all products from Shopify
app.get('/products', async (req, res) => {
  try {
    console.log('Fetching products from Shopify');
    console.log('SHOP value:', SHOP);
    console.log('TOKEN present:', TOKEN ? 'Yes' : 'No');
    
    // Hardcoded values as fallback if environment variables are missing
    const shopDomain = SHOP || 'ceymox-internship.myshopify.com';
    const accessToken = TOKEN || ''; // You'll need to add this in Vercel env vars
    
    console.log('Using shop domain:', shopDomain);
    
    const response = await axios.get(`https://${shopDomain}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken }
    });
    
    console.log(`Found ${response.data.products.length} products`);
    res.json(response.data.products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Duplicate route with /api prefix for Vercel
app.get('/api/products', async (req, res) => {
  try {
    console.log('Fetching products from Shopify (API route)');
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    console.log(`Found ${response.data.products.length} products (API route)`);
    res.json(response.data.products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ✅ Fetch products tagged "in-db"
app.get('/products-in-db', async (req, res) => {
  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    const products = response.data.products.filter(p =>
      (p.tags || '').toLowerCase().includes('in-db')
    );
    res.json(products);
  } catch (error) {
    console.error('Error fetching products in DB:', error.message);
    res.status(500).json({ error: 'Failed to fetch products in DB' });
  }
});

// ✅ Add product to DB (tag Shopify + insert to MySQL + add to Supabase)
app.post('/add-to-db/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    const p = response.data.product;

    const tags = (p.tags + ',in-db').split(',').map(t => t.trim()).filter(Boolean);
    const updatedTags = Array.from(new Set(tags)).join(',');

    await axios.put(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      product: { id, tags: updatedTags }
    }, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });

    const productTitle = p.title || '';
    const productPrice = (p.variants && p.variants[0]) ? p.variants[0].price : '0.00';
    const productDescription = p.body_html || '';
    const productImage = (p.image && p.image.src) ? p.image.src : '';

    // Add to MySQL
    const connection = await getConnection();
    await connection.query(`
      INSERT INTO products (id, title, price, description, image)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=?, price=?, description=?, image=?`,
      [p.id, productTitle, productPrice, productDescription, productImage,
       productTitle, productPrice, productDescription, productImage]);
       
    // Add to Supabase - Direct insert approach
    try {
      console.log('Adding product to Supabase with ID:', p.id);
      
      // First try a direct insert
      const { data, error } = await supabase
        .from('products')
        .insert([{
          shopify_id: Number(p.id),
          title: productTitle,
          price: productPrice,
          description: productDescription,
          image: productImage
        }]);
      
      if (error) {
        console.log('Insert failed, trying update:', error.message);
        
        // If insert fails, try update
        const { data: updateData, error: updateError } = await supabase
          .from('products')
          .update({
            title: productTitle,
            price: productPrice,
            description: productDescription,
            image: productImage
          })
          .eq('shopify_id', Number(p.id));
          
        if (updateError) {
          console.error('Update also failed:', updateError.message);
        } else {
          console.log('Product updated in Supabase');
        }
      } else {
        console.log('Product added to Supabase');
      }
    } catch (supabaseError) {
      console.error('Supabase operation failed:', supabaseError.message);
    }

    res.json({ message: 'Product added to DB and tagged.' });
  } catch (error) {
    console.error('Error adding product to DB:', error.message);
    res.status(500).json({ error: 'Failed to add product to DB' });
  }
});

// ✅ Edit product in MySQL, Shopify, and Supabase
app.put('/edit/:id', async (req, res) => {
  try {
    const { title, price, image, description } = req.body;
    const id = req.params.id;

    const shopifyResponse = await axios.get(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    const currentProduct = shopifyResponse.data.product;

    const updatedProduct = {
      id: parseInt(id),
      title: title,
      body_html: description,
      variants: currentProduct.variants.map((variant) => ({
        id: variant.id,
        price: parseFloat(price).toFixed(2),
        inventory_quantity: variant.inventory_quantity,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        sku: variant.sku,
        barcode: variant.barcode,
        weight: variant.weight,
        weight_unit: variant.weight_unit,
        requires_shipping: variant.requires_shipping,
        taxable: variant.taxable
      }))
    };

    if (image && image !== currentProduct.image?.src) {
      updatedProduct.images = [{ src: image }];
    }

    const shopifyUpdateResponse = await axios.put(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      product: updatedProduct
    }, {
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      }
    });

    // Update MySQL
    const connection = await getConnection();
    await connection.query(
      `UPDATE products SET title=?, price=?, description=?, image=? WHERE id=?`,
      [title, price, description, image, id]
    );
    
    // Update Supabase
    const { error } = await supabase
      .from('products')
      .update({
        title: title,
        price: price,
        description: description,
        image: image
      })
      .eq('shopify_id', Number(id));
      
    if (error) {
      console.error('Error updating product in Supabase:', error.message);
    } else {
      console.log('Product updated in Supabase');
    }

    res.json({
      message: 'Product updated successfully in Shopify, MySQL, and Supabase',
      updatedProduct: shopifyUpdateResponse.data.product
    });
  } catch (error) {
    console.error('Error updating product:', error.message);
    if (error.response) {
      console.error('Shopify API error:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ✅ Remove product from DB and untag in Shopify
app.delete('/remove/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    const product = response.data.product;
    const filteredTags = (product.tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t.toLowerCase() !== 'in-db');

    await axios.put(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      product: { id, tags: filteredTags.join(',') }
    }, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });

    // Remove from MySQL
    const connection = await getConnection();
    await connection.query(`DELETE FROM products WHERE id=?`, [id]);
    
    // Remove from Supabase
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('shopify_id', Number(id));
      
    if (error) {
      console.error('Error removing product from Supabase:', error.message);
    } else {
      console.log('Product removed from Supabase');
    }
    
    res.json({ message: 'Removed from DB and untagged' });
  } catch (error) {
    console.error('Error removing product:', error.message);
    res.status(500).json({ error: 'Failed to remove product' });
  }
});

// ✅ Debug endpoint to see product structure
app.get('/debug/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    res.json(response.data.product);
  } catch (error) {
    console.error('Error fetching product for debug:', error.message);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ✅ Fetch customers
app.get('/customers', async (req, res) => {
  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/customers.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    res.json(response.data.customers);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ✅ Fetch orders
app.get('/orders', async (req, res) => {
  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/orders.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    res.json(response.data.orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ✅ Fetch shop info
app.get('/shop', async (req, res) => {
  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/shop.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching shop info:', error.message);
    res.status(500).json({ error: 'Failed to fetch shop info' });
  }
});

// Test API endpoint for debugging
app.get('/test-api', (req, res) => {
  res.json({
    message: 'API is working',
    shopifyConfigured: Boolean(SHOP && TOKEN),
    env: {
      shopPresent: Boolean(SHOP),
      tokenPresent: Boolean(TOKEN)
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Supabase routes

// Get all products from Supabase
app.get('/supabase/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) throw error;
    
    console.log(`Found ${data.length} products in Supabase`);
    res.json(data);
  } catch (error) {
    console.error('Error fetching products from Supabase:', error.message);
    res.status(500).json({ error: 'Failed to fetch products from Supabase' });
  }
});

// Add product to Supabase
app.post('/supabase/add-product', async (req, res) => {
  try {
    const { title, price, description, image } = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        { title, price, description, image }
      ])
      .select();
    
    if (error) throw error;
    
    res.json({ message: 'Product added to Supabase', product: data[0] });
  } catch (error) {
    console.error('Error adding product to Supabase:', error.message);
    res.status(500).json({ error: 'Failed to add product to Supabase' });
  }
});

// Middleware to replace placeholders in HTML files with environment variables
app.use((req, res, next) => {
  const _send = res.send;
  res.send = function (body) {
    // Only process HTML responses
    if (typeof body === 'string' && body.includes('{{FRONTEND_URL}}')) {
      body = body.replace(/\{\{FRONTEND_URL\}\}/g, process.env.FRONTEND_URL || 'https://ceymox-internship.vercel.app');
    }
    return _send.call(this, body);
  };
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export for serverless environments
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Shop: ${SHOP}`);
    console.log(`🔐 Using environment variables for security`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
}
// Add Shopify product to Supabase
app.post('/supabase/add-shopify-product/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get product from Shopify
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    
    const p = response.data.product;
    
    // Format product data for Supabase
    const productData = {
      shopify_id: Number(p.id),
      title: p.title || '',
      price: (p.variants && p.variants[0]) ? p.variants[0].price : '0.00',
      description: p.body_html || '',
      image: (p.image && p.image.src) ? p.image.src : ''
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();
    
    if (error) throw error;
    
    res.json({ 
      message: 'Product added to Supabase from Shopify', 
      product: data[0] 
    });
  } catch (error) {
    console.error('Error adding Shopify product to Supabase:', error.message);
    res.status(500).json({ error: 'Failed to add Shopify product to Supabase' });
  }
});