// Invoice Management

// Load invoices table
function loadInvoicesTable() {
    const tableBody = document.getElementById('invoicesTableBody');
    tableBody.innerHTML = '';
    
    invoices.forEach(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${invoice.id.substr(0, 8)}</td>
            <td>${client ? client.name : 'Unknown'}</td>
            <td>${new Date(invoice.createdAt).toLocaleDateString()}</td>
            <td>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
            <td>${formatCurrency(invoice.total)}</td>
            <td><span class="badge bg-${getStatusColor(invoice.status)}">${invoice.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary edit-invoice" data-id="${invoice.id}">Edit</button>
                <button class="btn btn-sm btn-info view-invoice" data-id="${invoice.id}">View</button>
                <button class="btn btn-sm btn-success mark-paid" data-id="${invoice.id}">Mark Paid</button>
                <button class="btn btn-sm btn-danger delete-invoice" data-id="${invoice.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.edit-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-id');
            editInvoice(invoiceId);
        });
    });
    
    document.querySelectorAll('.view-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-id');
            viewInvoice(invoiceId);
        });
    });
    
    document.querySelectorAll('.mark-paid').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-id');
            markInvoicePaid(invoiceId);
        });
    });
    
    document.querySelectorAll('.delete-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-id');
            deleteInvoice(invoiceId);
        });
    });
}

// Calculate invoice totals
function calculateInvoiceTotals() {
    const invoiceItemRows = document.querySelectorAll('#invoiceItems .invoice-item-row');
    let subtotal = 0;
    
    invoiceItemRows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = quantity * price;
        
        row.querySelector('.item-total').value = total.toFixed(2);
        subtotal += total;
    });
    
    document.getElementById('invoiceSubtotal').value = subtotal.toFixed(2);
    
    const taxRate = parseFloat(document.getElementById('invoiceTaxRate').value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    document.getElementById('invoiceTaxAmount').value = taxAmount.toFixed(2);
    
    const total = subtotal + taxAmount;
    document.getElementById('invoiceTotal').value = total.toFixed(2);
}
// Add invoice item
document.getElementById('addInvoiceItemBtn').addEventListener('click', function() {
    const invoiceItemsContainer = document.getElementById('invoiceItems');
    const newItemRow = document.createElement('div');
    newItemRow.className = 'row mb-2 invoice-item-row';
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
    invoiceItemsContainer.appendChild(newItemRow);
    
    // Add event listeners to the new item row
    newItemRow.querySelector('.item-quantity').addEventListener('input', calculateInvoiceTotals);
    newItemRow.querySelector('.item-price').addEventListener('input', calculateInvoiceTotals);
    newItemRow.querySelector('.remove-item').addEventListener('click', function() {
        newItemRow.remove();
        calculateInvoiceTotals();
    });
});

// Initialize invoice calculations
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to invoice calculation fields
    const invoiceTaxRateElement = document.getElementById('invoiceTaxRate');
    if (invoiceTaxRateElement) {
        invoiceTaxRateElement.addEventListener('input', calculateInvoiceTotals);
    }
    
    // Add event listeners to existing invoice items
    document.querySelectorAll('#invoiceItems .invoice-item-row').forEach(row => {
        const quantityInput = row.querySelector('.item-quantity');
        const priceInput = row.querySelector('.item-price');
        const removeButton = row.querySelector('.remove-item');
        
        if (quantityInput) {
            quantityInput.addEventListener('input', calculateInvoiceTotals);
        }
        
        if (priceInput) {
            priceInput.addEventListener('input', calculateInvoiceTotals);
        }
        
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                row.remove();
                calculateInvoiceTotals();
            });
        }
    });
    
    // Add event listener for quote selection to populate invoice data
    const invoiceQuoteSelect = document.getElementById('invoiceQuote');
    if (invoiceQuoteSelect) {
        invoiceQuoteSelect.addEventListener('change', function() {
            const quoteId = this.value;
            if (quoteId) {
                populateInvoiceFromQuote(quoteId);
            } else {
                // Clear the form if no quote is selected
                clearInvoiceForm();
            }
        });
    }
});

// Clear invoice form
function clearInvoiceForm() {
    // Clear items except the first one
    document.querySelectorAll('#invoiceItems .invoice-item-row').forEach((row, index) => {
        if (index > 0) row.remove();
    });
    
    // Clear the first item
    const firstItemRow = document.querySelector('#invoiceItems .invoice-item-row');
    if (firstItemRow) {
        firstItemRow.querySelector('.item-description').value = '';
        firstItemRow.querySelector('.item-quantity').value = '1';
        firstItemRow.querySelector('.item-price').value = '';
        firstItemRow.querySelector('.item-total').value = '';
    }
    
    // Clear totals
    document.getElementById('invoiceSubtotal').value = '0.00';
    document.getElementById('invoiceTaxRate').value = '0';
    document.getElementById('invoiceTaxAmount').value = '0.00';
    document.getElementById('invoiceTotal').value = '0.00';
    
    // Clear notes
    document.getElementById('invoiceNotes').value = '';
    
    // Set default dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Set due date to 30 days from now
    
    document.getElementById('invoiceDate').valueAsDate = today;
    document.getElementById('invoiceDueDate').valueAsDate = dueDate;
    
    // Set default status
    document.getElementById('invoiceStatus').value = 'Pending';
    
    // Remove data attributes
    const form = document.getElementById('createInvoiceForm');
    if (form.hasAttribute('data-id')) {
        form.removeAttribute('data-id');
    }
    if (form.hasAttribute('data-quote-id')) {
        form.removeAttribute('data-quote-id');
    }
}

// Populate invoice from quote
function populateInvoiceFromQuote(quoteId) {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    // Set client
    document.getElementById('invoiceClient').value = quote.clientId;
    
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
    
    // Set notes
    document.getElementById('invoiceNotes').value = quote.notes || '';
    
    // Set the form data attribute for the quote ID
    document.getElementById('createInvoiceForm').setAttribute('data-quote-id', quoteId);
}
// Save invoice
document.getElementById('saveInvoiceBtn').addEventListener('click', function() {
    const invoiceForm = document.getElementById('createInvoiceForm');
    const clientId = document.getElementById('invoiceClient').value;
    
    if (!clientId) {
        alert('Please select a client');
        return;
    }
    
    const invoiceId = invoiceForm.getAttribute('data-id');
    const quoteId = invoiceForm.getAttribute('data-quote-id');
    
    // Get items
    const items = [];
    document.querySelectorAll('#invoiceItems .invoice-item-row').forEach(row => {
        items.push({
            description: row.querySelector('.item-description').value,
            quantity: parseFloat(row.querySelector('.item-quantity').value) || 0,
            price: parseFloat(row.querySelector('.item-price').value) || 0,
            total: parseFloat(row.querySelector('.item-total').value) || 0
        });
    });
    
    const subtotal = parseFloat(document.getElementById('invoiceSubtotal').value) || 0;
    const taxRate = parseFloat(document.getElementById('invoiceTaxRate').value) || 0;
    const taxAmount = parseFloat(document.getElementById('invoiceTaxAmount').value) || 0;
    const total = parseFloat(document.getElementById('invoiceTotal').value) || 0;
    
    const invoice = {
        id: invoiceId || generateId(),
        clientId: clientId,
        quoteId: quoteId || null,
        items: items,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        notes: document.getElementById('invoiceNotes').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        dueDate: document.getElementById('invoiceDueDate').value,
        paymentTerms: document.getElementById('invoicePaymentTerms') ? document.getElementById('invoicePaymentTerms').value : 'Due on Receipt',
        paymentMethod: document.getElementById('invoicePaymentMethod') ? document.getElementById('invoicePaymentMethod').value : '',
        status: document.getElementById('invoiceStatus') ? document.getElementById('invoiceStatus').value : 'Pending',
        createdAt: invoiceId ? (invoices.find(i => i.id === invoiceId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidAt: null
    };
    
    if (invoiceId) {
        // Update existing invoice
        const index = invoices.findIndex(i => i.id === invoiceId);
        if (index !== -1) {
            // Preserve the paidAt date if it exists
            invoice.paidAt = invoices[index].paidAt || null;
            invoices[index] = invoice;
        }
    } else {
        // Add new invoice
        invoices.push(invoice);
        
        // If created from a quote, update the quote status
        if (quoteId) {
            const quoteIndex = quotes.findIndex(q => q.id === quoteId);
            if (quoteIndex !== -1) {
                quotes[quoteIndex].status = 'Converted';
                localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
            }
        }
    }
    
    // Save to local storage
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    
    // Close modal and refresh table
    const modal = bootstrap.Modal.getInstance(document.getElementById('createInvoiceModal'));
    modal.hide();
    
    // Reset form
    invoiceForm.reset();
    if (invoiceForm.hasAttribute('data-id')) {
        invoiceForm.removeAttribute('data-id');
    }
    if (invoiceForm.hasAttribute('data-quote-id')) {
        invoiceForm.removeAttribute('data-quote-id');
    }
    
    // Refresh table
    loadInvoicesTable();
    updateDashboard();
});
// Edit invoice
function editInvoice(invoiceId) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    document.getElementById('invoiceClient').value = invoice.clientId;
    
    if (invoice.quoteId && document.getElementById('invoiceQuote')) {
        document.getElementById('invoiceQuote').value = invoice.quoteId;
    }
    
    document.getElementById('invoiceNotes').value = invoice.notes || '';
    document.getElementById('invoiceTaxRate').value = invoice.taxRate || 0;
    document.getElementById('invoiceDate').value = invoice.invoiceDate || '';
    document.getElementById('invoiceDueDate').value = invoice.dueDate || '';
    
    if (document.getElementById('invoicePaymentTerms')) {
        document.getElementById('invoicePaymentTerms').value = invoice.paymentTerms || 'Due on Receipt';
    }
    
    if (document.getElementById('invoicePaymentMethod')) {
        document.getElementById('invoicePaymentMethod').value = invoice.paymentMethod || '';
    }
    
    if (document.getElementById('invoiceStatus')) {
        document.getElementById('invoiceStatus').value = invoice.status || 'Pending';
    }
    
    // Clear existing items except the first one
    document.querySelectorAll('#invoiceItems .invoice-item-row').forEach((row, index) => {
        if (index > 0) row.remove();
    });
    
    // Populate items
    if (invoice.items && invoice.items.length > 0) {
        const firstItemRow = document.querySelector('#invoiceItems .invoice-item-row');
        
        // Set first item
        firstItemRow.querySelector('.item-description').value = invoice.items[0].description;
        firstItemRow.querySelector('.item-quantity').value = invoice.items[0].quantity;
        firstItemRow.querySelector('.item-price').value = invoice.items[0].price;
        firstItemRow.querySelector('.item-total').value = invoice.items[0].total;
        
        // Add additional items
        for (let i = 1; i < invoice.items.length; i++) {
            const item = invoice.items[i];
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
    
    // Calculate totals
    calculateInvoiceTotals();
    
    // Set the invoice ID on the form for update
    document.getElementById('createInvoiceForm').setAttribute('data-id', invoiceId);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('createInvoiceModal'));
    modal.show();
}

// View invoice
function viewInvoice(invoiceId) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    const client = clients.find(c => c.id === invoice.clientId);
    
    // Create a preview of the invoice
    const previewContent = document.getElementById('invoicePreviewContent');
    
    // Format dates for display
    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A';
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A';
    const paidDate = invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A';
    
    previewContent.innerHTML = `
        <div class="invoice-preview">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h4>${settings.businessName || 'My Print Shop'}</h4>
                    <p>${settings.businessAddress || ''}<br>
                    Phone: ${settings.businessPhone || ''}<br>
                    Email: ${settings.businessEmail || ''}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h2>INVOICE</h2>
                    <p>Invoice #: ${invoice.id.substr(0, 8)}<br>
                    Date: ${invoiceDate}<br>
                    Due Date: ${dueDate}</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Bill To</h5>
                    <p>${client ? client.name : 'Unknown'}<br>
                    ${client ? (client.contactPerson || '') : ''}<br>
                    ${client ? (client.location || '') : ''}<br>
                    ${client ? (client.phone || '') : ''}<br>
                    ${client ? (client.email || '') : ''}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h5>Status</h5>
                    <span class="badge bg-${getStatusColor(invoice.status)}">${invoice.status}</span>
                    ${invoice.paidAt ? `<p>Paid On: ${paidDate}</p>` : ''}
                    <p>Payment Terms: ${invoice.paymentTerms || 'Due on Receipt'}</p>
                    ${invoice.paymentMethod ? `<p>Payment Method: ${invoice.paymentMethod}</p>` : ''}
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
                            ${invoice.items.map(item => `
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
                                <td class="text-end">${formatCurrency(invoice.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Tax (${invoice.taxRate}%)</strong></td>
                                <td class="text-end">${formatCurrency(invoice.taxAmount)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Total</strong></td>
                                <td class="text-end"><strong>${formatCurrency(invoice.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            ${invoice.notes ? `
                <div class="row mb-4">
                    <div class="col-md-12">
                        <h5>Notes</h5>
                        <p>${invoice.notes}</p>
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
    const modal = new bootstrap.Modal(document.getElementById('previewInvoiceModal'));
    modal.show();
}

// Mark invoice as paid
function markInvoicePaid(invoiceId) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;
    
    // Ask for confirmation
    if (!confirm(`Mark invoice #${invoiceId.substr(0, 8)} as paid?`)) return;
    
    // Update invoice status
    invoice.status = 'Paid';
    invoice.paidAt = new Date().toISOString();
    invoice.updatedAt = new Date().toISOString();
    
    // Save to local storage
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    
    // Refresh table
    loadInvoicesTable();
    updateDashboard();
}

// Delete invoice
function deleteInvoice(invoiceId) {
    if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
    
    // Filter out the invoice
    invoices = invoices.filter(invoice => invoice.id !== invoiceId);
    
    // Save to local storage
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    
    // Refresh table
    loadInvoicesTable();
    updateDashboard();
}
// Preview invoice
document.getElementById('previewInvoiceBtn').addEventListener('click', function() {
    const invoiceForm = document.getElementById('createInvoiceForm');
    const clientId = document.getElementById('invoiceClient').value;
    
    if (!clientId) {
        alert('Please select a client');
        return;
    }
    
    const client = clients.find(c => c.id === clientId);
    
    // Get items
    const items = [];
    document.querySelectorAll('#invoiceItems .invoice-item-row').forEach(row => {
        items.push({
            description: row.querySelector('.item-description').value,
            quantity: parseFloat(row.querySelector('.item-quantity').value) || 0,
            price: parseFloat(row.querySelector('.item-price').value) || 0,
            total: parseFloat(row.querySelector('.item-total').value) || 0
        });
    });
    
    const subtotal = parseFloat(document.getElementById('invoiceSubtotal').value) || 0;
    const taxRate = parseFloat(document.getElementById('invoiceTaxRate').value) || 0;
    const taxAmount = parseFloat(document.getElementById('invoiceTaxAmount').value) || 0;
    const total = parseFloat(document.getElementById('invoiceTotal').value) || 0;
    
    // Get payment terms and method if they exist
    const paymentTerms = document.getElementById('invoicePaymentTerms') ? 
        document.getElementById('invoicePaymentTerms').value : 'Due on Receipt';
    const paymentMethod = document.getElementById('invoicePaymentMethod') ? 
        document.getElementById('invoicePaymentMethod').value : '';
    const status = document.getElementById('invoiceStatus') ? 
        document.getElementById('invoiceStatus').value : 'Pending';
    
    // Create a temporary invoice object for preview
    const tempInvoice = {
        id: invoiceForm.getAttribute('data-id') || generateId(),
        clientId: clientId,
        quoteId: invoiceForm.getAttribute('data-quote-id') || null,
        items: items,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: total,
        notes: document.getElementById('invoiceNotes').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        dueDate: document.getElementById('invoiceDueDate').value,
        paymentTerms: paymentTerms,
        paymentMethod: paymentMethod,
        status: status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paidAt: null
    };
    
    // Format dates for display
    const invoiceDate = tempInvoice.invoiceDate ? new Date(tempInvoice.invoiceDate).toLocaleDateString() : 'N/A';
    const dueDate = tempInvoice.dueDate ? new Date(tempInvoice.dueDate).toLocaleDateString() : 'N/A';
    
    // Create a preview of the invoice
    const previewContent = document.getElementById('invoicePreviewContent');
    
    previewContent.innerHTML = `
        <div class="invoice-preview">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h4>${settings.businessName || 'My Print Shop'}</h4>
                    <p>${settings.businessAddress || ''}<br>
                    Phone: ${settings.businessPhone || ''}<br>
                    Email: ${settings.businessEmail || ''}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h2>INVOICE</h2>
                    <p>Invoice #: ${tempInvoice.id.substr(0, 8)}<br>
                    Date: ${invoiceDate}<br>
                    Due Date: ${dueDate}</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Bill To</h5>
                    <p>${client ? client.name : 'Unknown'}<br>
                    ${client ? (client.contactPerson || '') : ''}<br>
                    ${client ? (client.location || '') : ''}<br>
                    ${client ? (client.phone || '') : ''}<br>
                    ${client ? (client.email || '') : ''}</p>
                </div>
                <div class="col-md-6 text-end">
                    <h5>Status</h5>
                    <span class="badge bg-${getStatusColor(tempInvoice.status)}">${tempInvoice.status}</span>
                    <p>Payment Terms: ${tempInvoice.paymentTerms}</p>
                    ${tempInvoice.paymentMethod ? `<p>Payment Method: ${tempInvoice.paymentMethod}</p>` : ''}
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
                            ${tempInvoice.items.map(item => `
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
                                <td class="text-end">${formatCurrency(tempInvoice.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Tax (${tempInvoice.taxRate}%)</strong></td>
                                <td class="text-end">${formatCurrency(tempInvoice.taxAmount)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Total</strong></td>
                                <td class="text-end"><strong>${formatCurrency(tempInvoice.total)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            
            ${tempInvoice.notes ? `
                <div class="row mb-4">
                    <div class="col-md-12">
                        <h5>Notes</h5>
                        <p>${tempInvoice.notes}</p>
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
    const modal = new bootstrap.Modal(document.getElementById('previewInvoiceModal'));
    modal.show();
});

// Print invoice
document.getElementById('printInvoiceBtn').addEventListener('click', function() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the invoice preview content
    const content = document.getElementById('invoicePreviewContent').innerHTML;
    
    // Create a printable document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body {
                    padding: 20px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="row mb-4 no-print">
                    <div class="col-12">
                        <button onclick="window.print();window.close();" class="btn btn-primary">Print Invoice</button>
                    </div>
                </div>
                ${content}
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
});

// Email invoice
document.getElementById('emailInvoiceBtn').addEventListener('click', function() {
    const invoiceId = document.getElementById('createInvoiceForm').getAttribute('data-id');
    
    if (invoiceId) {
        const invoice = invoices.find(i => i.id === invoiceId);
        if (invoice) {
            const client = clients.find(c => c.id === invoice.clientId);
            if (client && client.email) {
                // Create a mailto link
                const subject = encodeURIComponent(`Invoice #${invoice.id.substr(0, 8)} from ${settings.businessName || 'My Print Shop'}`);
                const body = encodeURIComponent(`Dear ${client.contactPerson || client.name},\n\nPlease find attached your invoice #${invoice.id.substr(0, 8)} for a total of ${formatCurrency(invoice.total)}.\n\nInvoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for your business.\n\nBest regards,\n${settings.businessName || 'My Print Shop'}`);
                
                window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
                
                // Update invoice status to 'Sent'
                invoice.status = 'Sent';
                invoice.updatedAt = new Date().toISOString();
                
                // Save to local storage
                localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
                
                // Refresh table
                loadInvoicesTable();
                updateDashboard();
            } else {
                alert('Client email address not found. Please update the client information.');
            }
        }
    } else {
        // Temporary invoice (not saved yet)
        const clientId = document.getElementById('invoiceClient').value;
        if (clientId) {
            const client = clients.find(c => c.id === clientId);
            if (client && client.email) {
                // Create a mailto link
                const subject = encodeURIComponent(`Invoice from ${settings.businessName || 'My Print Shop'}`);
                const body = encodeURIComponent(`Dear ${client.contactPerson || client.name},\n\nPlease find attached your invoice for a total of ${formatCurrency(parseFloat(document.getElementById('invoiceTotal').value) || 0)}.\n\nThank you for your business.\n\nBest regards,\n${settings.businessName || 'My Print Shop'}`);
                
                window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
            } else {
                alert('Client email address not found. Please update the client information.');
            }
        } else {
            alert('Please select a client.');
        }
    }
});

// Create PDF function for download
document.getElementById('downloadInvoicePdfBtn').addEventListener('click', function() {
    alert('PDF generation feature will be implemented in a future update. For now, you can use the Print function and save as PDF.');
});

// Send invoice email from preview modal
document.getElementById('sendInvoiceEmailBtn').addEventListener('click', function() {
    // Extract the invoice ID from the preview
    const content = document.getElementById('invoicePreviewContent').innerHTML;
    const match = content.match(/Invoice #: ([a-z0-9]+)/);
    
    if (match && match[1]) {
        const shortId = match[1];
        const invoice = invoices.find(i => i.id.substr(0, 8) === shortId);
        
        if (invoice) {
            const client = clients.find(c => c.id === invoice.clientId);
            if (client && client.email) {
                // Create a mailto link
                const subject = encodeURIComponent(`Invoice #${shortId} from ${settings.businessName || 'My Print Shop'}`);
                const body = encodeURIComponent(`Dear ${client.contactPerson || client.name},\n\nPlease find attached your invoice #${shortId} for a total of ${formatCurrency(invoice.total)}.\n\nInvoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for your business.\n\nBest regards,\n${settings.businessName || 'My Print Shop'}`);
                
                window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
                
                // Update invoice status to 'Sent'
                invoice.status = 'Sent';
                invoice.updatedAt = new Date().toISOString();
                
                // Save to local storage
                localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
                
                // Refresh table
                loadInvoicesTable();
                updateDashboard();
            } else {
                alert('Client email address not found. Please update the client information.');
            }
        }
    } else {
        alert('Unable to identify invoice. Please save the invoice first.');
    }
});
