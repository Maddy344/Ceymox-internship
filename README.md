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


