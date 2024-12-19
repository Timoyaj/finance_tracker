import initSqlJs from './node_modules/sql.js/dist/sql-wasm.js';

let db;

async function initDB() {
    const SQL = await initSqlJs({
        locateFile: file => `/node_modules/sql.js/dist/${file}`
    });
    db = new SQL.Database();
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            amount REAL,
            category TEXT,
            description TEXT
        )
    `);
}

initDB();

// Initialize an empty array to store transactions
// let transactions = [];

// Function to add a new transaction
function addTransaction(transaction) {
    const { date, amount, category, description } = transaction;
    db.run('INSERT INTO transactions (date, amount, category, description) VALUES (?, ?, ?, ?)', [date, amount, category, description]);
    updateTransactionHistory();
    updateTotalBalance();
    document.getElementById('form-error').textContent = 'Transaction added successfully';
}

// Function to update the transaction history table
async function updateTransactionHistory() {
    const transactionHistory = document.getElementById('transaction-history');
    transactionHistory.innerHTML = '';
    const result = db.exec('SELECT * FROM transactions');
    if (result && result[0]) {
        const transactions = result[0].values;
        transactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction[1]}</td>
                <td>$${transaction[2].toFixed(2)}</td>
                <td>${transaction[3]}</td>
                <td>${transaction[4]}</td>
                <td>
                    <button class="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded edit-button" data-id="${transaction[0]}">Edit</button>
                    <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded delete-button" data-id="${transaction[0]}">Delete</button>
                </td>
            `;
            transactionHistory.appendChild(row);
        });
    }
    document.getElementById('transaction-history').addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-button')) {
            const id = e.target.dataset.id;
            await editTransaction(id);
        }
        if (e.target.classList.contains('delete-button')) {
            const id = e.target.dataset.id;
            await deleteTransaction(id);
        }
    });
}

// Function to update the total balance
async function updateTotalBalance() {
    const totalBalance = document.getElementById('total-balance');
    let balance = 0;
    const result = db.exec('SELECT * FROM transactions');
     if (result && result[0]) {
        const transactions = result[0].values;
        balance = transactions.reduce((acc, transaction) => {
            if (transaction[3] === 'income') {
                return acc + transaction[2];
            } else {
                return acc - transaction[2];
            }
        }, 0);
    }
    totalBalance.textContent = `$${balance.toFixed(2)}`;
}

// Function to edit a transaction
async function editTransaction(id) {
    const result = db.exec('SELECT * FROM transactions WHERE id = ?', [id]);
    if (result && result[0]) {
        const transaction = result[0].values[0];
        const date = prompt('Enter new date:', transaction[1]);
        const amount = parseFloat(prompt('Enter new amount:', transaction[2]));
        const category = prompt('Enter new category:', transaction[3]);
        const description = prompt('Enter new description:', transaction[4]);
         if (date && amount && category && description) {
            db.run('UPDATE transactions SET date = ?, amount = ?, category = ?, description = ? WHERE id = ?', [date, amount, category, description, id]);
            updateTransactionHistory();
            updateTotalBalance();
        }
    }
}

// Function to delete a transaction
async function deleteTransaction(id) {
    db.run('DELETE FROM transactions WHERE id = ?', [id]);
    updateTransactionHistory();
    updateTotalBalance();
}

// Function to validate form data
function validateFormData(date, amount, category, description) {
    const errors = {};
    if (!date) {
        errors.date = 'Date is required';
    }
    if (!amount || amount <= 0) {
        errors.amount = 'Amount must be a positive number';
    }
    if (!category) {
        errors.category = 'Category is required';
    }
    if (!description) {
        errors.description = 'Description is required';
    }
    return errors;
}

// Event listener for the add transaction form
document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const errors = validateFormData(date, amount, category, description);
    if (Object.keys(errors).length > 0) {
        document.getElementById('date-error').textContent = errors.date || '';
        document.getElementById('amount-error').textContent = errors.amount || '';
        document.getElementById('category-error').textContent = errors.category || '';
        document.getElementById('description-error').textContent = errors.description || '';
        document.getElementById('form-error').textContent = 'Please fix the errors above';
    } else {
        await addTransaction({ date, amount, category, description });
        document.getElementById('add-transaction-form').reset();
        document.getElementById('date-error').textContent = '';
        document.getElementById('amount-error').textContent = '';
        document.getElementById('category-error').textContent = '';
        document.getElementById('description-error').textContent = '';
        document.getElementById('form-error').textContent = '';
    }
});

// Initialize transactions from local storage
// if (localStorage.transactions) {
//     transactions = JSON.parse(localStorage.transactions);
//     updateTransactionHistory();
//     updateTotalBalance();
// }

// Save transactions to local storage when the page is closed
// window.onbeforeunload = () => {
//     localStorage.transactions = JSON.stringify(transactions);
// };

updateTransactionHistory();
updateTotalBalance();
