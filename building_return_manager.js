// Building Return Manager - Unique ID Tracking System
const BuildingReturnManager = {
    modal: null,
    targetBuilding: null,
    hoveredBuilding: null,
    initialized: false,
    keyListener: null,
    modalKeyListener: null, // New: separate listener for modal keys
    
    // Initialize the building return system
    init() {
        if (this.initialized) return;
        
        this.createModal();
        this.setupKeyListener();
        this.clearReturnedBuildings(); // Clear on new game
        this.initialized = true;
    },
    
    // Clear returned buildings when new game starts
    clearReturnedBuildings() {
        localStorage.removeItem('lunarConquest_returnedBuildings');
        console.log('Cleared returned buildings for new game');
    },
    
    // Generate unique ID for a building
    generateBuildingId(building) {
        return `${building.x}_${building.y}_${building.cardData.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Mark building as returned
    markBuildingAsReturned(buildingId) {
        const returnedBuildings = this.getReturnedBuildings();
        returnedBuildings[buildingId] = true;
        localStorage.setItem('lunarConquest_returnedBuildings', JSON.stringify(returnedBuildings));
        console.log('Marked building as returned:', buildingId);
    },
    
    // Check if building has been returned
    isBuildingReturned(buildingId) {
        if (!buildingId) return false;
        const returnedBuildings = this.getReturnedBuildings();
        return returnedBuildings[buildingId] === true;
    },
    
    // Get all returned buildings
    getReturnedBuildings() {
        const stored = localStorage.getItem('lunarConquest_returnedBuildings');
        return stored ? JSON.parse(stored) : {};
    },
    
    // Create the modal HTML structure
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'buildingReturnModal';
        modal.className = 'building-return-modal';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <h4>Remove Building?</h4>
            <p id="buildingReturnDescription">Remove this building and return the card to your hand?</p>
            <div class="building-return-buttons">
                <button class="building-return-btn yes" id="confirmRemove">Yes (Y)</button>
                <button class="building-return-btn no" id="cancelRemove">No (N)</button>
            </div>
            <div style="text-align: center; margin-top: 8px; font-size: 11px; color: #888;">
                Press Y to confirm, N to cancel, or ESC to close
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        
        // Setup button event listeners
        document.getElementById('confirmRemove').addEventListener('click', () => this.confirmRemove());
        document.getElementById('cancelRemove').addEventListener('click', () => this.hideModal());
    },
    
    // Setup modal-specific keyboard listener
    setupModalKeyListener() {
        this.modalKeyListener = (e) => {
            // Only handle keys when modal is visible
            if (!this.modal || this.modal.style.display !== 'block') {
                return;
            }
            
            const key = e.key.toLowerCase();
            
            switch (key) {
                case 'y':
                    e.preventDefault();
                    this.confirmRemove();
                    break;
                case 'n':
                    e.preventDefault();
                    this.hideModal();
                    break;
                case 'escape':
                    e.preventDefault();
                    this.hideModal();
                    break;
                case 'enter':
                    // Enter key confirms (same as Y)
                    e.preventDefault();
                    this.confirmRemove();
                    break;
            }
        };
        
        document.addEventListener('keydown', this.modalKeyListener);
    },
    
    // Remove modal keyboard listener
    removeModalKeyListener() {
        if (this.modalKeyListener) {
            document.removeEventListener('keydown', this.modalKeyListener);
        }
    },
    
    // Setup global Ctrl+R listener
    setupKeyListener() {
        this.keyListener = (e) => {
            // Check for Ctrl+R 
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
                // Always prevent browser refresh when in game
                if (window.gameState && window.gameState.running) {
                    e.preventDefault();
                }
                
                if (this.hoveredBuilding && this.hoveredBuilding.owner === 1) {
                    // Check if this building has already been returned
                    if (this.isBuildingReturned(this.hoveredBuilding.uniqueId)) {
                        console.log('Building already returned:', this.hoveredBuilding.uniqueId);
                        this.showAlreadyReturnedMessage();
                        return;
                    }
                    
                    console.log('Showing return modal for building:', this.hoveredBuilding.uniqueId);
                    this.showBuildingReturnModal(this.hoveredBuilding, e);
                } else {
                    // No building selected or not hovering over player building
                    if (window.gameState && window.gameState.running) {
                        this.showNoBuildingSelectedMessage();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', this.keyListener);
        
        // Setup modal keyboard listener
        this.setupModalKeyListener();
    },
    
    // This function will be called FROM ui_manager.js for each building
    addBuildingReturnListeners(buildingElement, building) {
        // Only add listeners to player 1 buildings (human player)
        if (building.owner !== 1) {
            return; // Skip AI buildings silently
        }
        
        // Generate unique ID if it doesn't exist
        if (!building.uniqueId) {
            building.uniqueId = this.generateBuildingId(building);
            console.log('Generated unique ID for building:', building.uniqueId, building.cardData ? building.cardData.name : 'unknown');
        }
        
        // Add hover listeners to track which building we're over
        buildingElement.addEventListener('mouseenter', () => {
            this.hoveredBuilding = building;
            console.log('Hovering over building:', building.uniqueId, 'Returned?', this.isBuildingReturned(building.uniqueId));
        });
        
        buildingElement.addEventListener('mouseleave', () => {
            this.hoveredBuilding = null;
        });
        
        // Add listeners to all child elements too (for the images)
        const allChildren = buildingElement.querySelectorAll('*');
        allChildren.forEach(child => {
            child.addEventListener('mouseenter', () => {
                this.hoveredBuilding = building;
            });
            
            child.addEventListener('mouseleave', (e) => {
                // Only clear if we're actually leaving the building area
                if (!buildingElement.contains(e.relatedTarget)) {
                    this.hoveredBuilding = null;
                }
            });
        });
    },
    
    // Modify the existing tooltip to show return instruction
    enhanceTooltip(tooltipElement, building) {
        if (building.owner !== 1) {
            return; // Only add instruction for player buildings
        }
        
        // Check if building has been returned
        const hasBeenReturned = this.isBuildingReturned(building.uniqueId);
        
        // Remove any existing return instruction first
        const existingInstruction = tooltipElement.querySelector('.return-instruction');
        if (existingInstruction) {
            existingInstruction.remove();
        }
        
        // Add return instruction to player buildings
        const returnInstruction = document.createElement('div');
        returnInstruction.className = 'return-instruction';
        returnInstruction.style.borderTop = '1px solid #00ffff';
        returnInstruction.style.marginTop = '4px';
        returnInstruction.style.paddingTop = '4px';
        returnInstruction.style.fontSize = '10px';
        returnInstruction.style.textAlign = 'center';
        returnInstruction.style.fontWeight = 'bold';
        
        if (hasBeenReturned) {
            returnInstruction.style.color = '#888888';
            returnInstruction.innerHTML = '✓ Already returned to hand';
        } else {
            returnInstruction.style.color = '#ffff00';
            returnInstruction.innerHTML = '🔄 <strong>Ctrl+R</strong> to return to hand';
        }
        
        // Find the tooltip content area (the div with p-2 class)
        const tooltipContent = tooltipElement.querySelector('.p-2') || tooltipElement;
        tooltipContent.appendChild(returnInstruction);
    },
    
    // Show building return modal
    showBuildingReturnModal(building, event) {
        this.targetBuilding = building;
        
        // Update modal content
        const description = document.getElementById('buildingReturnDescription');
        const buildingName = building.cardData ? building.cardData.name : 'Building';
        const buildingEmoji = building.cardData ? building.cardData.emoji : '🏢';
        description.innerHTML = `Remove <strong>${buildingEmoji} ${buildingName}</strong> and return the card to your hand?`;
        
        // Position modal in center of screen
        this.modal.style.left = '50%';
        this.modal.style.top = '50%';
        this.modal.style.transform = 'translate(-50%, -50%)';
        this.modal.style.display = 'block';
        
        // Focus on the modal for keyboard accessibility
        this.modal.focus();
        
        console.log('Modal shown - Press Y to confirm, N to cancel');
    },
    
    // Show no building selected message
    showNoBuildingSelectedMessage() {
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.top = '50px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.background = 'rgba(0, 17, 34, 0.95)';
        message.style.border = '2px solid #00ffff';
        message.style.borderRadius = '6px';
        message.style.color = '#00ffff';
        message.style.padding = '8px 16px';
        message.style.fontSize = '12px';
        message.style.zIndex = '2001';
        message.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6)';
        message.innerHTML = '🏠 Hover over a building first, then press Ctrl+R to return it to hand';
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 2500);
    },
    
    // Show already returned message
    showAlreadyReturnedMessage() {
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.top = '50px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.background = 'rgba(139, 69, 19, 0.95)';
        message.style.border = '2px solid #orange';
        message.style.borderRadius = '6px';
        message.style.color = '#ffffff';
        message.style.padding = '8px 16px';
        message.style.fontSize = '12px';
        message.style.zIndex = '2001';
        message.style.boxShadow = '0 0 15px rgba(255, 165, 0, 0.6)';
        message.innerHTML = '⚠️ Building already returned to hand!';
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 1500);
    },
    
    // Hide the modal
    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.style.transform = '';
        }
        this.targetBuilding = null;
        
        console.log('Modal hidden');
    },
    
    // Confirm removal of the building
    confirmRemove() {
        if (!this.targetBuilding) return;
        
        const building = this.targetBuilding;
        const player = window.gameState.players[0]; // Player 1 is at index 0
        
        // Check if already returned (double-check)
        if (this.isBuildingReturned(building.uniqueId)) {
            console.log('Building already returned, ignoring confirm');
            this.hideModal();
            return;
        }
        
        console.log('Removing building:', building.uniqueId);
        
        // Mark building as returned FIRST
        this.markBuildingAsReturned(building.uniqueId);
        
        // Return card to player's hand
        if (building.cardData) {
            player.hand.push({...building.cardData});
            console.log(`Returned ${building.cardData.name} to hand`);
        }
        
        // Remove building from game state
        const buildingIndex = window.gameState.buildings.indexOf(building);
        if (buildingIndex !== -1) {
            window.gameState.buildings.splice(buildingIndex, 1);
        }
        
        // Clear territory
        if (window.gameState.grid[building.y]) {
            window.gameState.grid[building.y][building.x] = 0;
        }
        
        // Clear hover state
        this.hoveredBuilding = null;
        
        // Update UI
        if (window.UIManager) {
            window.UIManager.updateGrid();
            window.UIManager.updateHandDisplay();
            window.UIManager.updateUI();
        }
        
        this.hideModal();
        this.showConfirmationMessage(building);
    },
    
    // Show confirmation message
    showConfirmationMessage(building) {
        const message = document.createElement('div');
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.background = 'rgba(0, 17, 34, 0.95)';
        message.style.border = '2px solid #00ffff';
        message.style.borderRadius = '6px';
        message.style.color = '#00ffff';
        message.style.padding = '8px 16px';
        message.style.fontSize = '12px';
        message.style.zIndex = '2001';
        message.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.6)';
        message.style.animation = 'confirmation-fade 2s ease-out';
        
        const buildingName = building.cardData ? building.cardData.name : 'Building';
        const buildingEmoji = building.cardData ? building.cardData.emoji : '🏢';
        message.innerHTML = `${buildingEmoji} <strong>${buildingName}</strong> returned to hand`;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 2000);
    }
};

// Add CSS animations
const returnEffectStyle = document.createElement('style');
returnEffectStyle.textContent = `
    @keyframes confirmation-fade {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(returnEffectStyle);

// Initialize
setTimeout(() => BuildingReturnManager.init(), 1000);

// Export for global access
window.BuildingReturnManager = BuildingReturnManager;