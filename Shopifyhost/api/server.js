// server.js
import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import mysql from 'mysql2';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Use environment variables instead of hardcoded values
const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_TOKEN;

// Check if required environment variables are set
if (!SHOP || !TOKEN) {
  console.error('❌ Missing required environment variables. Please check your .env file.');
  console.error('Required: SHOPIFY_SHOP, SHOPIFY_TOKEN');
  process.exit(1);
}

// ✅ MySQL setup using environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'shopifyadmin'
});

// Test database connection
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database');
});

// ✅ Fetch all products from Shopify
app.get('/products', async (req, res) => {
  try {
    const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    
    // Debug logging - remove this after fixing
    if (response.data.products.length > 0) {
      const sampleProduct = response.data.products[0];
      console.log('Sample product fields:');
      console.log('- product_type:', sampleProduct.product_type);
      console.log('- vendor:', sampleProduct.vendor);
      console.log('- tags:', sampleProduct.tags);
      console.log('- Full product:', JSON.stringify(sampleProduct, null, 2));
    }
    
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

// ✅ Add product to DB (tag Shopify + insert to MySQL)
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

    // Get proper values with fallbacks
    const productTitle = p.title || '';
    const productPrice = (p.variants && p.variants[0]) ? p.variants[0].price : '0.00';
    const productDescription = p.body_html || '';
    const productImage = (p.image && p.image.src) ? p.image.src : '';

    db.query(`
      INSERT INTO products (id, title, price, description, image)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=?, price=?, description=?, image=?`,
      [p.id, productTitle, productPrice, productDescription, productImage,
       productTitle, productPrice, productDescription, productImage]);

    res.json({ message: 'Product added to DB and tagged.' });
  } catch (error) {
    console.error('Error adding product to DB:', error.message);
    res.status(500).json({ error: 'Failed to add product to DB' });
  }
});

// ✅ Edit product in MySQL AND Shopify
app.put('/edit/:id', async (req, res) => {
  try {
    const { title, price, image, description } = req.body;
    const id = req.params.id;

    console.log('Editing product:', id, 'with data:', { title, price, image, description });

    // First, get the current product from Shopify to preserve other data
    const shopifyResponse = await axios.get(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      headers: { 'X-Shopify-Access-Token': TOKEN }
    });
    const currentProduct = shopifyResponse.data.product;
    
    console.log('Current product variants:', currentProduct.variants);

    // Update the product in Shopify
    const updatedProduct = {
      id: parseInt(id),
      title: title,
      body_html: description,
      variants: currentProduct.variants.map((variant, index) => ({
        id: variant.id, // Important: include the variant ID
        price: parseFloat(price).toFixed(2), // Update all variants with the same price
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

    // If image is provided and different, update it
    if (image && image !== currentProduct.image?.src) {
      updatedProduct.images = [{ src: image }];
    }

    console.log('Updating Shopify with:', updatedProduct);

    const shopifyUpdateResponse = await axios.put(`https://${SHOP}/admin/api/2023-10/products/${id}.json`, {
      product: updatedProduct
    }, {
      headers: { 
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log('Shopify update successful');

    // Update in MySQL database (remove category field)
    db.query(
      `UPDATE products SET title=?, price=?, description=?, image=? WHERE id=?`,
      [title, price, description, image, id],
      (err) => {
        if (err) {
          console.error('MySQL update error:', err);
          return res.status(500).json({ error: 'Failed to update database' });
        }
        console.log('MySQL update successful');
        res.json({ 
          message: 'Product updated successfully in both Shopify and database',
          updatedProduct: shopifyUpdateResponse.data.product
        });
      }
    );

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

    // Untag in Shopify
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

    // Delete from MySQL
    db.query(`DELETE FROM products WHERE id=?`, [id], (err) => {
      if (err) {
        console.error('MySQL delete error:', err);
        return res.status(500).json({ error: 'Failed to remove from database' });
      }
      res.json({ message: 'Removed from DB and untagged' });
    });

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

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📦 Shop: ${SHOP}`);
  console.log(`🔐 Using environment variables for security`);
});