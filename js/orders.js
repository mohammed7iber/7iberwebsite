// Order Management

// Load orders table
function loadOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const client = clients.find(c => c.id === order.clientId);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${order.id.substr(0, 8)}</td>
            <td>${client ? client.name : 'Unknown'}</td>
            <td>${order.description}</td>
            <td>${order.width}${order.widthUnit} × ${order.height}${order.heightUnit}</td>
            <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
            <td>${new Date(order.dueDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-order" data-id="${order.id}">Edit</button>
                <button class="btn btn-sm btn-success create-quote" data-id="${order.id}">Quote</button>
                <button class="btn btn-sm btn-danger delete-order" data-id="${order.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            editOrder(orderId);
        });
    });
    
    document.querySelectorAll('.create-quote').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            createQuoteFromOrder(orderId);
        });
    });
    
    document.querySelectorAll('.delete-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            deleteOrder(orderId);
        });
    });
    
    // Populate order dropdowns
    populateOrderDropdowns();
}

// Save order
document.getElementById('saveOrderBtn').addEventListener('click', function() {
    const orderForm = document.getElementById('addOrderForm');
    const clientId = document.getElementById('orderClient').value;
    
    if (!clientId) {
        alert('Please select a client');
        return;
    }
    
    const orderId = orderForm.getAttribute('data-id');
    
    const order = {
        id: orderId || generateId(),
        clientId: clientId,
        description: document.getElementById('orderDescription').value,
        width: document.getElementById('printWidth').value,
        widthUnit: document.getElementById('widthUnit').value,
        height: document.getElementById('printHeight').value,
        heightUnit: document.getElementById('heightUnit').value,
        quantity: document.getElementById('printQuantity').value,
        printType: document.getElementById('printType').value,
        material: document.getElementById('printMaterial').value,
        notes: document.getElementById('orderNotes').value,
        dueDate: document.getElementById('dueDate').value,
        status: orderId ? (orders.find(o => o.id === orderId)?.status || 'New') : 'New',
        createdAt: orderId ? (orders.find(o => o.id === orderId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (orderId) {
        // Update existing order
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index] = order;
        }
    } else {
        // Add new order
        orders.push(order);
    }
    
    // Save to local storage
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    // Close modal and refresh table
    const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
    modal.hide();
    
    // Reset form
    orderForm.reset();
    if (orderForm.hasAttribute('data-id')) {
        orderForm.removeAttribute('data-id');
    }
    
    // Refresh table
    loadOrdersTable();
    updateDashboard();
});

// Edit order
function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    document.getElementById('orderClient').value = order.clientId;
    document.getElementById('orderDescription').value = order.description;
    document.getElementById('printWidth').value = order.width;
    document.getElementById('widthUnit').value = order.widthUnit;
    document.getElementById('printHeight').value = order.height;
    document.getElementById('heightUnit').value = order.heightUnit;
    document.getElementById('printQuantity').value = order.quantity;
    document.getElementById('printType').value = order.printType;
    document.getElementById('printMaterial').value = order.material;
    document.getElementById('orderNotes').value = order.notes || '';
    document.getElementById('dueDate').value = order.dueDate;
    
    // Set the order ID on the form for update
    document.getElementById('addOrderForm').setAttribute('data-id', orderId);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addOrderModal'));
    modal.show();
}

// Delete order
function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order? This cannot be undone.')) return;
    
    // Filter out the order
    orders = orders.filter(order => order.id !== orderId);
    
    // Save to local storage
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    // Refresh table
    loadOrdersTable();
    updateDashboard();
}

// Create quote from order
function createQuoteFromOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Show quote modal
    const modal = new bootstrap.Modal(document.getElementById('createQuoteModal'));
    modal.show();
    
    // Set client
    document.getElementById('quoteClient').value = order.clientId;
    
    // Calculate area
    const width = parseFloat(order.width);
    const height = parseFloat(order.height);
    let area = width * height;
    let unit = 'sq ' + order.widthUnit;
    
    // Clear existing items
    document.querySelectorAll('#quoteItems .quote-item-row').forEach((row, index) => {
        if (index > 0) row.remove();
    });
    
    // Add item
    const itemRow = document.querySelector('#quoteItems .quote-item-row');
    const itemDescription = `${order.printType} (${order.width}${order.widthUnit} × ${order.height}${order.heightUnit}) - ${order.material}`;
    itemRow.querySelector('.item-description').value = itemDescription;
    itemRow.querySelector('.item-quantity').value = order.quantity;
    
    // Set a default price
    const basePrice = 10; // Default price per sq unit
    const price = basePrice; // Simplified pricing
    
    itemRow.querySelector('.item-price').value = price;
    itemRow.querySelector('.item-total').value = price * order.quantity;
    
    // Calculate totals
    calculateQuoteTotals();
    
    // Set valid until date to 30 days from now
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    document.getElementById('quoteValidUntil').valueAsDate = validUntil;
    
    // Create quote
    document.getElementById('createQuoteForm').setAttribute('data-order-id', orderId);
}

// Populate order dropdowns
function populateOrderDropdowns() {
    const orderDropdowns = [
        document.getElementById('quoteOrder')
    ];
    
    orderDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        // Save selected value if any
        const selectedValue = dropdown.value;
        
        // Clear options except the first one
        dropdown.innerHTML = '<option value="">Select Order or Leave Empty for New Quote</option>';
        
        // Add options for each order
        orders.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            const option = document.createElement('option');
            option.value = order.id;
            option.textContent = `${order.id.substr(0, 8)} - ${client ? client.name : 'Unknown'} - ${order.description}`;
            dropdown.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (selectedValue && orders.some(order => order.id === selectedValue)) {
            dropdown.value = selectedValue;
        }
    });
}

// Add material price lookup when creating orders
document.addEventListener('DOMContentLoaded', function() {
    // When client and material are selected, look up pricing
    const orderClientSelect = document.getElementById('orderClient');
    const materialSelect = document.getElementById('printMaterial');
    
    if (orderClientSelect && materialSelect) {
        materialSelect.addEventListener('change', function() {
            const clientId = orderClientSelect.value;
            const material = this.value;
            
            if (clientId && material && typeof getClientPrice === 'function') {
                const pricing = getClientPrice(clientId, material);
                if (pricing) {
                    // Display pricing information in a new field or alert
                    alert(`Client pricing found: ${formatCurrency(pricing.unitPrice)} ${pricing.pricingMethod}`);
                    
                    // You could also update a visible field with this information
                    // For example:
                    // document.getElementById('materialPriceInfo').textContent = 
                    //    `Price: ${formatCurrency(pricing.unitPrice)} ${pricing.pricingMethod}`;
                }
            }
        });
    }
});