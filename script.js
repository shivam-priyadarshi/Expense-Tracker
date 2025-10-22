
const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const listEl = document.getElementById('list');
const form = document.getElementById('form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const noTransactionsEl = document.getElementById('no-transactions');
const chartCanvas = document.getElementById('expenseChart');
const resetAllBtn = document.getElementById('reset-all-btn');

const dashboardBtn = document.getElementById('dashboard-btn');
const reportsBtn = document.getElementById('reports-btn');
const goalsBtn = document.getElementById('goals-btn');
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let expenseChart = null;

// Budget feature: DOM refs and helpers
const setBudgetBtn = document.getElementById('set-budget-btn');
const clearBudgetBtn = document.getElementById('clear-budget-btn');
const budgetSummaryEl = document.getElementById('budget-summary');
const budgetTotalEl = document.getElementById('budget-total');
const budgetSpentEl = document.getElementById('budget-spent');
const budgetRemainingEl = document.getElementById('budget-remaining');
const budgetProgressFill = document.getElementById('budget-progress-fill');
const budgetWarningEl = document.getElementById('budget-warning');

let budget = null; // { amount: number, month: 'YYYY-MM' }

const showView = (viewId) => {
    views.forEach(view => {
        view.classList.toggle('hidden', view.id !== viewId);
    });
};

const handleNavClick = (e, viewId) => {
    e.preventDefault();
    showView(viewId);
    navLinks.forEach(link => link.classList.remove('active-link'));
    e.currentTarget.classList.add('active-link');
};

dashboardBtn.addEventListener('click', (e) => handleNavClick(e, 'dashboard-view'));
reportsBtn.addEventListener('click', (e) => handleNavClick(e, 'reports-view'));
goalsBtn.addEventListener('click', (e) => handleNavClick(e, 'goals-view'));

const saveTransactions = () => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
};

const saveBudget = () => {
    if (budget) {
        localStorage.setItem('budget', JSON.stringify(budget));
    } else {
        localStorage.removeItem('budget');
    }
};

const loadBudget = () => {
    const raw = localStorage.getItem('budget');
    console.log(raw);
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        // Only use budget if it belongs to current month
        if (parsed && parsed.month === currentMonth) {
            budget = parsed;
            console.log(raw);
        } else {
            // Clear outdated monthly budget
            budget = null;
            localStorage.removeItem('budget');
        }
    } catch (err) {
        console.error('Failed to parse stored budget', err);
        budget = null;
    }
};

const updateBudgetUI = () => {
    if (!budget) {
        budgetSummaryEl.classList.add('hidden');
        clearBudgetBtn.classList.add('hidden');
        return;
    }

    const spent = transactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const remaining = budget.amount - spent;

    budgetSummaryEl.classList.remove('hidden');
    clearBudgetBtn.classList.remove('hidden');

    budgetTotalEl.textContent = `₹${budget.amount.toFixed(2)}`;
    budgetSpentEl.textContent = `₹${spent.toFixed(2)}`;
    budgetRemainingEl.textContent = `₹${remaining.toFixed(2)}`;

    const percent = budget.amount > 0 ? Math.min(100, (spent / budget.amount) * 100) : 0;
    budgetProgressFill.style.width = `${percent}%`;

    // Reset color classes then apply based on fill percent
    budgetProgressFill.classList.remove('bg-green-400', 'bg-amber-400', 'bg-orange-400', 'bg-red-400');

    if (spent > budget.amount) {
        // Over budget: red
        budgetProgressFill.classList.add('bg-red-400');
        budgetWarningEl.classList.remove('hidden');
        budgetRemainingEl.classList.remove('text-green-600');
        budgetRemainingEl.classList.add('text-red-500');
    } else if (percent > 75) {
        // High usage: orange
        budgetProgressFill.classList.add('bg-orange-400');
        budgetWarningEl.classList.add('hidden');
        budgetRemainingEl.classList.remove('text-red-500');
        budgetRemainingEl.classList.add('text-green-600');
    } else if (percent > 50) {
        // Moderate usage: amber (yellow)
        budgetProgressFill.classList.add('bg-amber-400');
        budgetWarningEl.classList.add('hidden');
        budgetRemainingEl.classList.remove('text-red-500');
        budgetRemainingEl.classList.add('text-green-600');
    } else {
        // Safe: green
        budgetProgressFill.classList.add('bg-green-400');
        budgetWarningEl.classList.add('hidden');
        budgetRemainingEl.classList.remove('text-red-500');
        budgetRemainingEl.classList.add('text-green-600');
    }
};

const handleSetBudget = () => {
    const input = prompt('Enter your budget for this month (₹):');
    if (input === null) return; // cancelled
    const value = parseFloat(input.replace(/,/g, '').trim());
    if (isNaN(value) || value <= 0) {
        alert('Please enter a valid positive number for budget.');
        return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    budget = { amount: value, month: currentMonth };
    saveBudget();
    updateBudgetUI();
};

const handleClearBudget = () => {
    if (!budget) return;
    if (!confirm('Clear the current budget for this month?')) return;
    budget = null;
    saveBudget();
    updateBudgetUI();
};

const renderChart = () => {
    const dailyExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((acc, t) => {
            const date = new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            acc[date] = (acc[date] || 0) + Math.abs(t.amount);
            return acc;
        }, {});

    const sortedDates = Object.keys(dailyExpenses).sort((a, b) => new Date(a.split(' ').reverse().join(' ')) - new Date(b.split(' ').reverse().join(' ')));
    const last7Days = sortedDates.slice(-7);

    const chartData = {
        labels: last7Days,
        datasets: [{
            label: 'Daily Expense',
            data: last7Days.map(date => dailyExpenses[date]),
            backgroundColor: 'rgba(236, 72, 153, 0.6)',
            borderColor: 'rgba(236, 72, 153, 1)',
            borderWidth: 1,
            borderRadius: 8,
            barThickness: 20,
        }]
    };

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(chartCanvas, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { callback: (value) => `₹${value}` }
                },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
};

const addTransactionToDOM = (transaction) => {
    const isExpense = transaction.amount < 0;
    const sign = isExpense ? '-' : '+';
    const item = document.createElement('li');
    item.className = `flex items-center justify-between p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-all duration-300`;
    
    const formattedDate = new Date(transaction.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const iconBg = isExpense ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
    const icon = isExpense 
        ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>`;

    item.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center ${iconBg}">
               ${icon}
            </div>
            <div>
                <div class="font-semibold capitalize">${transaction.text}</div>
                <div class="text-sm text-gray-500">${formattedDate}</div>
            </div>
        </div>
        <div class="flex items-center">
            <span class="font-bold text-lg ${isExpense ? 'text-red-500' : 'text-green-500'}">
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
    
    noTransactionsEl.classList.toggle('hidden', transactions.length > 0);
    resetAllBtn.classList.toggle('hidden', transactions.length === 0);

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    transactions.forEach(addTransactionToDOM);

    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0);
    const expense = amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0);

    balanceEl.textContent = `₹${total.toFixed(2)}`;
    moneyPlusEl.textContent = `+₹${income.toFixed(2)}`;
    moneyMinusEl.textContent = `-₹${Math.abs(expense).toFixed(2)}`;
    
    balanceEl.classList.toggle('text-red-500', total < 0);
    balanceEl.classList.toggle('text-gray-800', total >= 0);

    renderChart();

    // Update budget UI whenever transactions change
    updateBudgetUI();
};

const addTransaction = (e) => {
    e.preventDefault();
    if (!textInput.value.trim() || !amountInput.value.trim()) {
        alert('Please provide a description and amount.');
        return;
    }

    const type = form.elements.type.value;
    const amount = parseFloat(amountInput.value);

    const newTransaction = {
        id: Date.now(),
        text: textInput.value,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        createdAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    saveTransactions();
    updateUI();
    form.reset();
    document.querySelector('input[name="type"][value="expense"]').checked = true;
};

const deleteTransaction = (id) => {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
};

const resetAllTransactions = () => {
    if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
        transactions = [];
        saveTransactions();
        updateUI();
    }
};

listEl.addEventListener('click', (e) => {
    const deleteButton = e.target.closest('.delete-btn');
    if (deleteButton) {
        const id = parseInt(deleteButton.dataset.id);
        deleteTransaction(id);
    }
});

form.addEventListener('submit', addTransaction);
resetAllBtn.addEventListener('click', resetAllTransactions);
setBudgetBtn.addEventListener('click', handleSetBudget);
clearBudgetBtn.addEventListener('click', handleClearBudget);

loadBudget();

showView('dashboard-view');
dashboardBtn.classList.add('active-link');
updateUI();