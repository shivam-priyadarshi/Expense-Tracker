const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const listEl = document.getElementById('list');
const form = document.getElementById('form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');

let transactions = [];

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

function addTransactionToDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');

    item.className = `flex justify-between items-center p-3 mb-2 rounded-lg shadow-sm ${transaction.amount < 0 ? 'border-r-4 border-red-500' : 'border-r-4 border-green-500'} bg-gray-50`;

    const dateString = new Date(transaction.createdAt).toLocaleString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    item.innerHTML = `
        <div>
            <span class="text-gray-800 capitalize font-medium">${transaction.text}</span>
            <p class="text-sm text-gray-500 mt-1">${dateString}</p>
        </div>
        <div class="flex items-center">
            <span class="font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}">
                ${sign}₹${Math.abs(transaction.amount).toFixed(2)}
            </span>
            <button class="delete-btn ml-4 bg-red-500 text-white py-1 px-2 rounded-full text-xs hover:bg-red-600" onclick="removeTransaction(${transaction.id})">
                x
            </button>
        </div>
    `;
    listEl.appendChild(item);
}

function updateValues() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1);

    balanceEl.innerText = `₹${total.toFixed(2)}`;
    balanceEl.className = `text-3xl font-bold ${total >= 0 ? 'text-green-500' : 'text-red-500'}`;
    moneyPlusEl.innerText = `+₹${income.toFixed(2)}`;
    moneyMinusEl.innerText = `-₹${expense.toFixed(2)}`;
}

function addTransaction(e) {
    e.preventDefault();

    if (textInput.value.trim() === '' || amountInput.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const type = document.querySelector('input[name="type"]:checked').value;
    const amount = parseFloat(amountInput.value);

    const transaction = {
        id: generateID(),
        text: textInput.value,
        amount: type === 'income' ? Math.abs(amount) : -Math.abs(amount),
        createdAt: new Date()
    };

    transactions.push(transaction);
    init();

    textInput.value = '';
    amountInput.value = '';
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    init();
}

function init() {
    listEl.innerHTML = '';
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    transactions.forEach(addTransactionToDOM);
    updateValues();
}

form.addEventListener('submit', addTransaction);

init();
