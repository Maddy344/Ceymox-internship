// server.js (CommonJS version)
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env file from project root
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Enable CORS for all origins in Vercel
app.use(cors());
app.use(express.json());

// Shopify credentials
const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_TOKEN;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize database on startup
async function initDatabases() {
  try {
    // Setup Supabase
    const { error: checkError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
      
    // Always try to clean up any test records regardless of table existence
    try {
      await supabase.from('products').delete().eq('shopify_id', 0);
      console.log('Cleaned up any test records');
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
      
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Creating Supabase products table...');
      
      // Create the table by inserting a test record
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
        
        // Make sure to delete the test record
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('shopify_id', 0);
          
        if (deleteError) {
          console.error('Failed to delete test record:', deleteError.message);
        } else {
          console.log('Test record deleted successfully');
        }
      }
    }
    
    console.log('Database initialized');
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
    console.log(`Using shop: ${SHOP}`);
    
    if (!SHOP || !TOKEN) {
      return res.status(500).json({ 
        error: 'Shopify credentials not configured',
        details: 'SHOPIFY_SHOP or SHOPIFY_TOKEN environment variables are missing'
      });
    }
    
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    
    console.log(`Found ${response.data.products.length} products`);
    res.json(response.data.products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch products',
      message: error.message,
      statusCode: error.response?.status || 500
    });
  }
});

// ✅ Fetch products tagged "in-db"
app.get('/products-in-db', async (req, res) => {
  try {
    if (!SHOP || !TOKEN) {
      return res.status(500).json({ 
        error: 'Shopify credentials not configured',
        details: 'SHOPIFY_SHOP or SHOPIFY_TOKEN environment variables are missing'
      });
    }
    
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    const products = response.data.products.filter(p =>
      (p.tags || '').toLowerCase().includes('in-db')
    );
    res.json(products);
  } catch (error) {
    console.error('Error fetching products in DB:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch products in DB',
      message: error.message,
      statusCode: error.response?.status || 500
    });
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
    shopifyConfigured: Boolean(SHOP && TOKEN),
    frontendUrl: FRONTEND_URL,
    env: {
      shopConfigured: Boolean(SHOP && TOKEN),
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    env: {
      shopConfigured: Boolean(SHOP && TOKEN),
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    }
  });
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