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

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ceymox-internship.vercel.app';

// Enable CORS for Vercel frontend
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Shopify credentials
const SHOP = process.env.SHOPIFY_SHOP || 'fakestore-practice1.myshopify.com';
const TOKEN = process.env.SHOPIFY_TOKEN || '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';

// MySQL connection pool
let pool;
async function getConnection() {
  if (!pool) {
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
  }
  return pool;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize database on startup
async function initDatabases() {
  try {
    // Setup MySQL
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
    
    // Setup Supabase
    const { error: checkError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
      
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Creating Supabase products table...');
      
      const { error: insertError } = await supabase
        .from('products')
        .insert([{
          shopify_id: 0,
          title: 'Test Product',
          price: '0.00',
          description: 'Test Description',
          image: ''
        }]);
        
      if (!insertError || insertError.message.includes('already exists')) {
        console.log('Products table created');
        await supabase.from('products').delete().eq('shopify_id', 0);
      }
    }
    
    console.log('Databases initialized');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }
}

// Run initialization
initDatabases();

// ✅ Fetch all products from Shopify
app.get('/products', async (req, res) => {
  try {
    console.log('Fetching products from Shopify');
    
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    
    console.log(`Found ${response.data.products.length} products`);
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

// ✅ Add product to DB
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
       
    // Add to Supabase
    try {
      // Check if product exists in Supabase
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('shopify_id', Number(p.id))
        .maybeSingle();
      
      if (existingProduct) {
        // Update existing product
        await supabase
          .from('products')
          .update({
            title: productTitle,
            price: productPrice,
            description: productDescription,
            image: productImage
          })
          .eq('shopify_id', Number(p.id));
      } else {
        // Insert new product
        await supabase
          .from('products')
          .upsert([{
            shopify_id: Number(p.id),
            title: productTitle,
            price: productPrice,
            description: productDescription,
            image: productImage
          }], { onConflict: 'shopify_id' });
      }
    } catch (supabaseError) {
      console.error('Supabase operation failed:', supabaseError);
    }

    res.json({ message: 'Product added to DB and tagged.' });
  } catch (error) {
    console.error('Error adding product to DB:', error.message);
    res.status(500).json({ error: 'Failed to add product to DB' });
  }
});

// ✅ Edit product
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
    await supabase
      .from('products')
      .update({
        title: title,
        price: price,
        description: description,
        image: image
      })
      .eq('shopify_id', Number(id));

    res.json({
      message: 'Product updated successfully',
      updatedProduct: shopifyUpdateResponse.data.product
    });
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ✅ Remove product from DB
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
    await supabase
      .from('products')
      .delete()
      .eq('shopify_id', Number(id));
    
    res.json({ message: 'Removed from DB and untagged' });
  } catch (error) {
    console.error('Error removing product:', error.message);
    res.status(500).json({ error: 'Failed to remove product' });
  }
});

// ✅ Debug endpoint
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

// Test API endpoint
app.get('/test-api', (req, res) => {
  res.json({
    message: 'API is working',
    shopifyConfigured: true,
    frontendUrl: FRONTEND_URL
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Middleware to replace placeholders in HTML files with environment variables
app.use((req, res, next) => {
  const _send = res.send;
  res.send = function (body) {
    // Only process HTML responses
    if (typeof body === 'string' && body.includes('{{FRONTEND_URL}}')) {
      body = body.replace(/\{\{FRONTEND_URL\}\}/g, FRONTEND_URL);
    }
    return _send.call(this, body);
  };
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route to serve index.html
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
    console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  });
}