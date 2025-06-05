// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const SHOP = 'fakestore-practice1.myshopify.com'; // ← update
const TOKEN = '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'; // ← update

// ✅ MySQL setup — update these fields
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'admin123', // or your MySQL password
  database: 'shopifyadmin'
});

// ✅ Fetch all products from Shopify
app.get('/products', async (req, res) => {
  const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
    headers: { 'X-Shopify-Access-Token': TOKEN }
  });
  res.json(response.data.products);
});

// ✅ Fetch products tagged "in-db"
app.get('/products-in-db', async (req, res) => {
  const response = await axios.get(`https://${SHOP}/admin/api/2023-10/products.json`, {
    headers: { 'X-Shopify-Access-Token': TOKEN }
  });
  const products = response.data.products.filter(p =>
    (p.tags || '').toLowerCase().includes('in-db')
  );
  res.json(products);
});

// ✅ Add product to DB (tag Shopify + insert to MySQL)
app.post('/add-to-db/:id', async (req, res) => {
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

  db.query(`
    INSERT INTO products (id, title, price, description, category, image)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE title=?, price=?, description=?, category=?, image=?`,
    [p.id, p.title, p.variants[0].price, p.body_html, p.product_type, p.image.src,
     p.title, p.variants[0].price, p.body_html, p.product_type, p.image.src]);

  res.json({ message: 'Product added to DB and tagged.' });
});

// ✅ Edit product in MySQL
app.put('/edit/:id', (req, res) => {
  const { title, price, description, category, image } = req.body;
  db.query(
    `UPDATE products SET title=?, price=?, description=?, category=?, image=? WHERE id=?`,
    [title, price, description, category, image, req.params.id],
    err => err ? res.status(500).send(err.message) : res.json({ message: 'Updated successfully' })
  );
});

// ✅ Remove product from DB and untag in Shopify
app.delete('/remove/:id', async (req, res) => {
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
  db.query(`DELETE FROM products WHERE id=?`, [id], err =>
    err ? res.status(500).send(err.message) : res.json({ message: 'Removed from DB and untagged' })
  );
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
