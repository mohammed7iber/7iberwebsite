// Enhanced Client Management with Branches and Print Locations

// Load client table with enhanced structure
function loadClientTable() {
    const tableBody = document.getElementById('clientTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Check if we need to migrate old client structure
    if (clients.length > 0 && !clients[0].branches) {
        clients = migrateClientsToNewStructure();
    }
    
    clients.forEach(client => {
        const tr = document.createElement('tr');
        const branchCount = client.branches ? client.branches.length : 0;
        const locationCount = client.branches ? 
            client.branches.reduce((total, branch) => 
                total + (branch.printLocations ? branch.printLocations.length : 0), 0) : 0;
                
        tr.innerHTML = `
            <td>${client.name}</td>
            <td>${client.contactPerson || 'N/A'}</td>
            <td>${client.email || 'N/A'}</td>
            <td>${client.phone || 'N/A'}</td>
            <td>${branchCount} branches, ${locationCount} locations</td>
            <td>
                <button class="btn btn-sm btn-primary edit-client" data-id="${client.id}">Edit</button>
                <button class="btn btn-sm btn-info view-client" data-id="${client.id}">View</button>
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
    
    document.querySelectorAll('.view-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-id');
            viewClient(clientId);
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

// Modified edit client function to handle branches
function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Set basic client info
    document.getElementById('clientName').value = client.name;
    document.getElementById('contactPerson').value = client.contactPerson || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientNotes').value = client.notes || '';
    
    // Clear branches list
    const branchesList = document.getElementById('branchesList');
    branchesList.innerHTML = '';
    
    // Add branches if any
    if (client.branches && client.branches.length > 0) {
        client.branches.forEach(branch => {
            addBranchToUI(branch);
        });
    } else {
        // Add default message if no branches
        branchesList.innerHTML = '<div class="alert alert-info">Add your first branch using the button above.</div>';
    }
    
    // Set the client ID on the form for update
    document.getElementById('addClientForm').setAttribute('data-id', clientId);
    
    // Initialize branch management functionality
    initBranchManagement();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addClientModal'));
    modal.show();
}

// Modified view client function to show branches
function viewClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Create client card for viewing
    let branchesHtml = '';
    
    if (client.branches && client.branches.length > 0) {
        client.branches.forEach(branch => {
            let locationsHtml = '';
            
            if (branch.printLocations && branch.printLocations.length > 0) {
                branch.printLocations.forEach(location => {
                    locationsHtml += `
                        <div class="ps-4 mb-2">
                            <strong>${location.name}</strong> - ${location.description || ''}
                            <br>
                            <small>
                                Inner: ${formatDimensions(location.dimensions ? location.dimensions.innerWidth : 0, 
                                                        location.dimensions ? location.dimensions.innerHeight : 0, 
                                                        location.dimensions ? location.dimensions.innerDepth : 0, 
                                                        location.dimensions ? location.dimensions.widthUnit : 'in')}
                                | Outer: ${formatDimensions(location.dimensions ? location.dimensions.outerWidth : 0, 
                                                          location.dimensions ? location.dimensions.outerHeight : 0, 
                                                          location.dimensions ? location.dimensions.outerDepth : 0, 
                                                          location.dimensions ? location.dimensions.widthUnit : 'in')}
                            </small>
                        </div>
                    `;
                });
            } else {
                locationsHtml = '<div class="ps-4"><em>No print locations</em></div>';
            }
            
            branchesHtml += `
                <div class="mb-3">
                    <h6>${branch.name}</h6>
                    <div class="ps-3">
                        <p class="mb-1">
                            <strong>Location:</strong> ${branch.location || 'N/A'}<br>
                            <strong>Contact:</strong> ${branch.contactPerson || 'N/A'}<br>
                            <strong>Phone:</strong> ${branch.phone || 'N/A'}<br>
                            <strong>Email:</strong> ${branch.email || 'N/A'}
                        </p>
                        <p class="mb-1"><strong>Print Locations:</strong></p>
                        ${locationsHtml}
                    </div>
                </div>
            `;
        });
            // When creating the locations HTML, include material:
    if (branch.printLocations && branch.printLocations.length > 0) {
        branch.printLocations.forEach(location => {
            const materialText = location.material || 'Not specified';
                
            locationsHtml += `
                <div class="ps-4 mb-2">
                    <strong>${location.name}</strong> - ${location.description || ''}
                    <br>
                    <small>
                        Inner: ${formatDimensions(/*...*/)}
                        | Outer: ${formatDimensions(/*...*/)}
                        <br>
                        <strong>Material:</strong> ${materialText}
                    </small>
                </div>
            `;
        });
    }
    } else {
        branchesHtml = '<p><em>No branches added</em></p>';
    }
    
    const modalContent = `
        <div class="modal" tabindex="-1" id="viewClientModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Client Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5>${client.name}</h5>
                                <p>
                                    <strong>Contact:</strong> ${client.contactPerson || 'N/A'}<br>
                                    <strong>Email:</strong> ${client.email || 'N/A'}<br>
                                    <strong>Phone:</strong> ${client.phone || 'N/A'}
                                </p>
                                ${client.notes ? `<p><strong>Notes:</strong> ${client.notes}</p>` : ''}
                            </div>
                            <div class="col-md-6 text-end">
                                <button class="btn btn-sm btn-primary edit-this-client" data-id="${client.id}">Edit Client</button>
                            </div>
                        </div>
                        
                        <h5 class="border-top pt-3">Branches</h5>
                        ${branchesHtml}
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
    const modal = new bootstrap.Modal(document.getElementById('viewClientModal'));
    modal.show();
    
    // Add event listener to edit button
    document.querySelector('.edit-this-client').addEventListener('click', function() {
        modal.hide();
        // Remove the modal from DOM after hidden
        document.getElementById('viewClientModal').addEventListener('hidden.bs.modal', function() {
            document.body.removeChild(modalDiv);
        });
        // Edit the client
        editClient(client.id);
    });
    
    // Remove the modal from DOM when closed
    document.getElementById('viewClientModal').addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modalDiv);
    });
}

// Delete client with confirmation
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

// Helper function to format dimensions
function formatDimensions(width, height, depth, unit) {
    return `${width || 0} × ${height || 0} × ${depth || 0} ${unit || 'in'}`;
}

// Initialize branch management
function initBranchManagement() {
    // Add Branch button
    const addBranchBtn = document.getElementById('addBranchBtn');
    if (addBranchBtn) {
        addBranchBtn.addEventListener('click', function() {
            // Show branch edit modal with empty fields
            document.getElementById('branchId').value = '';
            document.getElementById('branchName').value = '';
            document.getElementById('branchLocation').value = '';
            document.getElementById('branchContact').value = '';
            document.getElementById('branchPhone').value = '';
            document.getElementById('branchEmail').value = '';
            document.getElementById('branchNotes').value = '';
            
            const modal = new bootstrap.Modal(document.getElementById('editBranchModal'));
            modal.show();
        });
    }
    
    // Save Branch button
    const saveBranchBtn = document.getElementById('saveBranchBtn');
    if (saveBranchBtn) {
        saveBranchBtn.addEventListener('click', function() {
            const branchId = document.getElementById('branchId').value || generateId();
            const branchData = {
                id: branchId,
                name: document.getElementById('branchName').value,
                location: document.getElementById('branchLocation').value,
                contactPerson: document.getElementById('branchContact').value,
                phone: document.getElementById('branchPhone').value,
                email: document.getElementById('branchEmail').value,
                notes: document.getElementById('branchNotes').value,
                printLocations: []
            };
            
            // Check if we're editing an existing branch
            const existingBranchElement = document.querySelector(`.branch-item[data-branch-id="${branchId}"]`);
            
            if (existingBranchElement) {
                // Update existing branch UI
                existingBranchElement.querySelector('.branch-name').textContent = branchData.name;
                existingBranchElement.querySelector('.branch-location').textContent = branchData.location;
                existingBranchElement.querySelector('.branch-contact').textContent = branchData.contactPerson;
                
                // Preserve print locations
                const clientId = document.getElementById('addClientForm').getAttribute('data-id');
                if (clientId) {
                    const client = clients.find(c => c.id === clientId);
                    if (client && client.branches) {
                        const existingBranch = client.branches.find(b => b.id === branchId);
                        if (existingBranch) {
                            branchData.printLocations = existingBranch.printLocations || [];
                        }
                    }
                }
            } else {
                // Add new branch to UI
                addBranchToUI(branchData);
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editBranchModal'));
            modal.hide();
        });
    }
    
    // Initialize print location management
    initPrintLocationManagement();
}

// Add a branch to the UI
function addBranchToUI(branchData) {
    const branchesList = document.getElementById('branchesList');
    if (!branchesList) return;
    
    // Clear initial message if present
    const infoMessage = branchesList.querySelector('.alert-info');
    if (infoMessage) {
        infoMessage.remove();
    }
    
    // Clone the template
    const template = document.getElementById('branchTemplate');
    if (!template) return;
    
    const branchElement = template.content.cloneNode(true).querySelector('.branch-item');
    
    // Set branch data
    branchElement.setAttribute('data-branch-id', branchData.id);
    branchElement.querySelector('.branch-name').textContent = branchData.name;
    branchElement.querySelector('.branch-location').textContent = branchData.location;
    branchElement.querySelector('.branch-contact').textContent = branchData.contactPerson;
    
    // Update print locations count
    const locationsCount = branchData.printLocations ? branchData.printLocations.length : 0;
    branchElement.querySelector('.print-locations-count').textContent = locationsCount;
    
    // Add event listeners
    branchElement.querySelector('.edit-branch-btn').addEventListener('click', function() {
        editBranch(branchData.id);
    });
    
    branchElement.querySelector('.remove-branch-btn').addEventListener('click', function() {
        removeBranch(branchData.id);
    });
    
    branchElement.querySelector('.add-print-location-btn').addEventListener('click', function() {
        addPrintLocation(branchData.id);
    });
    
    // Add print locations if any
    if (branchData.printLocations && branchData.printLocations.length > 0) {
        const locationsContainer = branchElement.querySelector('.print-locations-list');
        branchData.printLocations.forEach(location => {
            addPrintLocationToUI(locationsContainer, location, branchData.id);
        });
    }
    
    // Add to the UI
    branchesList.appendChild(branchElement);
}

// Edit an existing branch
function editBranch(branchId) {
    const clientId = document.getElementById('addClientForm').getAttribute('data-id');
    let branchData = null;
    
    // Find branch data either from UI for new branches or from data for existing clients
    if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if (client && client.branches) {
            branchData = client.branches.find(b => b.id === branchId);
        }
    }
    
    if (!branchData) {
        // This is a new branch in the current form
        const branchElement = document.querySelector(`.branch-item[data-branch-id="${branchId}"]`);
        if (branchElement) {
            branchData = {
                id: branchId,
                name: branchElement.querySelector('.branch-name').textContent,
                location: branchElement.querySelector('.branch-location').textContent,
                contactPerson: branchElement.querySelector('.branch-contact').textContent,
                phone: '',
                email: '',
                notes: ''
            };
        }
    }
    
    if (branchData) {
        // Populate form
        document.getElementById('branchId').value = branchData.id;
        document.getElementById('branchName').value = branchData.name;
        document.getElementById('branchLocation').value = branchData.location;
        document.getElementById('branchContact').value = branchData.contactPerson;
        document.getElementById('branchPhone').value = branchData.phone || '';
        document.getElementById('branchEmail').value = branchData.email || '';
        document.getElementById('branchNotes').value = branchData.notes || '';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editBranchModal'));
        modal.show();
    }
}

// Remove a branch
function removeBranch(branchId) {
    if (confirm('Are you sure you want to remove this branch? All print locations for this branch will also be removed.')) {
        const branchElement = document.querySelector(`.branch-item[data-branch-id="${branchId}"]`);
        if (branchElement)
            if (branchElement) {
                branchElement.remove();
            }
        }
    }
    
    // Modified Save Client function to handle branches
    document.getElementById('saveClientBtn').addEventListener('click', function() {
        const clientForm = document.getElementById('addClientForm');
        const clientId = clientForm.getAttribute('data-id');
        
        // Gather branches data from UI
        const branches = [];
        document.querySelectorAll('.branch-item').forEach(branchElement => {
            const branchId = branchElement.getAttribute('data-branch-id');

            console.log(`Checking print locations for branch ${branchId}`);

            // Create branch object
            const branch = {
                id: branchId,
                name: branchElement.querySelector('.branch-name').textContent,
                location: branchElement.querySelector('.branch-location').textContent,
                contactPerson: branchElement.querySelector('.branch-contact').textContent,
                phone: '', // Will be populated if editing existing branch
                email: '', // Will be populated if editing existing branch  
                notes: '', // Will be populated if editing existing branch
                printLocations: [] // Will be populated if editing existing branch
            };
            
            // If editing an existing client, get the full branch data
            if (clientId) {
                const client = clients.find(c => c.id === clientId);
                if (client && client.branches) {
                    const existingBranch = client.branches.find(b => b.id === branchId);
                    if (existingBranch) {
                        branch.phone = existingBranch.phone || '';
                        branch.email = existingBranch.email || '';  
                        branch.notes = existingBranch.notes || '';
                        branch.printLocations = existingBranch.printLocations || [];
                    }
                }
            }
            
            // Get print locations from UI
            const printLocationsContainer = branchElement.querySelector('.print-locations-list');
            const locationElements = printLocationsContainer.querySelectorAll('.print-location-item');
            
            // If new locations were added in this session, collect them
            locationElements.forEach(locationElement => {
                const locationId = locationElement.getAttribute('data-location-id');
                
                // Check if location already exists in branch data
                const existingLocationIndex = branch.printLocations.findIndex(loc => loc.id === locationId);
                
                if (existingLocationIndex === -1) {
                    // This is a new location added in the current session
                    const locationName = locationElement.querySelector('.location-name').textContent;
                    const locationDesc = locationElement.querySelector('.location-description').textContent;
                    const innerDimensionsText = locationElement.querySelector('.inner-dimensions').textContent;
                    const outerDimensionsText = locationElement.querySelector('.outer-dimensions').textContent;
                    const imageElement = locationElement.querySelector('.location-image');
                    const imageUrl = imageElement.style.display !== 'none' ? imageElement.src : '';
                    
                    // Parse dimensions (basic parsing)
                    const innerParts = innerDimensionsText.split('×').map(part => parseFloat(part.trim()));
                    const outerParts = outerDimensionsText.split('×').map(part => parseFloat(part.trim()));
                    
                    // Extract unit from dimension text
                    const unitMatch = innerDimensionsText.match(/[a-z]+$/i);
                    const unit = unitMatch ? unitMatch[0] : 'in';
                    
                    const newLocation = {
                        id: locationId,
                        name: locationName,
                        description: locationDesc === 'No description' ? '' : locationDesc,
                        notes: '',
                        dimensions: {
                            innerWidth: innerParts[0] || 0,
                            innerHeight: innerParts[1] || 0,
                            innerDepth: innerParts[2] || 0,
                            outerWidth: outerParts[0] || 0,
                            outerHeight: outerParts[1] || 0,
                            outerDepth: outerParts[2] || 0,
                            widthUnit: unit,
                            heightUnit: unit,
                            depthUnit: unit
                        },
                        imageUrl: imageUrl
                    };
                    
                    branch.printLocations.push(newLocation);
                }
            });
            
            branches.push(branch);
        });
        
        // Create client object
        const client = {
            id: clientId || generateId(),
            name: document.getElementById('clientName').value,
            contactPerson: document.getElementById('contactPerson').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            notes: document.getElementById('clientNotes').value,
            branches: branches,
            createdAt: clientId ? (clients.find(c => c.id === clientId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
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
        clientForm.reset();
        document.getElementById('branchesList').innerHTML = '<div class="alert alert-info">Add your first branch using the button above.</div>';
        if (clientForm.hasAttribute('data-id')) {
            clientForm.removeAttribute('data-id');
        }
        
        // Refresh table
        loadClientTable();
        updateDashboard();
    });
    
    // Initialize print location management
    function initPrintLocationManagement() {
        // Save print location button
        const savePrintLocationBtn = document.getElementById('savePrintLocationBtn');
        if (savePrintLocationBtn) {
            savePrintLocationBtn.addEventListener('click', function() {
                const locationId = document.getElementById('printLocationId').value || generateId();
                const branchId = document.getElementById('printLocationBranchId').value;
                
                // Get image data if uploaded
                let imageUrl = '';
                const imagePreview = document.getElementById('imagePreview');
                if (imagePreview && !document.getElementById('imagePreviewContainer').classList.contains('d-none')) {
                    imageUrl = imagePreview.src;
                }
                
                // Get selected material and log it for debugging
                let material = document.getElementById('printLocationMaterial').value;
                console.log("Selected material:", material);
                
                if (material === 'Other') {
                    // Use the specified other material
                    const otherMaterial = document.getElementById('otherMaterialText').value.trim();
                    if (otherMaterial) {
                        material = otherMaterial;
                        console.log("Using other material:", material);
                    }
                }
                
                // Create location data object (include material)
                const locationData = {
                    id: locationId,
                    name: document.getElementById('printLocationName').value,
                    description: document.getElementById('printLocationDescription').value,
                    notes: document.getElementById('printLocationNotes').value,
                    dimensions: {
                        innerWidth: parseFloat(document.getElementById('innerWidth').value) || 0,
                        innerHeight: parseFloat(document.getElementById('innerHeight').value) || 0,
                        innerDepth: parseFloat(document.getElementById('innerDepth').value) || 0,
                        outerWidth: parseFloat(document.getElementById('outerWidth').value) || 0,
                        outerHeight: parseFloat(document.getElementById('outerHeight').value) || 0,
                        outerDepth: parseFloat(document.getElementById('outerDepth').value) || 0,
                        widthUnit: document.getElementById('widthUnit').value,
                        heightUnit: document.getElementById('heightUnit').value,
                        depthUnit: document.getElementById('depthUnit').value
                    },
                    material: material, // Add single material to the object
                    imageUrl: imageUrl
                };
                
                console.log("Location data being saved:", locationData);
      
                
            // Find the branch container to add the location
            const branchElement = document.querySelector(`.branch-item[data-branch-id="${branchId}"]`);
            if (branchElement) {
                const printLocationsContainer = branchElement.querySelector('.print-locations-list');
                
                // Check if we're editing an existing location
                const existingLocationElement = printLocationsContainer.querySelector(`.print-location-item[data-location-id="${locationId}"]`);
                
                if (existingLocationElement) {
                    // Update existing location
                    updatePrintLocationUI(existingLocationElement, locationData);
                } else {
                    // Add new location
                    addPrintLocationToUI(printLocationsContainer, locationData, branchId);
                }
                
                // Update location count in branch card
                const countElement = branchElement.querySelector('.print-locations-count');
                countElement.textContent = printLocationsContainer.querySelectorAll('.print-location-item').length;
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('printLocationModal'));
            modal.hide();
            
            // Reset form
            document.getElementById('printLocationForm').reset();
            document.getElementById('imagePreviewContainer').classList.add('d-none');
            document.getElementById('printLocationId').value = '';
            document.getElementById('printLocationBranchId').value = '';
        });
    }
        
        // Image handling for print location
        const printLocationImage = document.getElementById('printLocationImage');
        if (printLocationImage) {
            printLocationImage.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const preview = document.getElementById('imagePreview');
                        preview.src = e.target.result;
                        document.getElementById('imagePreviewContainer').classList.remove('d-none');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Remove image button
        const removeImageBtn = document.getElementById('removeImageBtn');
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', function() {
                document.getElementById('printLocationImage').value = '';
                document.getElementById('imagePreviewContainer').classList.add('d-none');
            });
        }
    }
    
    // Add print location - shows the modal to add a new print location
    function addPrintLocation(branchId) {
        // Reset form
        document.getElementById('printLocationForm').reset();
        document.getElementById('imagePreviewContainer').classList.add('d-none');
        
        // Set branch ID
        document.getElementById('printLocationId').value = '';
        document.getElementById('printLocationBranchId').value = branchId;
        
        // Set default unit selections
        document.getElementById('widthUnit').value = 'in';
        document.getElementById('heightUnit').value = 'in';
        document.getElementById('depthUnit').value = 'in';
        document.getElementById('outerWidthUnit').value = 'in';
        document.getElementById('outerHeightUnit').value = 'in';
        document.getElementById('outerDepthUnit').value = 'in';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('printLocationModal'));
        modal.show();
    }
    
    // Add a print location to the UI
    function addPrintLocationToUI(container, locationData, branchId) {
        if (!container) return;
        
        // Clone the template
        const template = document.getElementById('printLocationTemplate');
        if (!template) return;
        
        const locationElement = template.content.cloneNode(true).querySelector('.print-location-item');
        
        // Update the UI with location data
        updatePrintLocationUI(locationElement, locationData);
        
        // Add event listeners
        locationElement.querySelector('.edit-location-btn').addEventListener('click', function() {
            editPrintLocation(locationData.id, branchId);
        });
        
        locationElement.querySelector('.remove-location-btn').addEventListener('click', function() {
            removePrintLocation(locationData.id, branchId);
        });
        
        // Add to the container
        container.appendChild(locationElement);
    }
    
    // Update a print location UI element with data
    function updatePrintLocationUI(locationElement, locationData) {
        // Set location data
        locationElement.setAttribute('data-location-id', locationData.id);
        locationElement.querySelector('.location-name').textContent = locationData.name;
        locationElement.querySelector('.location-description').textContent = locationData.description || 'No description';
        
        // Format dimensions
        const innerDimensions = `${locationData.dimensions.innerWidth || 0} × ${locationData.dimensions.innerHeight || 0} × ${locationData.dimensions.innerDepth || 0} ${locationData.dimensions.widthUnit || 'in'}`;
        const outerDimensions = `${locationData.dimensions.outerWidth || 0} × ${locationData.dimensions.outerHeight || 0} × ${locationData.dimensions.outerDepth || 0} ${locationData.dimensions.widthUnit || 'in'}`;
        
        locationElement.querySelector('.inner-dimensions').textContent = innerDimensions;
        locationElement.querySelector('.outer-dimensions').textContent = outerDimensions;
       
        // Update material
        const materialElement = locationElement.querySelector('.location-material');
        if (materialElement) {
            const materialText = locationData.material || 'Not specified';
            console.log(`Setting material text to: ${materialText}`);
            materialElement.textContent = materialText;
        }
        // Handle image
        const imageElement = locationElement.querySelector('.location-image');
        const noImageText = locationElement.querySelector('.no-image-text');
        
        if (locationData.imageUrl) {
            imageElement.src = locationData.imageUrl;
            imageElement.style.display = 'block';
            noImageText.style.display = 'none';
        } else {
            imageElement.style.display = 'none';
            noImageText.style.display = 'block';
        }
    }
    
    // Edit print location
    function editPrintLocation(locationId, branchId) {
        // Find the location data
        let locationData = null;
        
        // Try to find the location data in the client data
        const clientId = document.getElementById('addClientForm').getAttribute('data-id');
        if (clientId) {
            const client = clients.find(c => c.id === clientId);
            if (client && client.branches) {
                const branch = client.branches.find(b => b.id === branchId);
                if (branch) {
                    if (!branch.printLocations) branch.printLocations = [];
                    
                    // Update or add the location
                    const locationIndex = branch.printLocations.findIndex(loc => loc.id === locationId);
                    if (locationIndex !== -1) {
                        // Update existing location
                        branch.printLocations[locationIndex] = locationData;
                    } else {
                        // Add new location
                        branch.printLocations.push(locationData);
                    }
                    
                    console.log("Updated branch print locations:", branch.printLocations);
                }
            }
        }
        
        // If not found in client data (for new locations), try to extract from UI
        if (!locationData) {
            const branchElement = document.querySelector(`.branch-item[data-branch-id="${branchId}"]`);
            if (branchElement) {
                const locationElement = branchElement.querySelector(`.print-location-item[data-location-id="${locationId}"]`);
                if (locationElement) {
                    const descriptionText = locationElement.querySelector('.location-description').textContent;
                    const innerDimensionsText = locationElement.querySelector('.inner-dimensions').textContent;
                    const outerDimensionsText = locationElement.querySelector('.outer-dimensions').textContent;
                    
                    // Parse dimensions (basic parsing)
                    const innerParts = innerDimensionsText.split('×').map(part => parseFloat(part.trim()));
                    const outerParts = outerDimensionsText.split('×').map(part => parseFloat(part.trim()));
                    
                    // Extract unit from dimension text
                    const unitMatch = innerDimensionsText.match(/[a-z]+$/i);
                    const unit = unitMatch ? unitMatch[0] : 'in';
                    
                    locationData = {

                        id: locationId,
                        name: locationElement.querySelector('.location-name').textContent,
                        description: descriptionText === 'No description' ? '' : descriptionText,
                        notes: '',
                        dimensions: {
                            innerWidth: innerParts[0] || 0,
                            innerHeight: innerParts[1] || 0,
                            innerDepth: innerParts[2] || 0,
                            outerWidth: outerParts[0] || 0,
                            outerHeight: outerParts[1] || 0,
                            outerDepth: outerParts[2] || 0,
                            widthUnit: unit,
                            heightUnit: unit,
                            depthUnit: unit
                        },
                        material: material, // Add single material to the object
                        imageUrl: locationElement.querySelector('.location-image').style.display !== 'none' ? 
                            locationElement.querySelector('.location-image').src : ''
                    };
                }
            }
        }
        
        if (locationData) { 
            // Set the form fields
            document.getElementById('printLocationId').value = locationData.id;
            document.getElementById('printLocationBranchId').value = branchId;
            document.getElementById('printLocationName').value = locationData.name;
            document.getElementById('printLocationDescription').value = locationData.description || '';
            document.getElementById('printLocationNotes').value = locationData.notes || '';
            
            // Set material
            const materialSelect = document.getElementById('printLocationMaterial');
            const otherMaterialContainer = document.getElementById('otherMaterialContainer');
            const otherMaterialText = document.getElementById('otherMaterialText');
            
            if (materialSelect && locationData.material) {
                // Check if the material is in our predefined list
                const materialExists = Array.from(materialSelect.options).some(
                    option => option.value === locationData.material && option.value !== 'Other'
                );
                
                if (materialExists) {
                    materialSelect.value = locationData.material;
                    otherMaterialContainer.style.display = 'none';
                    otherMaterialText.value = '';
                } else {
                    // Material is not in predefined list, use "Other"
                    materialSelect.value = 'Other';
                    otherMaterialContainer.style.display = 'block';
                    otherMaterialText.value = locationData.material;
                }
            } else {
                // No material set
                materialSelect.value = '';
                otherMaterialContainer.style.display = 'none';
                otherMaterialText.value = '';
            }               
            // Set dimensions
            document.getElementById('innerWidth').value = locationData.dimensions.innerWidth || '';
            document.getElementById('innerHeight').value = locationData.dimensions.innerHeight || '';
            document.getElementById('innerDepth').value = locationData.dimensions.innerDepth || '';
            document.getElementById('outerWidth').value = locationData.dimensions.outerWidth || '';
            document.getElementById('outerHeight').value = locationData.dimensions.outerHeight || '';
            document.getElementById('outerDepth').value = locationData.dimensions.outerDepth || '';
            
            // Set units
            document.getElementById('widthUnit').value = locationData.dimensions.widthUnit || 'in';
            document.getElementById('heightUnit').value = locationData.dimensions.heightUnit || 'in';
            document.getElementById('depthUnit').value = locationData.dimensions.depthUnit || 'in';
            document.getElementById('outerWidthUnit').value = locationData.dimensions.widthUnit || 'in';
            document.getElementById('outerHeightUnit').value = locationData.dimensions.heightUnit || 'in';
            document.getElementById('outerDepthUnit').value = locationData.dimensions.depthUnit || 'in';
            
            // Set image if exists
            if (locationData.imageUrl) {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.src = locationData.imageUrl;
                document.getElementById('imagePreviewContainer').classList.remove('d-none');
            } else {
                document.getElementById('imagePreviewContainer').classList.add('d-none');
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('printLocationModal'));
            modal.show();
        }
    }
    
    // Remove print location
    function removePrintLocation(locationId, branchId) {
        if (confirm('Are you sure you want to remove this print location?')) {
            const branchElement = document.querySelector(`.branch-item[data-branch-id="${branchId}"]`);
            if (branchElement) {
                const locationElement = branchElement.querySelector(`.print-location-item[data-location-id="${locationId}"]`);
                if (locationElement) {
                    locationElement.remove();
                    
                    // Update location count
                    const countElement = branchElement.querySelector('.print-locations-count');
                    const locationsContainer = branchElement.querySelector('.print-locations-list');
                    countElement.textContent = locationsContainer.querySelectorAll('.print-location-item').length;
                }
            }
        }
    }
    
    // Populate client dropdowns in forms (for orders, quotes, invoices)
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
    
    // Initialize material selection dropdown for print locations
function initMaterialSelection() {
    // Handle the "Other" material option
    const materialSelect = document.getElementById('printLocationMaterial');
    const otherMaterialContainer = document.getElementById('otherMaterialContainer');
    
    if (materialSelect && otherMaterialContainer) {
        materialSelect.addEventListener('change', function() {
            otherMaterialContainer.style.display = this.value === 'Other' ? 'block' : 'none';
        });
    }
}

// Call this when initializing print location management
document.addEventListener('DOMContentLoaded', function() {
    // Initialize other components
    
    // Add material selection initialization
    const printLocationModal = document.getElementById('printLocationModal');
    if (printLocationModal) {
        printLocationModal.addEventListener('shown.bs.modal', function() {
            initMaterialSelection();
        });
    }
});

    // Add event listeners when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize client modals and branch management
        const addClientModal = document.getElementById('addClientModal');
        if (addClientModal) {
            addClientModal.addEventListener('shown.bs.modal', function() {
                initBranchManagement();
            });
        }
    });