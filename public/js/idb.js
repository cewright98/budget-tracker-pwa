// establish connection
let db;
const request = indexedDB.open('budget_tracker', 1);

// add object store
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('new_budget_item', { autoIncrement: true });
};

// on success
request.onsuccess = function(event) {

  db = event.target.result;

  // check if app is online
  if (navigator.onLine) {

    uploadBudgetItem();
  }
};

// on error
request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

// function to save data without internet
function saveRecord(record) {
  const transaction = db.transaction(['new_budget_item'], 'readwrite');

  const budgetObjectStore = transaction.objectStore('new_budget_item');

  budgetObjectStore.add(record);

  // message to notify that the expense was added offline
  alert("Budget item added offline.")
}

// function to upload budget items added offline when connection is reestablished
function uploadBudgetItem() {
  const transaction = db.transaction(['new_budget_item'], 'readwrite');

  const budgetObjectStore = transaction.objectStore('new_budget_item');

  const getAll = budgetObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function() {
    // check if data in api store
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
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

          const transaction = db.transaction(['new_budget_item'], 'readwrite');
  
          const budgetObjectStore = transaction.objectStore('new_budget_item');
          
          // clear all items in your store
          budgetObjectStore.clear();

          alert('All saved budget items have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

// event listener for reestablished internet connection
window.addEventListener('online', uploadBudgetItem);