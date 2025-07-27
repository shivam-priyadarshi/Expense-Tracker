const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const listEl = document.getElementById('list');
const form = document.getElementById('form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const noTransactionsEl = document.getElementById('no-transactions');

const getTransactionsFromStorage = () => {
    const storedTransactions = localStorage.getItem('transactions');
    return storedTransactions ? JSON.parse(storedTransactions) : [];
};

let transactions = getTransactionsFromStorage();

const saveTransactionsToStorage = () => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
};

const addTransactionToDOM = (transaction) => {
    const isExpense = transaction.amount < 0;
    const sign = isExpense ? '-' : '+';
    const item = document.createElement('li');
    item.className = `flex items-center justify-between p-4 rounded-xl bg-white/80 backdrop-blur-sm border hover:shadow-md transition-all duration-300`;
    
    const formattedDate = new Date(transaction.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const iconBg = isExpense ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
    const icon = isExpense 
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" /></svg>`;

    item.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center ${iconBg}">
               ${icon}
            </div>
            <div>
                <div class="font-medium capitalize">${transaction.text}</div>
                <div class="text-sm text-gray-500">${formattedDate}</div>
            </div>
        </div>
        <div class="flex items-center">
            <span class="font-semibold text-sm sm:text-base ${isExpense ? 'text-red-600' : 'text-green-600'}">
                ${sign}₹${Math.abs(transaction.amount).toFixed(2)}
            </span>
            <button data-id="${transaction.id}" class="delete-btn ml-4 text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    `;
    listEl.appendChild(item);
};

const updateUI = () => {
    listEl.innerHTML = '';

    if (transactions.length === 0) {
        noTransactionsEl.classList.remove('hidden');
    } else {
        noTransactionsEl.classList.add('hidden');
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        transactions.forEach(addTransactionToDOM);
    }

    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0);
    const expense = amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0);

    balanceEl.textContent = `₹${total.toFixed(2)}`;
    moneyPlusEl.textContent = `+₹${income.toFixed(2)}`;
    moneyMinusEl.textContent = `-₹${Math.abs(expense).toFixed(2)}`;
    
    balanceEl.classList.toggle('text-red-600', total < 0);
    balanceEl.classList.toggle('text-gray-800', total >= 0);
};

const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!textInput.value.trim() || !amountInput.value.trim()) {
        alert('Please provide a description and amount.');
        return;
    }

    const type = form.elements.type.value;
    const amount = parseFloat(amountInput.value);

    const newTransaction = {
        id: new Date().getTime(),
        text: textInput.value,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        createdAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    saveTransactionsToStorage();
    updateUI();
    form.reset();
    document.querySelector('input[name="type"][value="expense"]').checked = true;
};

const handleDeleteTransaction = (e) => {
    const deleteButton = e.target.closest('.delete-btn');
    if (deleteButton) {
        const id = parseInt(deleteButton.dataset.id);
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveTransactionsToStorage();
            updateUI();
        }
    }
};

form.addEventListener('submit', handleAddTransaction);
listEl.addEventListener('click', handleDeleteTransaction);

updateUI();
