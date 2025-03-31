import supabase from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    // Your existing code
});
    // DOM elements
    const inventoryTable = document.getElementById('inventory-table');
    const transactionsTable = document.getElementById('transactions-table');
    const searchInput = document.getElementById('search');
    const addItemBtn = document.getElementById('add-item');
    const recordOutputBtn = document.getElementById('record-output');
    const transferItemBtn = document.getElementById('transfer-item');
    const viewReportsBtn = document.getElementById('view-reports');
    const itemModal = document.getElementById('item-modal');
    const outputModal = document.getElementById('output-modal');
    const transferModal = document.getElementById('transfer-modal');
    const reportsModal = document.getElementById('reports-modal');
    const closeBtns = document.querySelectorAll('.close');
    const itemForm = document.getElementById('item-form');
    const outputForm = document.getElementById('output-form');
    const transferForm = document.getElementById('transfer-form');
    const outputItemSelect = document.getElementById('output-item');
    const transferItemSelect = document.getElementById('transfer-item-select');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const transactionTypeFilter = document.getElementById('transaction-type');
    const transactionLocationFilter = document.getElementById('transaction-location');
    const transactionDateFilter = document.getElementById('transaction-date');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const reportResults = document.getElementById('report-results');
    const exportReportBtn = document.getElementById('export-report');

    // Initialize data
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Load data on page load
    renderInventory();
    renderTransactions();
    updateSummary();

    // Event listeners
    addItemBtn.addEventListener('click', openItemModal);
    recordOutputBtn.addEventListener('click', openOutputModal);
    transferItemBtn.addEventListener('click', openTransferModal);
    viewReportsBtn.addEventListener('click', openReportsModal);
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    itemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleItemFormSubmit();
    });
    
    outputForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleOutputFormSubmit();
    });
    
    transferForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleTransferFormSubmit();
    });
    
    searchInput.addEventListener('input', filterInventory);
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            switchTab(e);
        });
    });
    
    applyFiltersBtn.addEventListener('click', applyTransactionFilters);
    
    // Report buttons
    document.getElementById('stock-report').addEventListener('click', generateStockReport);
    document.getElementById('transaction-report').addEventListener('click', generateTransactionReport);
    document.getElementById('category-report').addEventListener('click', generateCategoryReport);
    document.getElementById('location-report').addEventListener('click', generateLocationReport);
    exportReportBtn.addEventListener('click', exportReportToCSV);

    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });

    // Render inventory table
    function renderInventory(items = inventory) {
        inventoryTable.innerHTML = '';
        
        if (items.length === 0) {
            inventoryTable.innerHTML = '<tr><td colspan="6" class="text-center">No items found</td></tr>';
            return;
        }
        
        items.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>${item.location}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${item.id}">Edit</button>
                    <button class="delete-btn" data-id="${item.id}">Delete</button>
                </td>
            `;
            
            inventoryTable.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                editItem(itemId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                deleteItem(itemId);
            });
        });
    }

    // Render transactions table
    function renderTransactions(trans = transactions) {
        transactionsTable.innerHTML = '';
        
        if (trans.length === 0) {
            transactionsTable.innerHTML = '<tr><td colspan="8" class="text-center">No transactions found</td></tr>';
            return;
        }
        
        trans.forEach(transaction => {
            const row = document.createElement('tr');
            
            const typeClass = transaction.type === 'input' ? 'text-success' : 
                            transaction.type === 'output' ? 'text-danger' : 'text-info';
            
            row.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.itemCode}</td>
                <td>${transaction.itemName}</td>
                <td class="${typeClass}">
                    ${transaction.type === 'input' ? 'Input' : 
                     transaction.type === 'output' ? 'Output' : 'Transfer'}
                </td>
                <td>${transaction.quantity}</td>
                <td>${transaction.fromLocation || '-'}</td>
                <td>${transaction.toLocation || '-'}</td>
                <td>${transaction.notes || '-'}</td>
            `;
            
            transactionsTable.appendChild(row);
        });
    }

    // Filter inventory based on search input
    function filterInventory() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = inventory.filter(item => 
            item.code.toLowerCase().includes(searchTerm) || 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm)
        );
        renderInventory(filtered);
    }

    // Apply filters to transactions
    function applyTransactionFilters() {
        let filtered = [...transactions];
        const type = transactionTypeFilter.value;
        const location = transactionLocationFilter.value;
        const date = transactionDateFilter.value;
        
        if (type !== 'all') {
            filtered = filtered.filter(t => t.type === type);
        }
        
        if (location !== 'all') {
            filtered = filtered.filter(t => 
                t.fromLocation === location || t.toLocation === location || t.location === location
            );
        }
        
        if (date) {
            filtered = filtered.filter(t => t.date.startsWith(date));
        }
        
        renderTransactions(filtered);
    }

    // Open item modal for adding new item
    function openItemModal() {
        document.getElementById('modal-title').textContent = 'Add New Item';
        document.getElementById('item-id').value = '';
        itemForm.reset();
        itemModal.style.display = 'block';
    }

    // Open item modal for editing
    function editItem(itemId) {
        const item = inventory.find(i => i.id === itemId);
        
        if (item) {
            document.getElementById('modal-title').textContent = 'Edit Item';
            document.getElementById('item-id').value = item.id;
            document.getElementById('item-code').value = item.code;
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-category').value = item.category;
            document.getElementById('item-quantity').value = item.quantity;
            document.getElementById('item-location').value = item.location;
            document.getElementById('item-notes').value = item.notes || '';
            
            itemModal.style.display = 'block';
        }
    }

    // Open output modal
    function openOutputModal() {
        outputItemSelect.innerHTML = '<option value="">Select item</option>';
        
        inventory.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.code} - ${item.name} (${item.quantity} @ ${item.location})`;
            outputItemSelect.appendChild(option);
        });
        
        outputForm.reset();
        outputModal.style.display = 'block';
    }

    // Open transfer modal
    function openTransferModal() {
        transferItemSelect.innerHTML = '<option value="">Select item</option>';
        
        inventory.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.code} - ${item.name} (${item.quantity} @ ${item.location})`;
            transferItemSelect.appendChild(option);
        });
        
        transferForm.reset();
        transferModal.style.display = 'block';
    }

    // Open reports modal
    function openReportsModal() {
        reportsModal.style.display = 'block';
        reportResults.innerHTML = '<p>Select a report to generate.</p>';
    }

    // Close all modals
    function closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Switch between tabs
    function switchTab(e) {
        const tabId = e.target.getAttribute('data-tab');
        
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    // Handle item form submission (add/edit)
    function handleItemFormSubmit() {
        const itemId = document.getElementById('item-id').value;
        const code = document.getElementById('item-code').value.trim();
        const name = document.getElementById('item-name').value.trim();
        const category = document.getElementById('item-category').value;
        const quantity = parseInt(document.getElementById('item-quantity').value);
        const location = document.getElementById('item-location').value;
        const notes = document.getElementById('item-notes').value.trim();
        
        // Validate
        if (!code || !name || !category || isNaN(quantity) || !location) {
            alert('Please fill all required fields');
            return;
        }
        
        if (itemId) {
            // Edit existing item
            const index = inventory.findIndex(i => i.id === itemId);
            if (index !== -1) {
                // Record the change in transactions
                const oldItem = inventory[index];
                const quantityChange = quantity - oldItem.quantity;
                
                if (quantityChange !== 0) {
                    recordTransaction({
                        itemId: oldItem.id,
                        itemCode: oldItem.code,
                        itemName: oldItem.name,
                        type: quantityChange > 0 ? 'input' : 'output',
                        quantity: Math.abs(quantityChange),
                        fromLocation: quantityChange > 0 ? '' : oldItem.location,
                        toLocation: quantityChange > 0 ? oldItem.location : '',
                        notes: `System update: ${quantityChange > 0 ? 'Added' : 'Removed'} ${Math.abs(quantityChange)} items`
                    });
                }
                
                inventory[index] = {
                    ...inventory[index],
                    code,
                    name,
                    category,
                    quantity,
                    location,
                    notes
                };
            }
        } else {
            // Add new item
            const newItem = {
                id: Date.now().toString(),
                code,
                name,
                category,
                quantity,
                location,
                notes
            };
            inventory.push(newItem);
            
            // Record the initial input
            recordTransaction({
                itemId: newItem.id,
                itemCode: newItem.code,
                itemName: newItem.name,
                type: 'input',
                quantity: newItem.quantity,
                fromLocation: '',
                toLocation: newItem.location,
                notes: 'Initial stock entry'
            });
        }
        
        saveData();
        renderInventory();
        renderTransactions();
        updateSummary();
        closeModal();
    }

    // Handle output form submission
    function handleOutputFormSubmit() {
        const itemId = outputItemSelect.value;
        const quantity = parseInt(document.getElementById('output-quantity').value);
        const fromLocation = document.getElementById('output-from-location').value;
        const notes = document.getElementById('output-notes').value.trim();
        
        if (!itemId || !fromLocation) {
            alert('Please select an item and location');
            return;
        }
        
        const item = inventory.find(i => i.id === itemId);
        
        if (!item) {
            alert('Item not found');
            return;
        }
        
        if (item.location !== fromLocation) {
            alert(`This item is not available at ${fromLocation}. Current location: ${item.location}`);
            return;
        }
        
        if (quantity > item.quantity) {
            alert(`Cannot remove more than available quantity (${item.quantity})`);
            return;
        }
        
        // Update inventory
        item.quantity -= quantity;
        
        // Record transaction with fromLocation
        recordTransaction({
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            type: 'output',
            quantity,
            fromLocation: fromLocation,
            toLocation: '',
            notes: notes || 'Item output recorded'
        });
        
        saveData();
        renderInventory();
        renderTransactions();
        updateSummary();
        closeModal();
    }

    // Handle transfer form submission
    function handleTransferFormSubmit() {
        const itemId = transferItemSelect.value;
        const quantity = parseInt(document.getElementById('transfer-quantity').value);
        const fromLocation = document.getElementById('transfer-from').value;
        const toLocation = document.getElementById('transfer-to').value;
        const notes = document.getElementById('transfer-notes').value.trim();
        
        if (!itemId || !fromLocation || !toLocation) {
            alert('Please fill all required fields');
            return;
        }
        
        if (fromLocation === toLocation) {
            alert('Cannot transfer to the same location');
            return;
        }
        
        const item = inventory.find(i => i.id === itemId);
        
        if (!item) {
            alert('Item not found');
            return;
        }
        
        if (item.location !== fromLocation) {
            alert(`Item is not at ${fromLocation}. Current location: ${item.location}`);
            return;
        }
        
        if (quantity > item.quantity) {
            alert(`Not enough stock (Available: ${item.quantity})`);
            return;
        }
        
        // Update source item
        item.quantity -= quantity;
        
        // Find or create item at destination
        let targetItem = inventory.find(i => 
            i.code === item.code && i.location === toLocation
        );
        
        if (!targetItem) {
            targetItem = {
                ...item,
                id: Date.now().toString(),
                quantity: 0,
                location: toLocation,
                notes: ''
            };
            inventory.push(targetItem);
        }
        
        targetItem.quantity += quantity;
        
        // Record transaction
        recordTransaction({
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            type: 'transfer',
            quantity,
            fromLocation,
            toLocation,
            notes: notes || `Transfer to ${toLocation}`
        });
        
        saveData();
        renderInventory();
        renderTransactions();
        updateSummary();
        closeModal();
    }

    // Record a transaction
    function recordTransaction(data) {
        const transaction = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...data
        };
        
        transactions.unshift(transaction);
    }

    // Delete an item
    function deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            inventory = inventory.filter(item => item.id !== itemId);
            
            saveData();
            renderInventory();
            updateSummary();
        }
    }

    // Save data to localStorage
    function saveData() {
        localStorage.setItem('inventory', JSON.stringify(inventory));
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Update summary cards
    function updateSummary() {
        document.getElementById('total-items').textContent = inventory.length;
        document.getElementById('tester-count').textContent = inventory.filter(i => i.category === 'Tester').length;
        document.getElementById('org-count').textContent = inventory.filter(i => i.category === 'Org').length;
        document.getElementById('giftset-count').textContent = inventory.filter(i => i.category === 'Giftset').length;
    }

    // Format date for display
    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // Report generation functions
    function generateStockReport() {
        let html = '<h3>Current Stock Report</h3>';
        html += '<table class="report-table"><thead><tr><th>Item Code</th><th>Name</th><th>Category</th><th>Quantity</th><th>Location</th></tr></thead><tbody>';
        
        inventory.forEach(item => {
            html += `
                <tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${item.location}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        reportResults.innerHTML = html;
    }

    function generateTransactionReport() {
        let html = '<h3>Transaction History</h3>';
        html += '<table class="report-table"><thead><tr><th>Date</th><th>Item Code</th><th>Name</th><th>Type</th><th>Qty</th><th>From</th><th>To</th><th>Notes</th></tr></thead><tbody>';
        
        transactions.forEach(trans => {
            const typeClass = trans.type === 'input' ? 'text-success' : 
                             trans.type === 'output' ? 'text-danger' : 'text-info';
            
            html += `
                <tr>
                    <td>${formatDate(trans.date)}</td>
                    <td>${trans.itemCode}</td>
                    <td>${trans.itemName}</td>
                    <td class="${typeClass}">${trans.type === 'input' ? 'Input' : 
                                             trans.type === 'output' ? 'Output' : 'Transfer'}</td>
                    <td>${trans.quantity}</td>
                    <td>${trans.fromLocation || '-'}</td>
                    <td>${trans.toLocation || '-'}</td>
                    <td>${trans.notes || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        reportResults.innerHTML = html;
    }

    function generateCategoryReport() {
        let html = '<h3>Category Summary Report</h3>';
        
        // Current stock by category
        html += '<h4>Current Inventory</h4>';
        html += '<table class="report-table"><thead><tr><th>Category</th><th>Item Count</th><th>Total Quantity</th></tr></thead><tbody>';
        
        const categories = ['Tester', 'Org', 'Giftset'];
        categories.forEach(cat => {
            const items = inventory.filter(i => i.category === cat);
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            
            html += `
                <tr>
                    <td>${cat}</td>
                    <td>${items.length}</td>
                    <td>${totalQuantity}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        reportResults.innerHTML = html;
    }

    function generateLocationReport() {
        let html = '<h3>Location Stock Report</h3>';
        
        // Current stock by location
        html += '<h4>Current Inventory</h4>';
        html += '<table class="report-table"><thead><tr><th>Location</th><th>Item Count</th><th>Total Quantity</th></tr></thead><tbody>';
        
        const locations = ['House', 'Top Floor', 'Mall'];
        locations.forEach(loc => {
            const items = inventory.filter(i => i.location === loc);
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            
            html += `
                <tr>
                    <td>${loc}</td>
                    <td>${items.length}</td>
                    <td>${totalQuantity}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        
        // Movement report
        html += '<h4>Recent Movements</h4>';
        html += '<table class="report-table"><thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>From</th><th>To</th></tr></thead><tbody>';
        
        // Show last 20 transactions with location info
        transactions.slice(0, 20).forEach(trans => {
            html += `
                <tr>
                    <td>${formatDate(trans.date)}</td>
                    <td>${trans.itemCode} - ${trans.itemName}</td>
                    <td class="${trans.type === 'input' ? 'text-success' : 
                                trans.type === 'output' ? 'text-danger' : 'text-info'}">
                        ${trans.type === 'input' ? 'In' : 
                         trans.type === 'output' ? 'Out' : 'Transfer'}
                    </td>
                    <td>${trans.quantity}</td>
                    <td>${trans.fromLocation || '-'}</td>
                    <td>${trans.toLocation || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        reportResults.innerHTML = html;
    }

    // Export report to CSV
    function exportReportToCSV() {
        const table = reportResults.querySelector('table');
        if (!table) {
            alert('No report data to export');
            return;
        }
        
        let csv = [];
        const rows = table.querySelectorAll('tr');
        
        rows.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('th, td');
            
            cells.forEach(cell => {
                let text = cell.textContent.trim();
                // Handle special characters and commas
                text = text.replace(/"/g, '""');
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    text = `"${text}"`;
                }
                rowData.push(text);
            });
            
            csv.push(rowData.join(','));
        });
        
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});