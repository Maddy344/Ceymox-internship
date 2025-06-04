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



