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