// Quote Management

// Load quotes table
function loadQuotesTable() {
    const tableBody = document.getElementById('quotesTableBody');
    tableBody.innerHTML = '';
    
    quotes.forEach(quote => {
        const client = clients.find(c => c.id === quote.clientId);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${quote.id.substr(0, 8)}</td>
            <td>${client ? client.name : 'Unknown'}</td>
            <td>${new Date(quote.createdAt).toLocaleDateString()}</td>
            <td>${formatCurrency(quote.total)}</td>
            <td><span class="badge bg-${getStatusColor(quote.status)}">${quote.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary edit-quote" data-id="${quote.id}">Edit</button>
                <button class="btn btn-sm btn-info view-quote" data-id="${quote.id}">View</button>
                <button class="btn btn-sm btn-success create-invoice" data-id="${quote.id}">Invoice</button>
                <button class="btn btn-sm btn-danger delete-quote" data-id="${quote.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-quote').forEach(btn => {
        btn.addEventListener('click', function() {
            const quoteId = this.getAttribute('data-id');
            editQuote(quoteId);
        });
    });
    
    document.querySelectorAll('.view-quote').forEach(btn => {
        btn.addEventListener('click', function() {
            const quoteId = this.getAttribute('data-id');
            viewQuote(quoteId);
        });
    });
    
    document.querySelectorAll('.create-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const quoteId = this.getAttribute('data-id');
            createInvoiceFromQuote(quoteId);
        });
    });
    
    document.querySelectorAll('.delete-quote').forEach(btn => {
        btn.addEventListener('click', function() {
            const quoteId = this.getAttribute('data-id');
            deleteQuote(quoteId);
        });
    });
    
    // Populate quote dropdowns
    populateQuoteDropdowns();
}

// Calculate quote totals
function calculateQuoteTotals() {
    const quoteItemRows = document.querySelectorAll('#quoteItems .quote-item-row');
    let subtotal = 0;
    
    quoteItemRows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        
        row.querySelector('.item-total').value = total.toFixed(2);
        subtotal += total;
    });
    
    document.getElementById('quoteSubtotal').value = subtotal.toFixed(2);
    
    const taxRate = parseFloat(document.getElementById('quoteTaxRate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    document.getElementById('quoteTaxAmount').value = taxAmount.toFixed(2);
    
    const total = subtotal + taxAmount;
    document.getElementById('quoteTotal').value = total.toFixed(2);
}
// Add quote item
document.getElementById('addQuoteItemBtn').addEventListener('click', function() {
    const quoteItemsContainer = document.getElementById('quoteItems');
    const newItemRow = document.createElement('div');
    newItemRow.className = 'row mb-2 quote-item-row';
    newItemRow.innerHTML = `
        <div class="col-md-4">
            <input type="text" class="form-control item-description" placeholder="Item Description" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control item-quantity" placeholder="Qty" min="1" value="1" required>
        </div>
        <div class="col-md-2">
            <input type="number" step="0.01" class="form-control item-price" placeholder="Unit Price" required>
        </div>
        <div class="col-md-3">
            <input type="number" step="0.01" class="form-control item-total" placeholder="Total" readonly>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-danger remove-item">×</button>
        </div>
    `;
    quoteItemsContainer.appendChild(newItemRow);
    
    // Add event listeners to the new item row
    newItemRow.querySelector('.item-quantity').addEventListener('input', calculateQuoteTotals);
    newItemRow.querySelector('.item-price').addEventListener('input', calculateQuoteTotals);
    newItemRow.querySelector('.remove-item').addEventListener('click', function() {
        newItemRow.remove();
        calculateQuoteTotals();
    });
});

// Initialize quote calculations
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to quote calculation fields
    document.getElementById('quoteTaxRate').addEventListener('input', calculateQuoteTotals);
    
    // Add event listeners to existing quote items
    document.querySelectorAll('#quoteItems .quote-item-row').forEach(row => {
        row.querySelector('.item-quantity').addEventListener('input', calculateQuoteTotals);
        row.querySelector('.item-price').addEventListener('input', calculateQuoteTotals);
        row.querySelector('.remove-item').addEventListener('click', function() {
            row.remove();
            calculateQuoteTotals();
        });
    });
});
// Save quote
document.getElementById('saveQuoteBtn').addEventListener('click', function() {
    const quoteForm = document.getElementById('createQuoteForm');
    const clientId = document.getElementById('quoteClient').value;
    
    if (!clientId) {
        alert('Please select a client');
        return;
    }
    
    const quoteId = quoteForm.getAttribute('data-id');
    const orderId = quoteForm.getAttribute('data-order-id');
    
    // Get items
    const items = [];
    document.querySelectorAll('#quoteItems .quote-item-row').forEach(row => {
        items.push({
            description: row.querySelector('.item-description').value,
            quantity: parseFloat(row.querySelector('.item-quantity').value) || 0,
            price: parseFloat(row.querySelector('.item-price').value) || 0,
            total: parseFloat(row.querySelector('.item-total').value) || 0
        });
    });
    
    const subtotal = parseFloat(document.getElementById('quoteSubtotal').value) || 0;
    const taxRate = parseFloat(document.getElementById('quoteTaxRate').value) || 0;
    const taxAmount = parseFloat(document.getElementById('quoteTaxAmount').value) || 0;
    const total = parseFloat(document.getElementById('quoteTotal').value) || 0;
    
    const quote = {
        id: quoteId || generateId(),
        clientId: clientId,
        orderId: orderId || null,
        items: items,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        notes: document.getElementById('quoteNotes').value,
        validUntil: document.getElementById('quoteValidUntil').value,
        status: quoteId ? (quotes.find(q => q.id === quoteId)?.status || 'Pending') : 'Pending',
        createdAt: quoteId ? (quotes.find(q => q.id === quoteId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (quoteId) {
        // Update existing quote
        const index = quotes.findIndex(q => q.id === quoteId);
        if (index !== -1) {
            quotes[index] = quote;
        }
    } else {
        // Add new quote
        quotes.push(quote);
    }
    
    // Save to local storage
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    
    // Close modal and refresh table
    const modal = bootstrap.Modal.getInstance(document.getElementById('createQuoteModal'));
    modal.hide();
    
    // Reset form
    quoteForm.reset();
    if (quoteForm.hasAttribute('data-id')) {
        quoteForm.removeAttribute('data-id');
    }
    if (quoteForm.hasAttribute('data-order-id')) {
        quoteForm.removeAttribute('data-order-id');
    }
    
    // Refresh table
    loadQuotesTable();
    updateDashboard();
});
// Edit quote
function editQuote(quoteId) {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    document.getElementById('quoteClient').value = quote.clientId;
    document.getElementById('quoteNotes').value = quote.notes || '';
    document.getElementById('quoteTaxRate').value = quote.taxRate || 0;
    
    if (quote.validUntil) {
        document.getElementById('quoteValidUntil').value = quote.validUntil;
    }
    
    // Clear existing items except the first one
    document.querySelectorAll('#quoteItems .quote-item-row').forEach((row, index) => {
        if (index > 0) row.remove();
    });
    
    // Populate items
    if (quote.items && quote.items.length > 0) {
        const firstItemRow = document.querySelector('#quoteItems .quote-item-row');
        
        // Set first item
        firstItemRow.querySelector('.item-description').value = quote.items[0].description;
        firstItemRow.querySelector('.item-quantity').value = quote.items[0].quantity;
        firstItemRow.querySelector('.item-price').value = quote.items[0].price;
        firstItemRow.querySelector('.item-total').value = quote.items[0].total;
        
        // Add additional items
        for (let i = 1; i < quote.items.length; i++) {
            const item = quote.items[i];
            const itemRow = document.createElement('div');
            itemRow.className = 'row mb-2 quote-item-row';
            itemRow.innerHTML = `
                <div class="col-md-4">
                    <input type="text" class="form-control item-description" placeholder="Item Description" value="${item.description}" required>
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control item-quantity" placeholder="Qty" min="1" value="${item.quantity}" required>
                </div>
                <div class="col-md-2">
                    <input type="number" step="0.01" class="form-control item-price" placeholder="Unit Price" value="${item.price}" required>
                </div>
                <div class="col-md-3">
                    <input type="number" step="0.01" class="form-control item-total" placeholder="Total" value="${item.total}" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger remove-item">×</button>
                </div>
            `;
            document.getElementById('quoteItems').appendChild(itemRow);
            
            // Add event listeners to the new item row
            itemRow.querySelector('.item-quantity').addEventListener('input', calculateQuoteTotals);
            itemRow.querySelector('.item-price').addEventListener('input', calculateQuoteTotals);
            itemRow.querySelector('.remove-item').addEventListener('click', function() {
                itemRow.remove();
                calculateQuoteTotals();
            });
        }
    }
    
    // Calculate totals
    calculateQuoteTotals();
    
    // Set the quote ID on the form for update
    document.getElementById('createQuoteForm').setAttribute('data-id', quoteId);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('createQuoteModal'));
    modal.show();
}

// View quote
function viewQuote(quoteId) {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    const client = clients.find(c => c.id === quote.clientId);
    
    // Create a preview of the quote with enhanced information
    const previewContent = document.getElementById('quotePreviewContent');
    
    // Format date for display
    const formattedDate = new Date(quote.createdAt).toLocaleDateString();
    const validUntilDate = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A';
    
    previewContent.innerHTML = `
        <div class="quote-preview">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h4>${settings.businessName || 'My Print Shop'}</h4>
                    <p>${settings.businessAddress || ''}<br>
                    Phone: ${settings.businessPhone || ''}<br>
                    Email: ${settings.businessEmail || ''}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h2>QUOTE</h2>
                    <p>Quote #: ${quote.id.substr(0, 8)}<br>
                    Date: ${formattedDate}<br>
                    Valid Until: ${validUntilDate}</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Client</h5>
                    <p>${client ? client.name : 'Unknown'}<br>
                    ${client ? (client.contactPerson || '') : ''}<br>
                    ${client ? (client.location || '') : ''}<br>
                    ${client ? (client.phone || '') : ''}<br>
                    ${client ? (client.email || '') : ''}</p>
                </div>
                <div class="col-md-6">
                    <h5>Status</h5>
                    <span class="badge bg-${getStatusColor(quote.status)}">${quote.status}</span>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-12">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="text-end">Quantity</th>
                                <th class="text-end">Unit Price</th>
                                <th class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quote.items.map(item => {
                                // Check if the item has dimensions and pricing method info
                                const hasPricingInfo = item.pricingMethod && item.dimensions;
                                
                                // Prepare additional info for display
                                let additionalInfo = '';
                                if (hasPricingInfo) {
                                    additionalInfo = `<br><small class="text-muted">
                                        ${item.dimensions} | ${item.pricingMethod}
                                    </small>`;
                                }
                                
                                return `
                                    <tr>
                                        <td>${item.description}${additionalInfo}</td>
                                        <td class="text-end">${item.quantity}</td>
                                        <td class="text-end">${formatCurrency(item.price)}</td>
                                        <td class="text-end">${formatCurrency(item.total)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Subtotal</strong></td>
                                <td class="text-end">${formatCurrency(quote.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Tax (${quote.taxRate}%)</strong></td>
                                <td class="text-end">${formatCurrency(quote.taxAmount)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Total</strong></td>
                                <td class="text-end"><strong>${formatCurrency(quote.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            ${quote.notes ? `
                <div class="row mb-4">
                    <div class="col-md-12">
                        <h5>Notes</h5>
                        <p>${quote.notes}</p>
                    </div>
                </div>
            ` : ''}
            
            <div class="row">
                <div class="col-md-12 text-center">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </div>
    `;
    
    // Show preview modal
    const modal = new bootstrap.Modal(document.getElementById('previewQuoteModal'));
    modal.show();
}

// Delete quote
function deleteQuote(quoteId) {
    if (!confirm('Are you sure you want to delete this quote? This cannot be undone.')) return;
    
    // Filter out the quote
    quotes = quotes.filter(quote => quote.id !== quoteId);
    
    // Save to local storage
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
    
    // Refresh table
    loadQuotesTable();
    updateDashboard();
}
// Create invoice from quote
function createInvoiceFromQuote(quoteId) {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    // Show invoice modal
    const modal = new bootstrap.Modal(document.getElementById('createInvoiceModal'));
    modal.show();
    
    // Set client
    document.getElementById('invoiceClient').value = quote.clientId;
    document.getElementById('invoiceQuote').value = quoteId;
    
    // Clear existing items except the first one
    document.querySelectorAll('#invoiceItems .invoice-item-row').forEach((row, index) => {
        if (index > 0) row.remove();
    });
    
    // Populate items
    if (quote.items && quote.items.length > 0) {
        const firstItemRow = document.querySelector('#invoiceItems .invoice-item-row');
        
        // Set first item
        firstItemRow.querySelector('.item-description').value = quote.items[0].description;
        firstItemRow.querySelector('.item-quantity').value = quote.items[0].quantity;
        firstItemRow.querySelector('.item-price').value = quote.items[0].price;
        firstItemRow.querySelector('.item-total').value = quote.items[0].total;
        
        // Add additional items
        for (let i = 1; i < quote.items.length; i++) {
            const item = quote.items[i];
            const itemRow = document.createElement('div');
            itemRow.className = 'row mb-2 invoice-item-row';
            itemRow.innerHTML = `
                <div class="col-md-4">
                    <input type="text" class="form-control item-description" placeholder="Item Description" value="${item.description}" required>
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control item-quantity" placeholder="Qty" min="1" value="${item.quantity}" required>
                </div>
                <div class="col-md-2">
                    <input type="number" step="0.01" class="form-control item-price" placeholder="Unit Price" value="${item.price}" required>
                </div>
                <div class="col-md-3">
                    <input type="number" step="0.01" class="form-control item-total" placeholder="Total" value="${item.total}" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger remove-item">×</button>
                </div>
            `;
            document.getElementById('invoiceItems').appendChild(itemRow);
            
            // Add event listeners to the new item row
            itemRow.querySelector('.item-quantity').addEventListener('input', calculateInvoiceTotals);
            itemRow.querySelector('.item-price').addEventListener('input', calculateInvoiceTotals);
            itemRow.querySelector('.remove-item').addEventListener('click', function() {
                itemRow.remove();
                calculateInvoiceTotals();
            });
        }
    }
    
    // Set tax rate
    document.getElementById('invoiceTaxRate').value = quote.taxRate || 0;
    
    // Calculate totals
    calculateInvoiceTotals();
    
    // Set dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Set due date to 30 days from now
    
    document.getElementById('invoiceDate').valueAsDate = today;
    document.getElementById('invoiceDueDate').valueAsDate = dueDate;
    
    // Set notes
    document.getElementById('invoiceNotes').value = quote.notes || '';
    
    // Set the form data attribute for the quote ID
    document.getElementById('createInvoiceForm').setAttribute('data-quote-id', quoteId);
}

// Preview quote
document.getElementById('previewQuoteBtn').addEventListener('click', function() {
    const quoteForm = document.getElementById('createQuoteForm');
    const clientId = document.getElementById('quoteClient').value;
    
    if (!clientId) {
        alert('Please select a client');
        return;
    }
    
    const client = clients.find(c => c.id === clientId);
    
    // Get items
    const items = [];
    document.querySelectorAll('#quoteItems .quote-item-row').forEach(row => {
        items.push({
            description: row.querySelector('.item-description').value,
            quantity: parseFloat(row.querySelector('.item-quantity').value) || 0,
            price: parseFloat(row.querySelector('.item-price').value) || 0,
            total: parseFloat(row.querySelector('.item-total').value) || 0
        });
    });
    
    const subtotal = parseFloat(document.getElementById('quoteSubtotal').value) || 0;
    const taxRate = parseFloat(document.getElementById('quoteTaxRate').value) || 0;
    const taxAmount = parseFloat(document.getElementById('quoteTaxAmount').value) || 0;
    const total = parseFloat(document.getElementById('quoteTotal').value) || 0;
    
    // Create a temporary quote object for preview
    const tempQuote = {
        id: quoteForm.getAttribute('data-id') || generateId(),
        clientId: clientId,
        items: items,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        notes: document.getElementById('quoteNotes').value,
        validUntil: document.getElementById('quoteValidUntil').value,
        status: 'Pending',
        createdAt: new Date().toISOString()
    };
    
    // Create a preview of the quote
    const previewContent = document.getElementById('quotePreviewContent');
    
    // Format date for display
    const formattedDate = new Date(tempQuote.createdAt).toLocaleDateString();
    const validUntilDate = tempQuote.validUntil ? new Date(tempQuote.validUntil).toLocaleDateString() : 'N/A';
    
    previewContent.innerHTML = `
        <div class="quote-preview">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h4>${settings.businessName || 'My Print Shop'}</h4>
                    <p>${settings.businessAddress || ''}<br>
                    Phone: ${settings.businessPhone || ''}<br>
                    Email: ${settings.businessEmail || ''}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h2>QUOTE</h2>
                    <p>Quote #: ${tempQuote.id.substr(0, 8)}<br>
                    Date: ${formattedDate}<br>
                    Valid Until: ${validUntilDate}</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Client</h5>
                    <p>${client ? client.name : 'Unknown'}<br>
                    ${client ? (client.contactPerson || '') : ''}<br>
                    ${client ? (client.location || '') : ''}<br>
                    ${client ? (client.phone || '') : ''}<br>
                    ${client ? (client.email || '') : ''}</p>
                </div>
                <div class="col-md-6">
                    <h5>Status</h5>
                    <span class="badge bg-${getStatusColor(tempQuote.status)}">${tempQuote.status}</span>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-12">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="text-end">Quantity</th>
                                <th class="text-end">Unit Price</th>
                                <th class="text-end">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tempQuote.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td class="text-end">${item.quantity}</td>
                                    <td class="text-end">${formatCurrency(item.price)}</td>
                                    <td class="text-end">${formatCurrency(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Subtotal</strong></td>
                                <td class="text-end">${formatCurrency(tempQuote.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Tax (${tempQuote.taxRate}%)</strong></td>
                                <td class="text-end">${formatCurrency(tempQuote.taxAmount)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Total</strong></td>
                                <td class="text-end"><strong>${formatCurrency(tempQuote.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            ${tempQuote.notes ? `
                <div class="row mb-4">
                    <div class="col-md-12">
                        <h5>Notes</h5>
                        <p>${tempQuote.notes}</p>
                    </div>
                </div>
            ` : ''}
            
            <div class="row">
                <div class="col-md-12 text-center">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </div>
    `;
    
    // Show preview modal
    const modal = new bootstrap.Modal(document.getElementById('previewQuoteModal'));
    modal.show();
});

// Populate quote dropdowns
function populateQuoteDropdowns() {
    const quoteDropdowns = [
        document.getElementById('invoiceQuote')
    ];
    
    quoteDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        // Save selected value if any
        const selectedValue = dropdown.value;
        
        // Clear options except the first one
        dropdown.innerHTML = '<option value="">Select Quote or Leave Empty for New Invoice</option>';
        
        // Add options for each quote
        quotes.forEach(quote => {
            const client = clients.find(c => c.id === quote.clientId);
            const option = document.createElement('option');
            option.value = quote.id;
            option.textContent = `${quote.id.substr(0, 8)} - ${client ? client.name : 'Unknown'} - ${formatCurrency(quote.total)}`;
            dropdown.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (selectedValue && quotes.some(quote => quote.id === selectedValue)) {
            dropdown.value = selectedValue;
        }
    });
}

// Update the createQuoteFromOrder function to use client pricing
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
    
    // Set price based on client pricing if available
    if (typeof getClientPrice === 'function') {
        const pricing = getClientPrice(order.clientId, order.material);
        if (pricing) {
            let price = pricing.unitPrice;
            
            // Adjust price based on pricing method and dimensions
            if (pricing.pricingMethod === 'Per Square Meter' || pricing.pricingMethod === 'Per Square Foot') {
                // Convert measurements to the pricing unit if needed
                let convertedArea = area;
                
                // Handle unit conversions (simplified)
                if (order.widthUnit === 'in' && pricing.pricingMethod === 'Per Square Meter') {
                    // Convert sq inches to sq meters
                    convertedArea = area * 0.00064516;
                } else if (order.widthUnit === 'cm' && pricing.pricingMethod === 'Per Square Meter') {
                    // Convert sq cm to sq meters
                    convertedArea = area * 0.0001;
                } else if (order.widthUnit === 'ft' && pricing.pricingMethod === 'Per Square Meter') {
                    // Convert sq feet to sq meters
                    convertedArea = area * 0.092903;
                } else if (order.widthUnit === 'm' && pricing.pricingMethod === 'Per Square Foot') {
                    // Convert sq meters to sq feet
                    convertedArea = area * 10.7639;
                } else if (order.widthUnit === 'cm' && pricing.pricingMethod === 'Per Square Foot') {
                    // Convert sq cm to sq feet
                    convertedArea = area * 0.00107639;
                } else if (order.widthUnit === 'in' && pricing.pricingMethod === 'Per Square Foot') {
                    // Convert sq inches to sq feet
                    convertedArea = area * 0.00694444;
                }
                
                // Calculate total price based on area
                price = price * convertedArea;
            }
            
            itemRow.querySelector('.item-price').value = price.toFixed(2);
        } else {
            // Default price if no client pricing
            const basePrice = 10; // Default price
            itemRow.querySelector('.item-price').value = basePrice;
        }
    } else {
        // Set a default price if client pricing is not available
        const basePrice = 10; // Default price per sq unit
        const price = basePrice; // Simplified pricing
        
        itemRow.querySelector('.item-price').value = price;
    }
    
    itemRow.querySelector('.item-total').value = parseFloat(itemRow.querySelector('.item-price').value) * order.quantity;
    
    // Calculate totals
    calculateQuoteTotals();
    
    // Set valid until date to 30 days from now
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    document.getElementById('quoteValidUntil').valueAsDate = validUntil;
    
    // Create quote
    document.getElementById('createQuoteForm').setAttribute('data-order-id', orderId);
}

// Update the quote item price calculation
document.addEventListener('DOMContentLoaded', function() {
    // When creating a new quote manually
    const quoteClientSelect = document.getElementById('quoteClient');
    
    // Add event listener to the "Add Item" button to use client pricing
    const addQuoteItemBtn = document.getElementById('addQuoteItemBtn');
    if (addQuoteItemBtn) {
        const originalAddQuoteItem = addQuoteItemBtn.onclick || function() {};
        
        addQuoteItemBtn.onclick = function(e) {
            // Call the original function first
            originalAddQuoteItem.call(this, e);
            
            // Now add custom behavior to the newly added row
            const newRow = document.querySelector('#quoteItems .quote-item-row:last-child');
            if (newRow) {
                // Add material selection dropdown if not already there
                if (!newRow.querySelector('.item-material')) {
                    // Create a material selection dropdown
                    const descCell = newRow.querySelector('.col-md-4');
                    if (descCell) {
                        const originalDescInput = descCell.innerHTML;
                        
                        // Replace with description + material dropdown
                        descCell.innerHTML = `
                            <div class="mb-2">
                                <input type="text" class="form-control item-description" placeholder="Item Description" required>
                            </div>
                            <div class="d-flex">
                                <select class="form-select item-material">
                                    <option value="">Select Material</option>
                                    <option value="Vinyl">Vinyl</option>
                                    <option value="Glossy Paper">Glossy Paper</option>
                                    <option value="Matte Paper">Matte Paper</option>
                                    <option value="Card Stock">Card Stock</option>
                                    <option value="Canvas">Canvas</option>
                                    <option value="Banner Material">Banner Material</option>
                                    <option value="Adhesive Vinyl">Adhesive Vinyl</option>
                                    <option value="Fabric">Fabric</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        `;
                        
                        // Add event listener to the material dropdown
                        const materialSelect = descCell.querySelector('.item-material');
                        if (materialSelect) {
                            materialSelect.addEventListener('change', function() {
                                const clientId = quoteClientSelect.value;
                                const material = this.value;
                                
                                if (clientId && material && typeof getClientPrice === 'function') {
                                    const pricing = getClientPrice(clientId, material);
                                    if (pricing) {
                                        // Update the price input with client pricing
                                        newRow.querySelector('.item-price').value = pricing.unitPrice;
                                        
                                        // Trigger price calculation
                                        calculateQuoteTotals();
                                    }
                                }
                            });
                        }
                    }
                }
            }
        };
    }
});

// Add this to invoices.js

// Update createInvoiceFromQuote to preserve pricing
function createInvoiceFromQuote(quoteId) {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    // Show invoice modal
    const modal = new bootstrap.Modal(document.getElementById('createInvoiceModal'));
    modal.show();
    
    // Set client
    document.getElementById('invoiceClient').value = quote.clientId;
    document.getElementById('invoiceQuote').value = quoteId;
    
    // Clear existing items except the first one
    document.querySelectorAll('#invoiceItems .invoice-item-row').forEach((row, index) => {
        if (index > 0) row.remove();
    });
    
    // Populate items
    if (quote.items && quote.items.length > 0) {
        const firstItemRow = document.querySelector('#invoiceItems .invoice-item-row');
        
        // Set first item
        firstItemRow.querySelector('.item-description').value = quote.items[0].description;
        firstItemRow.querySelector('.item-quantity').value = quote.items[0].quantity;
        firstItemRow.querySelector('.item-price').value = quote.items[0].price;
        firstItemRow.querySelector('.item-total').value = quote.items[0].total;
        
        // Add additional items
        for (let i = 1; i < quote.items.length; i++) {
            const item = quote.items[i];
            const itemRow = document.createElement('div');
            itemRow.className = 'row mb-2 invoice-item-row';
            itemRow.innerHTML = `
                <div class="col-md-4">
                    <input type="text" class="form-control item-description" placeholder="Item Description" value="${item.description}" required>
                </div>
                <div class="col-md-2">
                    <input type="number" class="form-control item-quantity" placeholder="Qty" min="1" value="${item.quantity}" required>
                </div>
                <div class="col-md-2">
                    <input type="number" step="0.01" class="form-control item-price" placeholder="Unit Price" value="${item.price}" required>
                </div>
                <div class="col-md-3">
                    <input type="number" step="0.01" class="form-control item-total" placeholder="Total" value="${item.total}" readonly>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger remove-item">×</button>
                </div>
            `;
            document.getElementById('invoiceItems').appendChild(itemRow);
            
            // Add event listeners to the new item row
            itemRow.querySelector('.item-quantity').addEventListener('input', calculateInvoiceTotals);
            itemRow.querySelector('.item-price').addEventListener('input', calculateInvoiceTotals);
            itemRow.querySelector('.remove-item').addEventListener('click', function() {
                itemRow.remove();
                calculateInvoiceTotals();
            });
        }
    }
    
    // Set tax rate
    document.getElementById('invoiceTaxRate').value = quote.taxRate || 0;
    
    // Calculate totals
    calculateInvoiceTotals();
    
    // Set dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Set due date to 30 days from now
    
    document.getElementById('invoiceDate').valueAsDate = today;
    document.getElementById('invoiceDueDate').valueAsDate = dueDate;
    
    // Set notes
    document.getElementById('invoiceNotes').value = quote.notes || '';
    
    // Set the form data attribute for the quote ID
    document.getElementById('createInvoiceForm').setAttribute('data-quote-id', quoteId);
}