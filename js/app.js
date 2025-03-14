// Local Storage Keys
const CLIENTS_KEY = 'print_shop_clients';
const ORDERS_KEY = 'print_shop_orders';
const QUOTES_KEY = 'print_shop_quotes';
const INVOICES_KEY = 'print_shop_invoices';
const SETTINGS_KEY = 'print_shop_settings';

// Initialize Data
let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY)) || [];
let orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
let quotes = JSON.parse(localStorage.getItem(QUOTES_KEY)) || [];
let invoices = JSON.parse(localStorage.getItem(INVOICES_KEY)) || [];
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
    businessName: 'My Print Shop',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    services: []
};

// Generate unique IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Update dashboard counters
function updateDashboard() {
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('activeOrders').textContent = orders.filter(order => order.status !== 'Completed').length;
    document.getElementById('pendingQuotes').textContent = quotes.filter(quote => quote.status === 'Pending').length;
    document.getElementById('unpaidInvoices').textContent = invoices.filter(invoice => invoice.status === 'Unpaid').length;
    
    // Recent orders
    const recentOrdersTable = document.getElementById('recentOrdersTable');
    recentOrdersTable.innerHTML = '';
    
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    recentOrders.forEach(order => {
        const client = clients.find(c => c.id === order.clientId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.id.substr(0, 8)}</td>
            <td>${client ? client.name : 'Unknown'}</td>
            <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
        `;
        recentOrdersTable.appendChild(tr);
    });
    
    // Recent clients
    const recentClientsTable = document.getElementById('recentClientsTable');
    recentClientsTable.innerHTML = '';
    
    const recentClients = [...clients].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    recentClients.forEach(client => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${client.name}</td>
            <td>${client.contactPerson || 'N/A'}</td>
            <td>${client.location || 'N/A'}</td>
        `;
        recentClientsTable.appendChild(tr);
    });
}

// Get appropriate color for status badge
function getStatusColor(status) {
    switch(status) {
        case 'New': return 'primary';
        case 'In Progress': return 'warning';
        case 'Completed': return 'success';
        case 'Pending': return 'info';
        case 'Paid': return 'success';
        case 'Unpaid': return 'danger';
        default: return 'secondary';
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-JO', { 
        style: 'currency', 
        currency: 'JOD'
    }).format(amount);
}

// Navigation
document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active link
        document.querySelectorAll('.sidebar a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding section
        const sectionId = this.getAttribute('data-section');
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        
        // Update data if needed
        if (sectionId === 'dashboard') {
            updateDashboard();
        } else if (sectionId === 'clients') {
            loadClientTable();
        } else if (sectionId === 'orders') {
            loadOrdersTable();
        } else if (sectionId === 'quotes') {
            loadQuotesTable();
        } else if (sectionId === 'invoices') {
            loadInvoicesTable();
        } else if (sectionId === 'settings') {
            loadSettings();
        }
    });
});

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    loadSettings();
    
    // Add service button in settings
    document.getElementById('addServiceBtn').addEventListener('click', function() {
        const servicesContainer = document.getElementById('printServices');
        const newServiceRow = document.createElement('div');
        newServiceRow.className = 'row mb-2 print-service-row';
        newServiceRow.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Service Name (e.g., Banner Printing)">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control" placeholder="Base Price">
            </div>
            <div class="col-md-3">
                <select class="form-select">
                    <option>Per Item</option>
                    <option>Per Square Foot</option>
                    <option>Per Square Meter</option>
                    <option>Per Hour</option>
                </select>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger remove-service">×</button>
            </div>
        `;
        servicesContainer.appendChild(newServiceRow);
        
        // Add event listener to the remove button
        newServiceRow.querySelector('.remove-service').addEventListener('click', function() {
            newServiceRow.remove();
        });
    });
    
    // Add event listeners to existing remove buttons
    document.querySelectorAll('.remove-service').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.print-service-row').remove();
        });
    });
    
    // Save settings
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const services = [];
        document.querySelectorAll('.print-service-row').forEach(row => {
            const inputs = row.querySelectorAll('input, select');
            services.push({
                name: inputs[0].value,
                price: parseFloat(inputs[1].value) || 0,
                unit: inputs[2].value
            });
        });
        
        settings = {
            businessName: document.getElementById('businessName').value,
            businessAddress: document.getElementById('businessAddress').value,
            businessPhone: document.getElementById('businessPhone').value,
            businessEmail: document.getElementById('businessEmail').value,
            services: services
        };
        
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        alert('Settings saved successfully!');
    });
});

// Load settings
function loadSettings() {
    document.getElementById('businessName').value = settings.businessName || '';
    document.getElementById('businessAddress').value = settings.businessAddress || '';
    document.getElementById('businessPhone').value = settings.businessPhone || '';
    document.getElementById('businessEmail').value = settings.businessEmail || '';
    
    // Load services
    const servicesContainer = document.getElementById('printServices');
    servicesContainer.innerHTML = '';
    
    if (settings.services && settings.services.length > 0) {
        settings.services.forEach(service => {
            const serviceRow = document.createElement('div');
            serviceRow.className = 'row mb-2 print-service-row';
            serviceRow.innerHTML = `
                <div class="col-md-5">
                    <input type="text" class="form-control" value="${service.name}" placeholder="Service Name">
                </div>
                <div class="col-md-3">
                    <input type="number" class="form-control" value="${service.price}" placeholder="Base Price">
                </div>
                <div class="col-md-3">
                    <select class="form-select">
                        <option ${service.unit === 'Per Item' ? 'selected' : ''}>Per Item</option>
                        <option ${service.unit === 'Per Square Foot' ? 'selected' : ''}>Per Square Foot</option>
                        <option ${service.unit === 'Per Square Meter' ? 'selected' : ''}>Per Square Meter</option>
                        <option ${service.unit === 'Per Hour' ? 'selected' : ''}>Per Hour</option>
                    </select>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger remove-service">×</button>
                </div>
            `;
            servicesContainer.appendChild(serviceRow);
            
            // Add event listener to the remove button
            serviceRow.querySelector('.remove-service').addEventListener('click', function() {
                serviceRow.remove();
            });
        });
    } else {
        // Add a default empty row
        const serviceRow = document.createElement('div');
        serviceRow.className = 'row mb-2 print-service-row';
        serviceRow.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Service Name (e.g., Banner Printing)">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control" placeholder="Base Price">
            </div>
            <div class="col-md-3">
                <select class="form-select">
                    <option>Per Item</option>
                    <option>Per Square Foot</option>
                    <option>Per Square Meter</option>
                    <option>Per Hour</option>
                </select>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger remove-service">×</button>
            </div>
        `;
        servicesContainer.appendChild(serviceRow);
        
        // Add event listener to the remove button
        serviceRow.querySelector('.remove-service').addEventListener('click', function() {
            serviceRow.remove();
        });
    }
}

// Add this to your app.js file near the beginning

// Function to migrate existing clients to new structure with branches
function migrateClientsToNewStructure() {
    // Get existing clients
    const existingClients = JSON.parse(localStorage.getItem(CLIENTS_KEY)) || [];
    
    // Check if migration is needed (if first client doesn't have branches property)
    if (existingClients.length > 0 && !existingClients[0].hasOwnProperty('branches')) {
        console.log('Migrating clients to new structure with branches and print locations...');
        
        // Migrate each client to new structure
        const updatedClients = existingClients.map(client => {
            // Create a default branch with the existing location info
            const defaultBranch = {
                id: generateId(),
                name: "Main Branch",
                location: client.location || "",
                contactPerson: client.contactPerson || "",
                phone: client.phone || "",
                email: client.email || "",
                notes: "",
                printLocations: []
            };
            
            // Return updated client structure
            return {
                ...client,
                branches: [defaultBranch]
            };
        });
        
        // Save updated clients
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
        console.log('Client migration complete.');
        
        return updatedClients;
    }
    
    return existingClients;
}

// Call this function when the application starts
document.addEventListener('DOMContentLoaded', function() {
    // Existing code...
    
    // Migrate clients to new structure if needed
    clients = migrateClientsToNewStructure();
    
    // Continue with the rest of initialization...
});

document.addEventListener('DOMContentLoaded', function() {
    // Add button to manage clients page
    const clientsSection = document.getElementById('clients');
    if (clientsSection) {
        const header = clientsSection.querySelector('h2');
        if (header) {
            // Create a container for the buttons if not already present
            let buttonContainer = clientsSection.querySelector('.client-action-buttons');
            if (!buttonContainer) {
                buttonContainer = document.createElement('div');
                buttonContainer.className = 'client-action-buttons d-flex mb-3';
                header.parentNode.insertBefore(buttonContainer, header.nextSibling);
            }
            
            // Add the existing "Add Client" button to the container if it's not there
            const existingAddButton = clientsSection.querySelector('.btn-primary');
            if (existingAddButton && existingAddButton.parentNode !== buttonContainer) {
                buttonContainer.appendChild(existingAddButton);
            }
            
            // Create and add the "Manage Price Lists" button
            const priceListBtn = document.createElement('button');
            priceListBtn.className = 'btn btn-info ms-2';
            priceListBtn.innerHTML = '<i class="bi bi-tag"></i> Manage Price Lists';
            priceListBtn.addEventListener('click', function() {
                const modal = new bootstrap.Modal(document.getElementById('priceListModal'));
                modal.show();
            });
            
            buttonContainer.appendChild(priceListBtn);
        }
    }
    
    // Add a standalone Price Lists button in the sidebar (optional)
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const settingsLink = sidebar.querySelector('a[data-section="settings"]');
        if (settingsLink) {
            const priceListLink = document.createElement('a');
            priceListLink.href = '#';
            priceListLink.innerHTML = 'Price Lists';
            priceListLink.addEventListener('click', function(e) {
                e.preventDefault();
                const modal = new bootstrap.Modal(document.getElementById('priceListModal'));
                modal.show();
            });
            
            // Insert before settings
            sidebar.insertBefore(priceListLink, settingsLink);
        }
    }
});
// Function to clear stored data
function clearStoredData(dataType) {
    switch(dataType) {
        case 'clients':
            localStorage.removeItem(CLIENTS_KEY);
            clients = [];
            break;
        case 'orders':
            localStorage.removeItem(ORDERS_KEY);
            orders = [];
            break;
        case 'quotes':
            localStorage.removeItem(QUOTES_KEY);
            quotes = [];
            break;
        case 'invoices':
            localStorage.removeItem(INVOICES_KEY);
            invoices = [];
            break;
        case 'price-lists':
            localStorage.removeItem(PRICE_LISTS_KEY);
            priceLists = {};
            break;
        case 'settings':
            localStorage.removeItem(SETTINGS_KEY);
            settings = {
                businessName: 'My Print Shop',
                businessAddress: '',
                businessPhone: '',
                businessEmail: '',
                services: []
            };
            break;
        case 'all':
            localStorage.removeItem(CLIENTS_KEY);
            localStorage.removeItem(ORDERS_KEY);
            localStorage.removeItem(QUOTES_KEY);
            localStorage.removeItem(INVOICES_KEY);
            localStorage.removeItem(PRICE_LISTS_KEY);
            localStorage.removeItem(SETTINGS_KEY);
            
            clients = [];
            orders = [];
            quotes = [];
            invoices = [];
            priceLists = {};
            settings = {
                businessName: 'My Print Shop',
                businessAddress: '',
                businessPhone: '',
                businessEmail: '',
                services: []
            };
            break;
    }
    
    // Refresh UI
    updateDashboard();
    
    // Reload current section
    const activeSection = document.querySelector('.sidebar a.active');
    if (activeSection) {
        const sectionId = activeSection.getAttribute('data-section');
        if (sectionId === 'dashboard') {
            updateDashboard();
        } else if (sectionId === 'clients') {
            loadClientTable();
        } else if (sectionId === 'orders') {
            loadOrdersTable();
        } else if (sectionId === 'quotes') {
            loadQuotesTable();
        } else if (sectionId === 'invoices') {
            loadInvoicesTable();
        } else if (sectionId === 'settings') {
            loadSettings();
        }
    }
}

// Data management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            const dataType = document.getElementById('clearDataType').value;
            const dataName = document.getElementById('clearDataType').options[document.getElementById('clearDataType').selectedIndex].text;
            
            // Confirm deletion
            if (confirm(`Are you sure you want to clear all ${dataName}? This action cannot be undone.`)) {
                clearStoredData(dataType);
                alert(`${dataName} have been cleared.`);
            }
        });
    }
    
    // Export data button
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            const exportData = {
                clients: JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]'),
                orders: JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'),
                quotes: JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]'),
                invoices: JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]'),
                priceLists: JSON.parse(localStorage.getItem(PRICE_LISTS_KEY) || '{}'),
                settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = 'print_shop_data.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        });
    }
    
    // Import data button
    const importDataBtn = document.getElementById('importDataBtn');
    const importDataFile = document.getElementById('importDataFile');
    
    if (importDataBtn && importDataFile) {
        importDataBtn.addEventListener('click', function() {
            importDataFile.click();
        });
        
        importDataFile.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        
                        // Validate the data structure (basic validation)
                        if (importedData.clients && importedData.orders && 
                            importedData.quotes && importedData.invoices && 
                            importedData.priceLists && importedData.settings) {
                            
                            if (confirm('This will replace all your current data. Continue?')) {
                                // Store the imported data
                                localStorage.setItem(CLIENTS_KEY, JSON.stringify(importedData.clients || []));
                                localStorage.setItem(ORDERS_KEY, JSON.stringify(importedData.orders || []));
                                localStorage.setItem(QUOTES_KEY, JSON.stringify(importedData.quotes || []));
                                localStorage.setItem(INVOICES_KEY, JSON.stringify(importedData.invoices || []));
                                localStorage.setItem(PRICE_LISTS_KEY, JSON.stringify(importedData.priceLists || {}));
                                localStorage.setItem(SETTINGS_KEY, JSON.stringify(importedData.settings || {}));
                                
                                // Update the application state
                                clients = importedData.clients || [];
                                orders = importedData.orders || [];
                                quotes = importedData.quotes || [];
                                invoices = importedData.invoices || [];
                                priceLists = importedData.priceLists || {};
                                settings = importedData.settings || {};
                                
                                // Refresh UI
                                updateDashboard();
                                alert('Data imported successfully. The page will now reload.');
                                location.reload();
                            }
                        } else {
                            alert('Invalid data format. Please import a valid Print Shop backup file.');
                        }
                    } catch (err) {
                        console.error('Error importing data:', err);
                        alert('Error importing data. Please check the file format.');
                    }
                };
                
                reader.readAsText(file);
                
                // Reset the file input so the same file can be selected again
                this.value = '';
            }
        });
    }
});