// Price List Management for Print Shop

// Local storage key for price lists
const PRICE_LISTS_KEY = 'print_shop_price_lists';

// Initialize price lists from localStorage
let priceLists = JSON.parse(localStorage.getItem(PRICE_LISTS_KEY)) || {};

// Initialize price list management
function initPriceListManagement() {
    // Add material price button in client modal
    const addMaterialPriceBtn = document.getElementById('addMaterialPriceBtn');
    if (addMaterialPriceBtn) {
        addMaterialPriceBtn.addEventListener('click', function() {
            const clientId = document.getElementById('addClientForm').getAttribute('data-id');
            if (!clientId) {
                alert('Please save the client first before adding price items.');
                return;
            }
            
            // Reset form
            document.getElementById('priceItemId').value = '';
            document.getElementById('priceMaterial').value = '';
            document.getElementById('otherMaterial').value = '';
            document.getElementById('otherMaterial').disabled = true;
            document.getElementById('pricingMethod').value = 'Per Square Meter';
            document.getElementById('unitPrice').value = '';
            document.getElementById('priceNotes').value = '';
            
            // Store client ID for reference
            document.getElementById('priceItemForm').setAttribute('data-client-id', clientId);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addPriceItemModal'));
            modal.show();
        });
    }
    
    // Toggle "Other" material field
    const materialSelect = document.getElementById('priceMaterial');
    if (materialSelect) {
        materialSelect.addEventListener('change', function() {
            const otherMaterialField = document.getElementById('otherMaterial');
            if (this.value === 'Other') {
                otherMaterialField.disabled = false;
                otherMaterialField.required = true;
            } else {
                otherMaterialField.disabled = true;
                otherMaterialField.required = false;
            }
        });
    }
    
    // Save price item button
    const savePriceItemBtn = document.getElementById('savePriceItemBtn');
    if (savePriceItemBtn) {
        savePriceItemBtn.addEventListener('click', function() {
            const form = document.getElementById('priceItemForm');
            const clientId = form.getAttribute('data-client-id');
            
            if (!clientId) {
                alert('Client ID is missing. Please try again.');
                return;
            }
            
            // Validate form
            const material = document.getElementById('priceMaterial').value;
            if (!material) {
                alert('Please select a material.');
                return;
            }
            
            if (material === 'Other' && !document.getElementById('otherMaterial').value) {
                alert('Please specify the other material.');
                return;
            }
            
            const unitPrice = parseFloat(document.getElementById('unitPrice').value);
            if (isNaN(unitPrice) || unitPrice < 0) {
                alert('Please enter a valid unit price.');
                return;
            }
            
            // Create price item
            const priceItemId = document.getElementById('priceItemId').value || generateId();
            const materialName = material === 'Other' ? document.getElementById('otherMaterial').value : material;
            
            const priceItem = {
                id: priceItemId,
                material: materialName,
                pricingMethod: document.getElementById('pricingMethod').value,
                unitPrice: unitPrice,
                notes: document.getElementById('priceNotes').value
            };
            
            // Add to price lists
            if (!priceLists[clientId]) {
                priceLists[clientId] = [];
            }
            
            // Check if item already exists
            const existingIndex = priceLists[clientId].findIndex(item => item.id === priceItemId);
            if (existingIndex !== -1) {
                // Update existing item
                priceLists[clientId][existingIndex] = priceItem;
            } else {
                // Add new item
                priceLists[clientId].push(priceItem);
            }
            
            // Save to localStorage
            localStorage.setItem(PRICE_LISTS_KEY, JSON.stringify(priceLists));
            
            // Update the client pricing table
            updateClientPriceTable(clientId);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addPriceItemModal'));
            modal.hide();
        });
    }
    
    // Standalone price list manager (separate modal)
    const priceListClientSelect = document.getElementById('priceListClient');
    if (priceListClientSelect) {
        // Populate clients dropdown
        populateClientDropdown(priceListClientSelect);
        
        // Listen for client selection changes
        priceListClientSelect.addEventListener('change', function() {
            const clientId = this.value;
            if (clientId) {
                loadPriceListForClient(clientId);
            } else {
                // Clear the table
                document.getElementById('priceListTableBody').innerHTML = `
                    <tr id="noPricesRow">
                        <td colspan="4" class="text-center">No price items yet. Add your first material price using the button above.</td>
                    </tr>
                `;
            }
        });
    }
    
    // Add price item button in the price list modal
    const addPriceItemBtn = document.getElementById('addPriceItemBtn');
    if (addPriceItemBtn) {
        addPriceItemBtn.addEventListener('click', function() {
            const clientId = document.getElementById('priceListClient').value;
            if (!clientId) {
                alert('Please select a client first.');
                return;
            }
            
            // Reset form
            document.getElementById('priceItemId').value = '';
            document.getElementById('priceMaterial').value = '';
            document.getElementById('otherMaterial').value = '';
            document.getElementById('otherMaterial').disabled = true;
            document.getElementById('pricingMethod').value = 'Per Square Meter';
            document.getElementById('unitPrice').value = '';
            document.getElementById('priceNotes').value = '';
            
            // Store client ID for reference
            document.getElementById('priceItemForm').setAttribute('data-client-id', clientId);
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('addPriceItemModal'));
            modal.show();
        });
    }
    
    // Save price list button
    const savePriceListBtn = document.getElementById('savePriceListBtn');
    if (savePriceListBtn) {
        savePriceListBtn.addEventListener('click', function() {
            // Save is already handled by individual item saves, just close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('priceListModal'));
            modal.hide();
        });
    }
}

// Update the client price table in the client modal
function updateClientPriceTable(clientId) {
    const tableBody = document.getElementById('clientPriceTableBody');
    if (!tableBody) return;
    
    // Clear the table
    tableBody.innerHTML = '';
    
    // Get price items for client
    const priceItems = priceLists[clientId] || [];
    
    if (priceItems.length === 0) {
        // Show no items message
        tableBody.innerHTML = `
            <tr id="noClientPricesRow">
                <td colspan="4" class="text-center">No price items yet. Add your first material price.</td>
            </tr>
        `;
        return;
    }
    
    // Add each price item to the table
    priceItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-price-id', item.id);
        
        tr.innerHTML = `
            <td>${item.material}</td>
            <td>${item.pricingMethod}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-price-item" data-id="${item.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-price-item" data-id="${item.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.edit-price-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const priceId = this.getAttribute('data-id');
            editPriceItem(clientId, priceId);
        });
    });
    
    tableBody.querySelectorAll('.delete-price-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const priceId = this.getAttribute('data-id');
            deletePriceItem(clientId, priceId);
        });
    });
}

// Load price list for a client in the standalone price list modal
function loadPriceListForClient(clientId) {
    const tableBody = document.getElementById('priceListTableBody');
    if (!tableBody) return;
    
    // Clear the table
    tableBody.innerHTML = '';
    
    // Get price items for client
    const priceItems = priceLists[clientId] || [];
    
    if (priceItems.length === 0) {
        // Show no items message
        tableBody.innerHTML = `
            <tr id="noPricesRow">
                <td colspan="4" class="text-center">No price items yet. Add your first material price using the button above.</td>
            </tr>
        `;
        return;
    }
    
    // Add each price item to the table
    priceItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-price-id', item.id);
        
        tr.innerHTML = `
            <td>${item.material}</td>
            <td>${item.pricingMethod}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-price-item" data-id="${item.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-price-item" data-id="${item.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Add event listeners to buttons
    tableBody.querySelectorAll('.edit-price-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const priceId = this.getAttribute('data-id');
            editPriceItem(clientId, priceId);
        });
    });
    
    tableBody.querySelectorAll('.delete-price-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const priceId = this.getAttribute('data-id');
            deletePriceItem(clientId, priceId);
        });
    });
}

// Edit a price item
function editPriceItem(clientId, priceId) {
    if (!priceLists[clientId]) return;
    
    const priceItem = priceLists[clientId].find(item => item.id === priceId);
    if (!priceItem) return;
    
    // Set form values
    document.getElementById('priceItemId').value = priceItem.id;
    
    // Handle material selection and "Other" field
    const materialSelect = document.getElementById('priceMaterial');
    const otherMaterialField = document.getElementById('otherMaterial');
    
    // Check if material is in the predefined list
    const predefinedMaterials = Array.from(materialSelect.options).map(option => option.value);
    if (predefinedMaterials.includes(priceItem.material)) {
        materialSelect.value = priceItem.material;
        otherMaterialField.disabled = true;
        otherMaterialField.value = '';
    } else {
        materialSelect.value = 'Other';
        otherMaterialField.disabled = false;
        otherMaterialField.value = priceItem.material;
    }
    
    document.getElementById('pricingMethod').value = priceItem.pricingMethod;
    document.getElementById('unitPrice').value = priceItem.unitPrice;
    document.getElementById('priceNotes').value = priceItem.notes || '';
    
    // Store client ID for reference
    document.getElementById('priceItemForm').setAttribute('data-client-id', clientId);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addPriceItemModal'));
    modal.show();
}

// Delete a price item
function deletePriceItem(clientId, priceId) {
    if (!confirm('Are you sure you want to delete this price item?')) return;
    
    if (!priceLists[clientId]) return;
    
    // Remove the item
    priceLists[clientId] = priceLists[clientId].filter(item => item.id !== priceId);
    
    // Save to localStorage
    localStorage.setItem(PRICE_LISTS_KEY, JSON.stringify(priceLists));
    
    // Update UI
    const clientForm = document.getElementById('addClientForm');
    if (clientForm && clientForm.getAttribute('data-id') === clientId) {
        // Update in client modal
        updateClientPriceTable(clientId);
    } else {
        // Update in price list modal
        loadPriceListForClient(clientId);
    }
}

// Helper function to populate client dropdown
function populateClientDropdown(selectElement) {
    if (!selectElement) return;
    
    // Clear options except the first one
    selectElement.innerHTML = '<option value="">Select Client</option>';
    
    // Add options for each client
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        selectElement.appendChild(option);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initPriceListManagement();
    
    // Add "Price Lists" button to clients management page
    const clientsSection = document.getElementById('clients');
    if (clientsSection) {
        const actionButtons = clientsSection.querySelector('.btn-primary');
        if (actionButtons) {
            const priceListBtn = document.createElement('button');
            priceListBtn.className = 'btn btn-info mb-3 ms-2';
            priceListBtn.textContent = 'Manage Price Lists';
            priceListBtn.addEventListener('click', function() {
                const modal = new bootstrap.Modal(document.getElementById('priceListModal'));
                modal.show();
            });
            
            actionButtons.parentNode.insertBefore(priceListBtn, actionButtons.nextSibling);
        }
    }
    
    // Update client price table when client modal is shown
    const addClientModal = document.getElementById('addClientModal');
    if (addClientModal) {
        addClientModal.addEventListener('shown.bs.modal', function() {
            const clientId = document.getElementById('addClientForm').getAttribute('data-id');
            if (clientId) {
                updateClientPriceTable(clientId);
            }
        });
    }
    
    // Initialize price list tab
    const pricingTab = document.getElementById('pricing-tab');
    if (pricingTab) {
        pricingTab.addEventListener('shown.bs.tab', function() {
            const clientId = document.getElementById('addClientForm').getAttribute('data-id');
            if (clientId) {
                updateClientPriceTable(clientId);
            }
        });
    }
});

// Function to get client-specific pricing for a material
function getClientPrice(clientId, material, defaultPrice = null) {
    if (!clientId || !material) return defaultPrice;
    
    const clientPrices = priceLists[clientId];
    if (!clientPrices || clientPrices.length === 0) return defaultPrice;
    
    const materialPrice = clientPrices.find(item => item.material.toLowerCase() === material.toLowerCase());
    if (!materialPrice) return defaultPrice;
    
    return {
        unitPrice: materialPrice.unitPrice,
        pricingMethod: materialPrice.pricingMethod
    };
}