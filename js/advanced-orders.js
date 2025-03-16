// Create a new file: js/advanced-orders.js

// Initialize advanced order functionality
function initAdvancedOrders() {
    // Set default order date to today
    const orderDateField = document.getElementById('advOrderDate');
    if (orderDateField) {
        orderDateField.valueAsDate = new Date();
    }
    
    // Client selection change handler
    const clientSelect = document.getElementById('advOrderClient');
    if (clientSelect) {
        // Populate client dropdown
        populateClientDropdown(clientSelect);
        
        // Handle client selection change
        clientSelect.addEventListener('change', function() {
            const clientId = this.value;
            if (clientId) {
                loadClientPrintLocations(clientId);
                document.getElementById('selectClientPrompt').style.display = 'none';
                document.getElementById('printLocationsTable').style.display = 'block';
            } else {
                document.getElementById('selectClientPrompt').style.display = 'block';
                document.getElementById('printLocationsTable').style.display = 'none';
            }
        });
    }
    
    // Save advanced order button
    const saveOrderBtn = document.getElementById('saveAdvancedOrderBtn');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', function() {
            saveAdvancedOrder();
        });
    }
    
    // Create quote button
    const createQuoteBtn = document.getElementById('createQuoteFromSelectionBtn');
    if (createQuoteBtn) {
        createQuoteBtn.addEventListener('click', function() {
            createQuoteFromSelection();
        });
    }
}

// Load client print locations
function loadClientPrintLocations(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.branches) return;
    
    const container = document.getElementById('printLocationsTable');
    container.innerHTML = '';
    
    // Create accordion for branches
    client.branches.forEach((branch, branchIndex) => {
        // Skip branches with no print locations
        if (!branch.printLocations || branch.printLocations.length === 0) return;
        
        const branchDiv = document.createElement('div');
        branchDiv.className = 'card mb-3';
        
        // Branch header
        branchDiv.innerHTML = `
            <div class="card-header" id="branch-heading-${branch.id}">
                <h5 class="mb-0">
                    <button class="btn btn-link w-100 text-start" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#branch-collapse-${branch.id}" 
                            aria-expanded="${branchIndex === 0 ? 'true' : 'false'}" 
                            aria-controls="branch-collapse-${branch.id}">
                        ${branch.name} (${branch.location || 'No location'})
                    </button>
                </h5>
            </div>
            
            <div id="branch-collapse-${branch.id}" 
                 class="collapse ${branchIndex === 0 ? 'show' : ''}" 
                 aria-labelledby="branch-heading-${branch.id}">
                <div class="card-body p-0">
                    <table class="table table-striped mb-0">
                        <thead>
                            <tr>
                                <th>
                                    <div class="form-check">
                                        <input class="form-check-input branch-select-all" 
                                               type="checkbox" 
                                               data-branch-id="${branch.id}" 
                                               id="select-all-${branch.id}">
                                        <label class="form-check-label" for="select-all-${branch.id}">
                                            Select All
                                        </label>
                                    </div>
                                </th>
                                <th>Location</th>
                                <th>Material</th>
                                <th>Dimensions (Inner)</th>
                                <th>Dimensions (Outer)</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                            </tr>
                        </thead>
                        <tbody id="branch-locations-${branch.id}">
                            <!-- Print locations will be added here -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        container.appendChild(branchDiv);
        
        // Add print locations for this branch
        const locationsContainer = document.getElementById(`branch-locations-${branch.id}`);
        
        branch.printLocations.forEach(location => {
            const locationRow = document.createElement('tr');
            locationRow.className = 'print-location-row';
            locationRow.setAttribute('data-location-id', location.id);
            locationRow.setAttribute('data-branch-id', branch.id);
            
            // Get pricing information
            const pricing = getClientPrice(clientId, location.material);
            const unitPrice = pricing ? pricing.unitPrice : 0;
            const pricingMethod = pricing ? pricing.pricingMethod : 'N/A';
            
            // Format dimensions
            const innerDimensions = `${location.dimensions.innerWidth || 0} × ${location.dimensions.innerHeight || 0} × ${location.dimensions.innerDepth || 0} ${location.dimensions.widthUnit || 'in'}`;
            const outerDimensions = `${location.dimensions.outerWidth || 0} × ${location.dimensions.outerHeight || 0} × ${location.dimensions.outerDepth || 0} ${location.dimensions.widthUnit || 'in'}`;
            
            locationRow.innerHTML = `
                <td>
                    <div class="form-check">
                        <input class="form-check-input location-checkbox" 
                               type="checkbox" 
                               data-location-id="${location.id}" 
                               data-branch-id="${branch.id}" 
                               id="location-${location.id}">
                    </div>
                </td>
                <td>${location.name}</td>
                <td>${location.material || 'Not specified'}</td>
                <td>${innerDimensions}</td>
                <td>${outerDimensions}</td>
                <td>
                    <input type="number" 
                           class="form-control form-control-sm location-quantity" 
                           min="1" 
                           value="1" 
                           data-location-id="${location.id}" 
                           data-branch-id="${branch.id}"
                           disabled>
                </td>
                <td>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">JOD</span>
                        <input type="number" 
                               class="form-control location-price" 
                               value="${unitPrice}" 
                               data-pricing-method="${pricingMethod}"
                               data-location-id="${location.id}" 
                               data-branch-id="${branch.id}"
                               readonly>
                    </div>
                    <small class="text-muted">${pricingMethod}</small>
                </td>
            `;
            
            locationsContainer.appendChild(locationRow);
        });
        
        // Add event listener for "Select All" checkbox
        const selectAllCheckbox = document.querySelector(`#select-all-${branch.id}`);
        selectAllCheckbox.addEventListener('change', function() {
            const branchId = this.getAttribute('data-branch-id');
            const isChecked = this.checked;
            
            // Select/deselect all location checkboxes in this branch
            document.querySelectorAll(`#branch-locations-${branchId} .location-checkbox`).forEach(checkbox => {
                checkbox.checked = isChecked;
                
                // Enable/disable quantity input
                const locationId = checkbox.getAttribute('data-location-id');
                const quantityInput = document.querySelector(`.location-quantity[data-location-id="${locationId}"]`);
                if (quantityInput) {
                    quantityInput.disabled = !isChecked;
                }
            });
            
            // Update order summary
            updateOrderSummary();
        });
    });
    
    // Add event listeners to all location checkboxes
    document.querySelectorAll('.location-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const locationId = this.getAttribute('data-location-id');
            const isChecked = this.checked;
            
            // Enable/disable quantity input
            const quantityInput = document.querySelector(`.location-quantity[data-location-id="${locationId}"]`);
            if (quantityInput) {
                quantityInput.disabled = !isChecked;
            }
            
            // Update order summary
            updateOrderSummary();
        });
    });
    
    // Add event listeners to all quantity inputs
    document.querySelectorAll('.location-quantity').forEach(input => {
        input.addEventListener('input', function() {
            updateOrderSummary();
        });
    });
}

// Update order summary based on selected locations
function updateOrderSummary() {
    const selectedLocations = getSelectedLocations();
    const summaryTableBody = document.getElementById('orderSummaryTableBody');
    const summaryContainer = document.getElementById('orderSummaryContainer');
    
    if (selectedLocations.length === 0) {
        summaryContainer.style.display = 'none';
        return;
    }
    
    summaryContainer.style.display = 'block';
    summaryTableBody.innerHTML = '';
    
    let subtotal = 0;
    
    selectedLocations.forEach(location => {
        const row = document.createElement('tr');
        
        // Calculate total for this location
        const unitPrice = parseFloat(location.price) || 0;
        const quantity = parseInt(location.quantity) || 1;
        const total = unitPrice * quantity;
        
        subtotal += total;
        
        row.innerHTML = `
            <td>${location.branchName} - ${location.name}</td>
            <td>${location.material || 'Not specified'}</td>
            <td>${location.dimensions}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(unitPrice)} <small class="text-muted">${location.pricingMethod}</small></td>
            <td>${formatCurrency(total)}</td>
        `;
        
        summaryTableBody.appendChild(row);
    });
    
    // Update totals
    const taxRate = 0.16; // 16% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    document.getElementById('orderSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('orderTax').textContent = formatCurrency(tax);
    document.getElementById('orderTotal').textContent = formatCurrency(total);
}

// Get selected locations with their details
function getSelectedLocations() {
    const selectedLocations = [];
    const clientId = document.getElementById('advOrderClient').value;
    
    if (!clientId) return selectedLocations;
    
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.branches) return selectedLocations;
    
    // Find all checked location checkboxes
    document.querySelectorAll('.location-checkbox:checked').forEach(checkbox => {
        const locationId = checkbox.getAttribute('data-location-id');
        const branchId = checkbox.getAttribute('data-branch-id');
        
        // Find the branch and location
        const branch = client.branches.find(b => b.id === branchId);
        if (!branch || !branch.printLocations) return;
        
        const location = branch.printLocations.find(loc => loc.id === locationId);
        if (!location) return;
        
        // Get quantity and price
        const quantityInput = document.querySelector(`.location-quantity[data-location-id="${locationId}"]`);
        const priceInput = document.querySelector(`.location-price[data-location-id="${locationId}"]`);
        
        if (!quantityInput || !priceInput) return;
        
        const quantity = parseInt(quantityInput.value) || 1;
        const price = parseFloat(priceInput.value) || 0;
        const pricingMethod = priceInput.getAttribute('data-pricing-method') || 'N/A';
        
        // Format dimensions
        const dimensions = `${location.dimensions.innerWidth || 0} × ${location.dimensions.innerHeight || 0} × ${location.dimensions.innerDepth || 0} ${location.dimensions.widthUnit || 'in'}`;
        
        selectedLocations.push({
            id: locationId,
            branchId: branchId,
            branchName: branch.name,
            name: location.name,
            material: location.material || 'Not specified',
            dimensions: dimensions,
            quantity: quantity,
            price: price,
            pricingMethod: pricingMethod,
            location: location  // Include the full location object for reference
        });
    });
    
    return selectedLocations;
}

// Save the advanced order
function saveAdvancedOrder() {
    const orderName = document.getElementById('advOrderName').value;
    const clientId = document.getElementById('advOrderClient').value;
    const orderDate = document.getElementById('advOrderDate').value;
    const installDate = document.getElementById('advInstallDate').value;
    const orderNotes = document.getElementById('advOrderNotes').value;
    
    // Validate required fields
    if (!orderName || !clientId || !orderDate) {
        alert('Please fill in all required fields: Order Name, Client, and Order Date.');
        return;
    }
    
    // Get selected locations
    const selectedLocations = getSelectedLocations();
    if (selectedLocations.length === 0) {
        alert('Please select at least one print location for this order.');
        return;
    }
    
    // Calculate totals
    let subtotal = 0;
    selectedLocations.forEach(location => {
        subtotal += location.price * location.quantity;
    });
    
    const taxRate = 0.16; // 16% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // Create the order object
    const newOrder = {
        id: generateId(),
        name: orderName,
        clientId: clientId,
        orderDate: orderDate,
        installDate: installDate || null,
        notes: orderNotes,
        locations: selectedLocations,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'New',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add to orders array
    orders.push(newOrder);
    
    // Save to localStorage
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    // Show success message and close modal
    alert('Order has been created successfully!');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('newAdvancedOrderModal'));
    if (modal) {
        modal.hide();
    }
    
    // Refresh orders table
    loadOrdersTable();
    updateDashboard();
}

// Create a quote from the selected locations
function createQuoteFromSelection() {
    const clientId = document.getElementById('advOrderClient').value;
    const orderName = document.getElementById('advOrderName').value || 'New Order';
    
    // Validate required fields
    if (!clientId) {
        alert('Please select a client before creating a quote.');
        return;
    }
    
    // Get selected locations
    const selectedLocations = getSelectedLocations();
    if (selectedLocations.length === 0) {
        alert('Please select at least one print location for this quote.');
        return;
    }
    
    // First save the order
    saveAdvancedOrder();
    
    // Create quote items from selected locations
    const items = selectedLocations.map(location => {
        return {
            description: `${location.branchName} - ${location.name} (${location.material})`,
            quantity: location.quantity,
            price: location.price,
            total: location.price * location.quantity
        };
    });
    
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.total;
    });
    
    const taxRate = 16; // 16% tax
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    // Create the quote object
    const newQuote = {
        id: generateId(),
        clientId: clientId,
        orderId: null, // We could link this to the order we just created
        items: items,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        notes: `Quote created from order: ${orderName}`,
        validUntil: (() => {
            const date = new Date();
            date.setDate(date.getDate() + 30); // Valid for 30 days
            return date.toISOString().split('T')[0];
        })(),
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Add to quotes array
    quotes.push(newQuote);
    
    // Save to localStorage
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    
    // Show success message
    alert('Quote has been created successfully!');
    
    // Open the quote for viewing/editing
    viewQuote(newQuote.id);
    
    // Close the advanced order modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newAdvancedOrderModal'));
    if (modal) {
        modal.hide();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add button to open advanced order modal
    const ordersSection = document.getElementById('orders');
    if (ordersSection) {
        const header = ordersSection.querySelector('h2');
        if (header) {
            // Get the existing button if any
            const existingBtn = ordersSection.querySelector('.btn-primary');
            if (existingBtn) {
                // Create advanced order button
                const advOrderBtn = document.createElement('button');
                advOrderBtn.className = 'btn btn-success mb-3 ms-2';
                advOrderBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Advanced Order';
                advOrderBtn.addEventListener('click', function() {
                    // Reset form
                    document.getElementById('advancedOrderForm').reset();
                    document.getElementById('printLocationsTable').innerHTML = '';
                    document.getElementById('selectClientPrompt').style.display = 'block';
                    document.getElementById('printLocationsTable').style.display = 'none';
                    document.getElementById('orderSummaryContainer').style.display = 'none';
                    
                    // Set default date
                    document.getElementById('advOrderDate').valueAsDate = new Date();
                    
                    // Show modal
                    const modal = new bootstrap.Modal(document.getElementById('newAdvancedOrderModal'));
                    modal.show();
                });
                
                // Add the button next to the existing one
                existingBtn.parentNode.insertBefore(advOrderBtn, existingBtn.nextSibling);
            }
        }
    }
    
    // Initialize advanced orders
    initAdvancedOrders();
});