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

// When a client is selected, populate material options from print locations
document.addEventListener('DOMContentLoaded', function() {
    const orderClientSelect = document.getElementById('orderClient');
    const materialSelect = document.getElementById('printMaterial');
    
    if (orderClientSelect && materialSelect) {
        orderClientSelect.addEventListener('change', function() {
            const clientId = this.value;
            if (!clientId) return;
            
            // Find the client
            const client = clients.find(c => c.id === clientId);
            if (!client) return;
            
            // Collect all unique materials from all print locations across all branches
            const uniqueMaterials = new Set();
            
            if (client.branches) {
                client.branches.forEach(branch => {
                    if (branch.printLocations) {
                        branch.printLocations.forEach(location => {
                            if (location.material) {
                                uniqueMaterials.add(location.material);
                            }
                        });
                    }
                });
            }
            
            // Save current selection if possible
            const currentSelection = materialSelect.value;
            
            // Clear material options except for the first empty option
            while (materialSelect.options.length > 1) {
                materialSelect.options.remove(1);
            }
            
            // Add collected materials as options
            const sortedMaterials = Array.from(uniqueMaterials).sort();
            sortedMaterials.forEach(material => {
                const option = document.createElement('option');
                option.value = material;
                option.textContent = material;
                materialSelect.appendChild(option);
            });
            
            // Add "Other" option at the end
            const otherOption = document.createElement('option');
            otherOption.value = "Other";
            otherOption.textContent = "Other";
            materialSelect.appendChild(otherOption);
            
            // Restore selection if it exists in the new options
            if (currentSelection && Array.from(materialSelect.options).some(opt => opt.value === currentSelection)) {
                materialSelect.value = currentSelection;
            }
        });
        
        // Add event listener to material selection to filter print locations
        materialSelect.addEventListener('change', function() {
            const clientId = orderClientSelect.value;
            const material = this.value;
            
            // We can optionally add code here to suggest dimensions based on available print locations
            // that use the selected material
            
            // For example, we could add a new field to display compatible print locations:
            const infoDiv = document.getElementById('compatibleLocationsInfo') || document.createElement('div');
            if (!document.getElementById('compatibleLocationsInfo')) {
                infoDiv.id = 'compatibleLocationsInfo';
                infoDiv.className = 'alert alert-info mt-3';
                // Insert after the material select
                materialSelect.parentNode.parentNode.after(infoDiv);
            }
            
            if (clientId && material && material !== 'Other') {
                // Find the client
                const client = clients.find(c => c.id === clientId);
                if (!client) return;
                
                // Find compatible print locations
                const compatibleLocations = [];
                
                if (client.branches) {
                    client.branches.forEach(branch => {
                        if (branch.printLocations) {
                            branch.printLocations.forEach(location => {
                                if (location.material === material) {
                                    compatibleLocations.push({
                                        branch: branch.name,
                                        location: location.name,
                                        dimensions: {
                                            inner: `${location.dimensions.innerWidth || 0} × ${location.dimensions.innerHeight || 0} × ${location.dimensions.innerDepth || 0} ${location.dimensions.widthUnit || 'in'}`,
                                            outer: `${location.dimensions.outerWidth || 0} × ${location.dimensions.outerHeight || 0} × ${location.dimensions.outerDepth || 0} ${location.dimensions.widthUnit || 'in'}`
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
                
                // Display compatible locations
                if (compatibleLocations.length > 0) {
                    let locationsHtml = '<p><strong>Compatible print locations:</strong></p><ul>';
                    compatibleLocations.forEach(loc => {
                        locationsHtml += `
                            <li>
                                <strong>${loc.branch}</strong>: ${loc.location}<br>
                                <small>Inner: ${loc.dimensions.inner} | Outer: ${loc.dimensions.outer}</small>
                            </li>
                        `;
                    });
                    locationsHtml += '</ul>';
                    
                    infoDiv.innerHTML = locationsHtml;
                    infoDiv.style.display = 'block';
                } else {
                    infoDiv.innerHTML = `<p>No print locations found that use ${material}. You may need to create a new print location.</p>`;
                    infoDiv.style.display = 'block';
                }
            } else {
                infoDiv.style.display = 'none';
            }
        });
    }
});

// Add to orders.js to display advanced orders in the orders table

// Update loadOrdersTable to handle advanced orders
function loadOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const tr = document.createElement('tr');
        const client = clients.find(c => c.id === order.clientId);
        
        // Check if this is an advanced order (has locations property)
        const isAdvancedOrder = order.locations && Array.isArray(order.locations);
        
        if (isAdvancedOrder) {
            // This is an advanced order
            const locationCount = order.locations.length;
            const firstLocation = order.locations[0];
            
            tr.innerHTML = `
                <td>${order.id.substr(0, 8)}</td>
                <td>${client ? client.name : 'Unknown'}</td>
                <td>${order.name} (${locationCount} locations)</td>
                <td>Multiple locations</td>
                <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
                <td>${order.installDate ? new Date(order.installDate).toLocaleDateString() : 'Not set'}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-adv-order" data-id="${order.id}">View</button>
                    <button class="btn btn-sm btn-success create-quote" data-id="${order.id}">Quote</button>
                    <button class="btn btn-sm btn-danger delete-order" data-id="${order.id}">Delete</button>
                </td>
            `;
        } else {
            // This is a regular order
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
        }
        
        tableBody.appendChild(tr);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            editOrder(orderId);
        });
    });
    
    document.querySelectorAll('.view-adv-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            viewAdvancedOrder(orderId);
        });
    });
    
    document.querySelectorAll('.create-quote').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            const order = orders.find(o => o.id === orderId);
            
            if (order && order.locations) {
                // This is an advanced order
                createQuoteFromAdvancedOrder(orderId);
            } else {
                // This is a regular order
                createQuoteFromOrder(orderId);
            }
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

// View advanced order
function viewAdvancedOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.locations) return;
    
    const client = clients.find(c => c.id === order.clientId);
    
    // Create a modal to display the order details
    const modalContent = `
        <div class="modal" tabindex="-1" id="viewAdvOrderModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Order Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5>${order.name}</h5>
                                <p>
                                    <strong>Client:</strong> ${client ? client.name : 'Unknown'}<br>
                                    <strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}<br>
                                    <strong>Installation Date:</strong> ${order.installDate ? new Date(order.installDate).toLocaleDateString() : 'Not set'}<br>
                                    <strong>
                                    <strong>Status:</strong> <span class="badge bg-${getStatusColor(order.status)}">${order.status}</span><br>
                                    <strong>Total:</strong> ${formatCurrency(order.total)}
                                </p>
                                ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
                            </div>
                            <div class="col-md-6 text-end">
                                <button class="btn btn-sm btn-success create-quote-from-adv" data-id="${order.id}">Create Quote</button>
                            </div>
                        </div>
                        
                        <h5 class="border-top pt-3">Ordered Locations</h5>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Location</th>
                                        <th>Material</th>
                                        <th>Dimensions</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${order.locations.map(location => `
                                        <tr>
                                            <td>${location.branchName} - ${location.name}</td>
                                            <td>${location.material || 'Not specified'}</td>
                                            <td>${location.dimensions}</td>
                                            <td>${location.quantity}</td>
                                            <td>${formatCurrency(location.price)} <small class="text-muted">${location.pricingMethod}</small></td>
                                            <td>${formatCurrency(location.price * location.quantity)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="5" class="text-end"><strong>Subtotal:</strong></td>
                                        <td>${formatCurrency(order.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="5" class="text-end"><strong>Tax (16%):</strong></td>
                                        <td>${formatCurrency(order.tax)}</td>
                                    </tr>
                                    <tr>
                                        <td colspan="5" class="text-end"><strong>Total:</strong></td>
                                        <td>${formatCurrency(order.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the page
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalContent;
    document.body.appendChild(modalDiv);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewAdvOrderModal'));
    modal.show();
    
    // Add event listener to create quote button
    document.querySelector('.create-quote-from-adv').addEventListener('click', function() {
        modal.hide();
        // Remove the modal from DOM after hidden
        document.getElementById('viewAdvOrderModal').addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modalDiv);
        });
        // Create quote from this order
        createQuoteFromAdvancedOrder(order.id);
    });
    
    // Remove the modal from DOM when closed
    document.getElementById('viewAdvOrderModal').addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalDiv);
    });
}

// Create quote from advanced order
function createQuoteFromAdvancedOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.locations) return;
    
    // Create quote items from order locations
    const items = order.locations.map(location => {
        return {
            description: `${location.branchName} - ${location.name} (${location.material})`,
            quantity: location.quantity,
            price: location.price,
            total: location.price * location.quantity
        };
    });
    
    // Create the quote object
    const newQuote = {
        id: generateId(),
        clientId: order.clientId,
        orderId: orderId,
        items: items,
        subtotal: order.subtotal,
        taxRate: 16, // 16% tax
        taxAmount: order.tax,
        total: order.total,
        notes: `Quote created from order: ${order.name}`,
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
    
    // Update the order to link it to this quote
    order.quoteId = newQuote.id;
    order.updatedAt = new Date().toISOString();
    
    // Save updated orders
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    // Show success message
    alert('Quote has been created successfully!');
    
    // Open the quote for viewing/editing
    viewQuote(newQuote.id);
}


// Add this code to your orders.js file or to a DOMContentLoaded event handler

document.addEventListener('DOMContentLoaded', function() {
    // Add button to open advanced order modal
    const ordersSection = document.getElementById('orders');
    if (ordersSection) {
        const existingBtn = ordersSection.querySelector('button.btn-primary');
        if (existingBtn) {
            // Create advanced order button
            const advOrderBtn = document.createElement('button');
            advOrderBtn.className = 'btn btn-success mb-3 ms-2';
            advOrderBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Advanced Order';
            advOrderBtn.addEventListener('click', function() {
                // Reset form
                const form = document.getElementById('advancedOrderForm');
                if (form) form.reset();
                
                const locationsTable = document.getElementById('printLocationsTable');
                if (locationsTable) locationsTable.innerHTML = '';
                
                const clientPrompt = document.getElementById('selectClientPrompt');
                if (clientPrompt) clientPrompt.style.display = 'block';
                
                if (locationsTable) locationsTable.style.display = 'none';
                
                const summaryContainer = document.getElementById('orderSummaryContainer');
                if (summaryContainer) summaryContainer.style.display = 'none';
                
                // Set default date
                const orderDateField = document.getElementById('advOrderDate');
                if (orderDateField) orderDateField.valueAsDate = new Date();
                
                // Show modal
                const modal = new bootstrap.Modal(document.getElementById('newAdvancedOrderModal'));
                modal.show();
            });
            
            // Insert after the existing button
            existingBtn.parentNode.insertBefore(advOrderBtn, existingBtn.nextSibling);
        }
    }
});