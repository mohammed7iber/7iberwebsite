// Client Management

// Load client table
function loadClientTable() {
    const tableBody = document.getElementById('clientTableBody');
    tableBody.innerHTML = '';
    
    clients.forEach(client => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${client.name}</td>
            <td>${client.contactPerson || 'N/A'}</td>
            <td>${client.email || 'N/A'}</td>
            <td>${client.phone || 'N/A'}</td>
            <td>${client.location || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-client" data-id="${client.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-client" data-id="${client.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Add event listeners to the edit and delete buttons
    document.querySelectorAll('.edit-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-id');
            editClient(clientId);
        });
    });
    
    document.querySelectorAll('.delete-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-id');
            deleteClient(clientId);
        });
    });
    
    // Populate client dropdowns
    populateClientDropdowns();
}

// Save client
document.getElementById('saveClientBtn').addEventListener('click', function() {

    
    if (clientId) {
        // Update existing client
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients[index] = client;
        }
    } else {
        // Add new client
        clients.push(client);
    }
    
    // Save to local storage
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    
    // Close modal and refresh table
    const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('addClientForm').reset();
    if (document.getElementById('clientForm')) {
        document.getElementById('clientForm').removeAttribute('data-id');
    }
    
    // Refresh table
    loadClientTable();
    updateDashboard();
});

// Edit client
function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    document.getElementById('clientName').value = client.name;
    document.getElementById('contactPerson').value = client.contactPerson || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientLocation').value = client.location || '';
    document.getElementById('clientNotes').value = client.notes || '';
    
    // Set the client ID on the form for update
    document.getElementById('addClientForm').setAttribute('data-id', clientId);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addClientModal'));
    modal.show();
}

// Delete client
function deleteClient(clientId) {
    if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;
    
    // Check if client has orders
    const hasOrders = orders.some(order => order.clientId === clientId);
    if (hasOrders) {
        alert('This client has orders and cannot be deleted. Please delete the orders first.');
        return;
    }
    
    // Filter out the client
    clients = clients.filter(client => client.id !== clientId);
    
    // Save to local storage
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    
    // Refresh table
    loadClientTable();
    updateDashboard();
}

// Populate client dropdowns in forms
function populateClientDropdowns() {
    const clientDropdowns = [
        document.getElementById('orderClient'),
        document.getElementById('quoteClient'),
        document.getElementById('invoiceClient')
    ];
    
    clientDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        // Save selected value if any
        const selectedValue = dropdown.value;
        
        // Clear options except the first one
        dropdown.innerHTML = '<option value="">Select Client</option>';
        
        // Add options for each client
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            dropdown.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (selectedValue && clients.some(client => client.id === selectedValue)) {
            dropdown.value = selectedValue;
        }
    });
}