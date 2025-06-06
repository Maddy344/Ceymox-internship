# Ceymox-internship
1 month internship projects with Ceymox.

02-06-2025
Simple Calculation as Web application 

"app.py"

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def calculator():
    return render_template("index.html")

@app.route("/calculate", methods=["POST"])
def calculate():
    try:
        num1 = float(request.form["num1"])
        num2 = float(request.form["num2"])
        operation = request.form["operation"]

        if operation == "Add":
            result = num1 + num2
        elif operation == "Sub":
            result = num1 - num2
        elif operation == "Mul":
            result = num1 * num2
        elif operation == "Div":
            result = num1 / num2 if num2 != 0 else "Cannot divide by zero"
        else:
            result = "Invalid operation"
    except ValueError:
        result = "Please enter valid numbers"

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(debug=True)

"index.html"

<!DOCTYPE html>
<html>
<head>
    <title>Simple Calculator</title>
    <script>
        function calculate(operation) {
            const num1 = document.getElementById("num1").value;
            const num2 = document.getElementById("num2").value;

            const formData = new FormData();
            formData.append("num1", num1);
            formData.append("num2", num2);
            formData.append("operation", operation);

            fetch("/calculate", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("result").innerText = "Result: " + data.result;
            })
            .catch(error => {
                document.getElementById("result").innerText = "Error: " + error;
            });
        }
    </script>
</head>
<body>
    <h2>Simple Calculator</h2>
    <input type="text" id="num1" placeholder="Enter first number" required>
    <input type="text" id="num2" placeholder="Enter second number" required><br><br>

    <button onclick="calculate('Add')">Add</button>
    <button onclick="calculate('Sub')">Sub</button>
    <button onclick="calculate('Mul')">Mul</button>
    <button onclick="calculate('Div')">Div</button>

    <h3 id="result">Result: </h3>
</body>
</html>

Simple Calculation as Desktop Application

import tkinter as tk

def calculate(operation):
    try:
        num1 = float(entry_num1.get())
        num2 = float(entry_num2.get())
        if operation == 'Add':
            result = num1 + num2
        elif operation == 'Sub':
            result = num1 - num2
        elif operation == 'Mul':
            result = num1 * num2
        elif operation == 'Div':
             if num2 == 0:
                result = "Cannot divide by zero"
             else:
                result = num1 / num2
        result_label.config(text=f"Result: {result}")
    except ValueError:
        result_label.config(text="Invalid input")

window = tk.Tk()
window.title("Simple Calculator")

label_num1 = tk.Label(window, text="Number 1:")
label_num1.grid(row=0, column=0, padx=5, pady=5)
entry_num1 = tk.Entry(window)
entry_num1.grid(row=0, column=1, padx=5, pady=5)

label_num2 = tk.Label(window, text="Number 2:")
label_num2.grid(row=1, column=0, padx=5, pady=5)
entry_num2 = tk.Entry(window)
entry_num2.grid(row=1, column=1, padx=5, pady=5)

button_add = tk.Button(window, text="Add", command=lambda: calculate('Add'))
button_add.grid(row=2, column=0, padx=5, pady=5)
button_sub = tk.Button(window, text="Sub", command=lambda: calculate('Sub'))
button_sub.grid(row=2, column=1, padx=5, pady=5)
button_mul = tk.Button(window, text="Mul", command=lambda: calculate('Mul'))
button_mul.grid(row=3, column=0, padx=5, pady=5)
button_div = tk.Button(window, text="Div", command=lambda: calculate('Div'))
button_div.grid(row=3, column=1, padx=5, pady=5)

result_label = tk.Label(window, text="Result: ")
result_label.grid(row=4, column=0, columnspan=2, pady=10)

window.mainloop()

03-06-2025

Fakestore.html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FakeStore API Explorer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 50px;
    }

    h1 {
      margin-bottom: 10px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .tabs button {
      padding: 10px 20px;
      cursor: pointer;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 5px;
    }

    .tabs button.active {
      background-color: #007bff;
      color: white;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .item {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 30px;
      margin-bottom: 15px;
      background: #f9f9f9;
    }

    .product img {
      max-width: 100px;
      float: left;
      margin-right: 30px;
    }

    .clear {
      clear: both;
    }
  </style>
</head>
<body>

  <h1>📦 FakeStore API Viewer</h1>
  <div class="tabs">
    <button onclick="showTab('products')" class="active">🛒 Products</button>
    <button onclick="showTab('users')">👤 Users</button>
    <button onclick="showTab('carts')">🛍️ Carts</button>
    <button onclick="showTab('auth')">🔒 Auth</button>
  </div>

  <div id="products" class="tab-content active"></div>
  <div id="users" class="tab-content"></div>
  <div id="carts" class="tab-content"></div>
  <div id="auth" class="tab-content">
    <div class="item">
      No user is currently authenticated.
    </div>
  </div>

  <script>
    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active')); // 1. Hide all tab content
      document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active')); // 2. Deactivate all tab buttons
      document.getElementById(tabId).classList.add('active'); // 3. Show the selected tab content
      document.querySelector(`.tabs button[onclick="showTab('${tabId}')"]`).classList.add('active'); // 4. Activate the corresponding tab button
    }

    // Fetch and render products
    fetch('https://fakestoreapi.com/products')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('products');
        data.forEach(p => {
          const div = document.createElement('div');
          div.className = 'item product';
          div.innerHTML = `
            <img src="${p.image}" alt="${p.title}">
            <strong>${p.title}</strong><br>
            Price: $${p.price}<br>
            Category: ${p.category}<br>
            <p>${p.description}</p>
            <div class="clear"></div>
          `;
          container.appendChild(div);
        });
      });

    // Fetch and render users
    fetch('https://fakestoreapi.com/users')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('users');
        data.forEach(u => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `
            <strong>ID:</strong> ${u.id}<br>
            <strong>Username:</strong> ${u.username}<br>
            <strong>Email:</strong> ${u.email}
          `;
          container.appendChild(div);
        });
      });

    // Fetch and render carts
    fetch('https://fakestoreapi.com/carts')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('carts');
        data.forEach(c => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `
            <strong>Cart ID:</strong> ${c.id}<br>
            <strong>User ID:</strong> ${c.userId}<br>
            <strong>Products:</strong> ${JSON.stringify(c.products)}
          `;
          container.appendChild(div);
        });
      });
  </script>

</body>
</html>

04/06/2025

Fakestore integrated with SQL

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FakeStore API Explorer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 50px;
    }

    h1 {
      margin-bottom: 10px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .tabs button {
      padding: 10px 20px;
      cursor: pointer;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 5px;
    }

    .tabs button.active {
      background-color: #007bff;
      color: white;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .item {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 30px;
      margin-bottom: 15px;
      background: #f9f9f9;
    }

    .product img {
      max-width: 100px;
      float: left;
      margin-right: 30px;
    }

    .clear {
      clear: both;
    }

    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-group {
      margin-top: 15px;
      display: flex;
      gap: 10px; /* ✅ adds space between buttons */
      flex-wrap: wrap;
    }

    .btn-group button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: background-color 0.2s;
    }

    .btn-group button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    input, textarea {
      width: 100%;
      margin-top: 5px;
      margin-bottom: 10px;
      padding: 5px;
    }
  </style>
</head>
<body>

  <h1>📦 FakeStore API Viewer</h1>
  <div class="tabs">
    <button onclick="showTab('products')" class="active">🛒 Products</button>
    <button onclick="showTab('users')">👤 Users</button>
    <button onclick="showTab('carts')">🛍️ Carts</button>
    <button onclick="showTab('auth')">🔒 Auth</button>
    <button onclick="showTab('inDB')">📂 Products in DB</button>
  </div>

  <div id="products" class="tab-content active"></div>
  <div id="users" class="tab-content"></div>
  <div id="carts" class="tab-content"></div>
  <div id="auth" class="tab-content">
    <div class="item">
      No user is currently authenticated.
    </div>
  </div>
  <div id="inDB" class="tab-content"></div>

  <script>
    const productsInDB = new Map();

    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      document.querySelector(`.tabs button[onclick="showTab('${tabId}')"]`).classList.add('active');
    }

    function createProductCard(p, isDB = false) {
      const div = document.createElement('div');
      div.className = 'item product';
      div.id = `product-${p.id}`;

      const content = document.createElement('div');
      content.innerHTML = `
        <img src="${p.image}" alt="${p.title}">
        <div class="details">
          <strong class="title">${p.title}</strong><br>
          Price: $<span class="price">${p.price}</span><br>
          Category: <span class="category">${p.category}</span><br>
          <p class="description">${p.description}</p>
        </div>
        <div class="clear"></div>
      `;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';

      const addBtn = document.createElement('button');
      addBtn.textContent = 'Add to DB';
      addBtn.disabled = productsInDB.has(p.id);
      addBtn.onclick = () => {
        productsInDB.set(p.id, p);
        updateDBSection();
        addBtn.disabled = true;
        removeBtn.disabled = false;
      };

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.disabled = !productsInDB.has(p.id);
      removeBtn.onclick = () => {
        productsInDB.delete(p.id);
        updateDBSection();
        updateProductSection(); // ensure sync
        removeBtn.disabled = true;
        addBtn.disabled = false;
      };

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => enterEditMode(p, div, isDB);

      btnGroup.append(addBtn, editBtn, removeBtn);
      div.append(content, btnGroup);
      return div;
    }

    function enterEditMode(p, cardDiv, isDB) {
      cardDiv.innerHTML = '';
      const editForm = document.createElement('div');

      editForm.innerHTML = `
        <label>Image URL:</label>
        <input type="text" id="img-${p.id}" value="${p.image}">
        <label>Title:</label>
        <input type="text" id="title-${p.id}" value="${p.title}">
        <label>Price:</label>
        <input type="number" id="price-${p.id}" value="${p.price}">
        <label>Category:</label>
        <input type="text" id="cat-${p.id}" value="${p.category}">
        <label>Description:</label>
        <textarea id="desc-${p.id}">${p.description}</textarea>
      `;

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.onclick = () => {
        p.image = document.getElementById(`img-${p.id}`).value;
        p.title = document.getElementById(`title-${p.id}`).value;
        p.price = parseFloat(document.getElementById(`price-${p.id}`).value);
        p.category = document.getElementById(`cat-${p.id}`).value;
        p.description = document.getElementById(`desc-${p.id}`).value;

         // ✅ Update in allProducts[]
        const indexInAll = allProducts.findIndex(prod => prod.id === p.id);
        if (indexInAll !== -1) allProducts[indexInAll] = { ...p };

        // ✅ Update in productsInDB (if exists)
        if (productsInDB.has(p.id)) {
        productsInDB.set(p.id, { ...p });
        }

        updateProductSection();
        updateDBSection();

        if (isDB) updateDBSection(); else updateProductSection();
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.onclick = () => {
        if (confirm("Are you sure? All the changes you made will be lost.")) {
          if (isDB) updateDBSection(); else updateProductSection();
        }
      };

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';
      btnGroup.append(saveBtn, cancelBtn);

      cardDiv.append(editForm, btnGroup);
    }

    function updateProductSection() {
      const container = document.getElementById('products');
      container.innerHTML = '';
      allProducts.forEach(p => {
        const card = createProductCard(p, false);
        container.appendChild(card);
      });
    }

    function updateDBSection() {
      const container = document.getElementById('inDB');
      container.innerHTML = '';
      productsInDB.forEach(p => {
        const card = createProductCard(p, true);
        container.appendChild(card);
      });
    }

    let allProducts = [];

    fetch('https://fakestoreapi.com/products')
      .then(res => res.json())
      .then(data => {
        allProducts = data;
        updateProductSection();
      });

    fetch('https://fakestoreapi.com/users')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('users');
        data.forEach(u => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `
            <strong>ID:</strong> ${u.id}<br>
            <strong>Username:</strong> ${u.username}<br>
            <strong>Email:</strong> ${u.email}
          `;
          container.appendChild(div);
        });
      });

    fetch('https://fakestoreapi.com/carts')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('carts');
        data.forEach(c => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `
            <strong>Cart ID:</strong> ${c.id}<br>
            <strong>User ID:</strong> ${c.userId}<br>
            <strong>Products:</strong> ${JSON.stringify(c.products)}
          `;
          container.appendChild(div);
        });
      });
  </script>

</body>
</html>

backend code

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

// Update these with your own credentials
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',              // or your MySQL username
  password: 'admin123',              // your MySQL password
  database: 'fakestore'
});

db.connect(err => {
  if (err) {
    console.error('❌ DB Connection Failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

app.use(cors());
app.use(express.json());

// GET all products from DB
app.get('/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST - Add product
app.post('/products', (req, res) => {
  const { id, title, price, category, description, image } = req.body;
  db.query('INSERT INTO products SET ?', { id, title, price, category, description, image }, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// PUT - Update product
app.put('/products/:id', (req, res) => {
  const { title, price, category, description, image } = req.body;
  db.query(
    'UPDATE products SET title=?, price=?, category=?, description=?, image=? WHERE id=?',
    [title, price, category, description, image, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// DELETE - Remove product
app.delete('/products/:id', (req, res) => {
  db.query('DELETE FROM products WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});






05-06-2025 & 06-06-2025

ShopifyAPI.html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shopify Admin Interface</title>
  <style>
    body { font-family: Arial; padding: 40px; }
    h1 { margin-bottom: 10px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .tabs button {
      padding: 10px 20px; cursor: pointer;
      border: 1px solid #ccc; border-radius: 5px;
      background-color: #f0f0f0;
    }
    .tabs button.active {
      background-color: #007bff; color: white;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .item {
      border: 1px solid #ccc; border-radius: 6px;
      padding: 20px; margin-bottom: 15px;
      background: #fafafa; position: relative;
    }

    .product img {
      max-width: 100px; float: left; margin-right: 20px;
    }

    .clear { clear: both; }

    .buttons {
      margin-top: 10px;
    }

    .buttons .btn {
      margin-right: 10px;
      padding: 8px 16px;
      border: none;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .btn-add { background-color: #28a745; color: white; }
    .btn-add:hover { background-color: #218838; }

    .btn-edit { background-color: #007bff; color: white; }
    .btn-edit:hover { background-color: #0056b3; }

    .btn-remove { background-color: #dc3545; color: white; }
    .btn-remove:hover { background-color: #c82333; }

    .btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    input, textarea {
      width: 100%; margin: 6px 0;
    }
  </style>
</head>
<body>

  <h1>📦 Shopify Admin Panel</h1>
  <div class="tabs">
    <button onclick="showTab('products')" class="active">🛒 Products</button>
    <button onclick="showTab('productsindb')">🗃️ Products in DB</button>
    <button onclick="showTab('users')">👤 Users</button>
    <button onclick="showTab('orders')">🛍️ Orders</button>
    <button onclick="showTab('auth')">🔐 Auth Info</button>
  </div>

  <div id="products" class="tab-content active"></div>
  <div id="productsindb" class="tab-content"></div>
  <div id="users" class="tab-content"></div>
  <div id="orders" class="tab-content"></div>
  <div id="auth" class="tab-content"></div>

  <script>
    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      document.querySelector(`.tabs button[onclick="showTab('${tabId}')"]`).classList.add('active');
    }

    const dbProductIds = new Set();
    let allProducts = [];

    // ✅ Get products already in DB
    fetch('http://localhost:3000/products-in-db')
      .then(res => res.json())
      .then(inDbProducts => {
        inDbProducts.forEach(p => dbProductIds.add(p.id));
        loadProducts();
        renderProductsInDb(inDbProducts);
      });

    // ✅ Load products from Shopify
    function loadProducts() {
      fetch('http://localhost:3000/products')
        .then(res => res.json())
        .then(products => {
          allProducts = products;
          const container = document.getElementById('products');
          container.innerHTML = '';
          products.forEach(p => container.appendChild(renderProductCard(p)));
        });
    }

    // ✅ Products in DB tab
    function renderProductsInDb(dbProducts) {
      const container = document.getElementById('productsindb');
      container.innerHTML = '';
      dbProducts.forEach(p => container.appendChild(renderProductCard(p, true)));
    }

    // ✅ Create product card
    function renderProductCard(p, isDbTab = false) {
      const div = document.createElement('div');
      div.className = 'item product';
      div.dataset.id = p.id;

      const inDb = dbProductIds.has(p.id);

      div.innerHTML = `
        <img src="${p.image?.src || ''}">
        <strong>${p.title}</strong><br>
        Price: $${p.variants?.[0]?.price || p.price}<br>
        Category: ${p.product_type || p.category}<br>
        <p>${p.body_html || p.description}</p>
        <div class="buttons">
          <button class="btn btn-add" onclick="addToDB(event, '${p.id}')" ${inDb ? 'disabled' : ''}>Add to DB</button>
          <button class="btn btn-edit" onclick="editProduct('${p.id}')">Edit</button>
          <button class="btn btn-remove" onclick="removeFromDB(event, '${p.id}')" ${inDb ? '' : 'disabled'}>Remove</button>
        </div>
        <div class="clear"></div>
      `;
      return div;
    }

    function addToDB(e, id) {
      e.preventDefault();
      fetch(`http://localhost:3000/add-to-db/${id}`, { method: 'POST' })
        .then(res => res.json())
        .then(() => {
          dbProductIds.add(Number(id));
          updateAllCards(id);
        });
    }

    function removeFromDB(e, id) {
      e.preventDefault();
      if (!confirm("Are you sure you want to remove this from DB?")) return;
      fetch(`http://localhost:3000/remove/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
          dbProductIds.delete(Number(id));
          updateAllCards(id);
        });
    }

    function editProduct(id) {
      const card = document.querySelector(`[data-id="${id}"]`);
      const product = allProducts.find(p => p.id == id);
      const price = product.variants?.[0]?.price || product.price;

      card.innerHTML = `
        <strong>Edit Product</strong><br>
        <input id="etitle${id}" value="${product.title}">
        <input id="eprice${id}" value="${price}">
        <input id="ecategory${id}" value="${product.product_type || product.category}">
        <input id="eimage${id}" value="${product.image?.src || product.image}">
        <textarea id="edesc${id}">${product.body_html || product.description}</textarea>
        <div class="buttons">
          <button class="btn btn-edit" onclick="saveEdit('${id}')">Save</button>
          <button class="btn btn-remove" onclick="cancelEdit('${id}')">Cancel</button>
        </div>
      `;
    }

    function saveEdit(id) {
      const data = {
        title: document.getElementById('etitle' + id).value,
        price: document.getElementById('eprice' + id).value,
        category: document.getElementById('ecategory' + id).value,
        image: document.getElementById('eimage' + id).value,
        description: document.getElementById('edesc' + id).value
      };

      fetch(`http://localhost:3000/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(res => res.json())
        .then(() => {
          Object.assign(allProducts.find(p => p.id == id), data);
          updateAllCards(id);
        });
    }

    function cancelEdit(id) {
      if (confirm("Are you sure? All changes will be lost.")) updateAllCards(id);
    }

    function updateAllCards(id) {
      document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
        const prod = allProducts.find(p => p.id == id);
        const replacement = renderProductCard(prod, el.parentElement.id === 'productsindb');
        el.replaceWith(replacement);
      });
    }

    // ✅ Customers
    fetch('http://localhost:3000/customers')
      .then(res => res.json())
      .then(users => {
        const container = document.getElementById('users');
        users.forEach(u => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `<strong>${u.first_name} ${u.last_name}</strong><br>Email: ${u.email}`;
          container.appendChild(div);
        });
      });

    // ✅ Orders
    fetch('http://localhost:3000/orders')
      .then(res => res.json())
      .then(orders => {
        const container = document.getElementById('orders');
        orders.forEach(o => {
          const div = document.createElement('div');
          div.className = 'item';
          div.innerHTML = `<strong>Order ID:</strong> ${o.id}<br>Total: $${o.total_price}`;
          container.appendChild(div);
        });
      });

    // ✅ Auth Info
    fetch('http://localhost:3000/shop')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('auth');
        const s = data.shop;
        container.innerHTML = `
          <div class="item">
            <strong>Shop:</strong> ${s.name}<br>
            <strong>Domain:</strong> ${s.myshopify_domain}<br>
            <strong>Email:</strong> ${s.email}
          </div>
        `;
      });
  </script>
</body>
</html>

server.js

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
const TOKEN = 'process.env.SHOPIFY_TOKEN'; // ← update

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
