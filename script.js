import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const listEl = document.getElementById('list');
const form = document.getElementById('form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const userIdEl = document.getElementById('user-id');
const loadingOverlay = document.getElementById('loading-overlay');

try {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    if (Object.keys(firebaseConfig).length === 0) {
        throw new Error("Firebase configuration is missing.");
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let userId = null;
    let transactionsCollectionRef = null;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
            userIdEl.textContent = userId;
            initializeTransactionsListener();
        } else {
            try {
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Error signing in:", error);
                userIdEl.textContent = 'Authentication Failed';
            }
        }
        loadingOverlay.style.display = 'none';
    });

    function initializeTransactionsListener() {
        if (!userId) return;
        transactionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/transactions`);
        const q = query(transactionsCollectionRef);

        onSnapshot(q, (snapshot) => {
            const transactions = [];
            snapshot.forEach(doc => {
                transactions.push({ ...doc.data(), id: doc.id });
            });
            transactions.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
                return dateB - dateA;
            });
            updateDOM(transactions);
        }, (error) => {
            console.error("Error fetching transactions:", error);
        });
    }

    function updateDOM(transactions = []) {
        listEl.innerHTML = '';

        transactions.forEach(addTransactionToDOM);

        const amounts = transactions.map(t => t.amount);
        const total = amounts.reduce((acc, item) => (acc += item), 0);
        const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
        const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1);

        balanceEl.innerText = `₹${total.toFixed(2)}`;
        balanceEl.className = `text-3xl font-bold ${total >= 0 ? 'text-green-500' : 'text-red-500'}`;
        moneyPlusEl.innerText = `+₹${income.toFixed(2)}`;
        moneyMinusEl.innerText = `-₹${expense.toFixed(2)}`;
    }

    function addTransactionToDOM(transaction) {
        const sign = transaction.amount < 0 ? '-' : '+';
        const item = document.createElement('li');
        
        item.className = `flex justify-between items-center p-3 mb-2 rounded-lg shadow-sm ${transaction.amount < 0 ? 'border-r-4 border-red-500' : 'border-r-4 border-green-500'} bg-gray-50`;

        const dateString = transaction.createdAt?.toDate ? 
            new Date(transaction.createdAt.toDate()).toLocaleString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
            }) : 'No date';

        item.innerHTML = `
            <div>
                <span class="text-gray-800 capitalize font-medium">${transaction.text}</span>
                <p class="text-sm text-gray-500 mt-1">${dateString}</p>
            </div>
            <div class="flex items-center">
                <span class="font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}">
                    ${sign}₹${Math.abs(transaction.amount).toFixed(2)}
                </span>
                <button class="delete-btn ml-4 bg-red-500 text-white py-1 px-2 rounded-full text-xs hover:bg-red-600 transition-colors duration-200" data-id="${transaction.id}">
                    x
                </button>
            </div>
        `;
        listEl.appendChild(item);
    }

    async function handleAddTransaction(e) {
        e.preventDefault();
        if (!userId || textInput.value.trim() === '' || amountInput.value.trim() === '') {
            alert('Please add a text and amount');
            return;
        }

        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(amountInput.value);

        const newTransaction = {
            text: textInput.value,
            amount: type === 'income' ? Math.abs(amount) : -Math.abs(amount),
            createdAt: serverTimestamp(),
            userId: userId,
        };

        try {
            await addDoc(transactionsCollectionRef, newTransaction);
            textInput.value = '';
            amountInput.value = '';
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }

    async function handleDeleteTransaction(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            if (!userId || !id) return;
            
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/transactions`, id));
            } catch (error) {
                console.error("Error removing document: ", error);
            }
        }
    }

    form.addEventListener('submit', handleAddTransaction);
    listEl.addEventListener('click', handleDeleteTransaction);

} catch (error) {
    console.error("Application initialization failed:", error);
    if (loadingOverlay) {
        loadingOverlay.innerHTML = `<p class="text-lg text-red-500 text-center p-4">Error: Could not start the application.<br>Please check the console for details.</p>`;
    }
}
