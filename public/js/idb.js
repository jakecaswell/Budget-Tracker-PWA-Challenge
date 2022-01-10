// create var to hold db connection
let db;

// establish connection to IndexedDB database
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    // save reference to the database
    const db = event.target.result;
    // create an object store and set it to have an autoincrementing primary key
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    if (navigator.onLine) {
        uploadTransaction();
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode);
}

// this function will be executed if trying to submit a transaction offline
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction')
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        // if data in indexedDB's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);