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



