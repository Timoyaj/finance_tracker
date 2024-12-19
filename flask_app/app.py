from flask import Flask, render_template, request, redirect, url_for
import sqlite3

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('transactions.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            amount REAL,
            category TEXT,
            description TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    conn = get_db_connection()
    category = request.args.get('category')
    if category:
        transactions = conn.execute('SELECT * FROM transactions WHERE category = ?', (category,)).fetchall()
    else:
        transactions = conn.execute('SELECT * FROM transactions').fetchall()
    
    total_income = 0
    total_expense = 0
    for transaction in transactions:
        if transaction['category'] == 'income':
            total_income += transaction['amount']
        else:
            total_expense += transaction['amount']
    
    balance = total_income - total_expense
    conn.close()
    return render_template('index.html', transactions=transactions, total_income=total_income, total_expense=total_expense, balance=balance)

@app.route('/add', methods=['POST'])
def add_transaction():
    date = request.form['date']
    amount = float(request.form['amount'])
    category = request.form['category']
    description = request.form['description']
    conn = get_db_connection()
    conn.execute('INSERT INTO transactions (date, amount, category, description) VALUES (?, ?, ?, ?)', (date, amount, category, description))
    conn.commit()
    conn.close()
    return redirect(url_for('index', message='Transaction added successfully'))

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_transaction(id):
    conn = get_db_connection()
    transaction = conn.execute('SELECT * FROM transactions WHERE id = ?', (id,)).fetchone()
    if request.method == 'POST':
        date = request.form['date']
        amount = float(request.form['amount'])
        category = request.form['category']
        description = request.form['description']
        conn.execute('UPDATE transactions SET date = ?, amount = ?, category = ?, description = ? WHERE id = ?', (date, amount, category, description, id))
        conn.commit()
        conn.close()
        return redirect(url_for('index'))
    conn.close()
    return render_template('edit.html', transaction=transaction)

@app.route('/delete/<int:id>')
def delete_transaction(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM transactions WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
