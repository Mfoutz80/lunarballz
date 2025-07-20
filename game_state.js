// Game State Management
const GameState = {
    GRID_SIZE: 28,
    CELL_SIZE: 30, // Changed from 20 to 30 (50% larger)
    GAME_TIME: 240, // 4 minutes in seconds
    DECK_SIZE: 12,
    MIN_CARDS: 14, // Minimum cards needed to play
    HAND_SIZE: 4,
    OBSTACLE_PERCENTAGE: 0.30, // 50% of the map
    OBSTACLE_FORMATIONS: 1, // Number of obstacle formations
    MAX_FORMATION_SIZE: 0.30, // Maximum 25% of board size per formation

// Initialize game state
    createInitialState() {
        return {
            running: false,
            timeLeft: this.GAME_TIME,
            taxRate: 0,
            players: [
                { id: 1, color: 'territory-1', territory: 1, coins: 10, balls: 3, hp: 100, castle: {x: 3, y: 3}, deck: [], hand: [], snareUseCount: 0 },
                { id: 2, color: 'territory-2', territory: 1, coins: 100, balls: 3, hp: 100, castle: {x: 24, y: 3}, deck: [], hand: [], snareUseCount: 0 },
                { id: 3, color: 'territory-3', territory: 1, coins: 100, balls: 3, hp: 100, castle: {x: 3, y: 24}, deck: [], hand: [], snareUseCount: 0 },
                { id: 4, color: 'territory-4', territory: 1, coins: 10, balls: 3, hp: 100, castle: {x: 24, y: 24}, deck: [], hand: [], snareUseCount: 0 }
            ],
            grid: [],
            balls: [],
            buildings: [],
            missiles: [], // New: array to store missiles
            obstacleFormations: [], // New: array to store obstacle formations with block types
            selectedCard: null,
            playerDeck: [],
            playerHand: [],
            deckBuilding: {
                currentDeck: [],
                cardSelection: [],
                isBuilding: false
            }
        };
    },

    // Initialize grid with obstacles
    initGrid() {
        window.gameState.grid = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(0));
        
        // Place player castles first
        window.gameState.players.forEach(player => {
            const {x, y} = player.castle;
            window.gameState.grid[y][x] = player.id;
        });
        
        // Generate obstacle formations with block textures
        this.generateSlimeBlockFormations();
    },

    // Generate slime block formations with proper border/corner detection
    generateSlimeBlockFormations() {
        window.gameState.obstacleFormations = [];
        const totalCells = this.GRID_SIZE * this.GRID_SIZE;
        const maxFormationCells = Math.floor(totalCells * this.MAX_FORMATION_SIZE);
        
        for (let i = 0; i < this.OBSTACLE_FORMATIONS; i++) {
            const formation = this.createSlimeBlockFormation(maxFormationCells);
            
            if (formation.cells.length > 0) {
                // Assign block types based on position in formation
                this.assignSlimeBlockTypes(formation);
                window.gameState.obstacleFormations.push(formation);
                
                // Mark cells in grid as obstacles
                formation.cells.forEach(cell => {
                    window.gameState.grid[cell.y][cell.x] = -1;
                });
            }
        }
    },

    // Create a slime block formation
    createSlimeBlockFormation(maxCells) {
        const formation = {
            type: 'slime_blocks',
            cells: [],
            centerX: 0,
            centerY: 0
        };
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            // Try to find a good starting position
            const startX = Math.floor(Math.random() * (this.GRID_SIZE - 10)) + 5;
            const startY = Math.floor(Math.random() * (this.GRID_SIZE - 10)) + 5;
            
            if (this.isValidFormationStart(startX, startY)) {
                formation.centerX = startX;
                formation.centerY = startY;
                formation.cells = this.generateSlimeShape(startX, startY, maxCells);
                break;
            }
            attempts++;
        }
        
        return formation;
    },

    // Generate organic slime-like shape
    generateSlimeShape(startX, startY, maxCells) {
        const cells = [];
        const targetCells = Math.floor(maxCells * (0.6 + Math.random() * 0.4)); // 60-100% of max
        
        // Start with center cell
        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        visited.add(`${startX},${startY}`);
        
        // Grow organically outward
        while (queue.length > 0 && cells.length < targetCells) {
            const current = queue.shift();
            
            if (this.isValidObstacleCell(current.x, current.y)) {
                cells.push({
                    x: current.x,
                    y: current.y,
                    blockType: 'main' // Will be updated in assignSlimeBlockTypes
                });
                
                // Add neighbors with some randomness for organic growth
                const directions = [
                    {dx: 0, dy: -1}, // up
                    {dx: 1, dy: 0},  // right
                    {dx: 0, dy: 1},  // down
                    {dx: -1, dy: 0}  // left
                ];
                
                // Shuffle directions for more organic growth
                for (let i = directions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [directions[i], directions[j]] = [directions[j], directions[i]];
                }
                
                directions.forEach(dir => {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;
                    const key = `${newX},${newY}`;
                    
                    if (!visited.has(key) && 
                        newX >= 0 && newX < this.GRID_SIZE && 
                        newY >= 0 && newY < this.GRID_SIZE) {
                        
                        // Add some randomness - not all neighbors are added
                        if (Math.random() < 0.7) { // 70% chance to grow in this direction
                            queue.push({x: newX, y: newY});
                            visited.add(key);
                        }
                    }
                });
            }
        }
        
        return cells;
    },

    // Assign block types (borders, corners, main) based on neighboring cells
    assignSlimeBlockTypes(formation) {
        formation.cells.forEach(cell => {
            const neighbors = this.getSlimeNeighbors(formation, cell.x, cell.y);
            cell.blockType = this.determineSlimeBlockType(neighbors);
        });
    },

    // Get neighboring slime cells
    getSlimeNeighbors(formation, x, y) {
        const neighbors = {
            top: false,
            right: false,
            bottom: false,
            left: false
        };
        
        const directions = [
            {key: 'top', dx: 0, dy: -1},
            {key: 'right', dx: 1, dy: 0},
            {key: 'bottom', dx: 0, dy: 1},
            {key: 'left', dx: -1, dy: 0}
        ];
        
        directions.forEach(dir => {
            const checkX = x + dir.dx;
            const checkY = y + dir.dy;
            
            // Check if there's a slime block in this direction
            const hasNeighbor = formation.cells.some(cell => 
                cell.x === checkX && cell.y === checkY
            );
            
            neighbors[dir.key] = hasNeighbor;
        });
        
        return neighbors;
    },

    // Determine which block texture to use based on neighbors
    determineSlimeBlockType(neighbors) {
        const {top, right, bottom, left} = neighbors;
        
        // Corner pieces (where exactly 2 adjacent sides are missing)
        if (!top && !left && right && bottom) return 'corner_left_top';
        if (!top && !right && left && bottom) return 'corner_right_top';
        if (!bottom && !left && top && right) return 'corner_left_bottom';
        if (!bottom && !right && top && left) return 'corner_right_bottom';
        
        // Border pieces (where exactly 1 side is missing)
        if (!top && left && right && bottom) return 'border_top';
        if (!right && top && bottom && left) return 'border_right';
        if (!bottom && top && left && right) return 'border_bottom';
        if (!left && top && right && bottom) return 'border_left';
        
        // Main piece (surrounded by other blocks or interior)
        return 'main';
    },

    // Check if position is valid for formation start
    isValidFormationStart(x, y) {
        // Check distance from all player castles (minimum 5 cells away)
        for (let player of window.gameState.players) {
            const castle = player.castle;
            const distance = Math.sqrt(Math.pow(x - castle.x, 2) + Math.pow(y - castle.y, 2));
            if (distance < 5) {
                return false;
            }
        }
        
        // Check if not too close to existing formations
        for (let formation of window.gameState.obstacleFormations) {
            const distance = Math.sqrt(Math.pow(x - formation.centerX, 2) + Math.pow(y - formation.centerY, 2));
            if (distance < 8) {
                return false;
            }
        }
        
        return true;
    },

    // Check if individual cell is valid for obstacle
    isValidObstacleCell(x, y) {
        // Check bounds
        if (x < 0 || x >= this.GRID_SIZE || y < 0 || y >= this.GRID_SIZE) {
            return false;
        }
        
        // Check if cell is already occupied
        if (window.gameState.grid[y][x] !== 0) {
            return false;
        }
        
        // Check distance from all player castles (minimum 3 cells away)
        for (let player of window.gameState.players) {
            const castle = player.castle;
            const distance = Math.sqrt(Math.pow(x - castle.x, 2) + Math.pow(y - castle.y, 2));
            if (distance < 3) {
                return false;
            }
        }
        
        return true;
    },

    // Get obstacle block at position with texture info
    getObstacleAt(x, y) {
        for (let formation of window.gameState.obstacleFormations) {
            const cell = formation.cells.find(cell => cell.x === x && cell.y === y);
            if (cell) {
                return {
                    type: formation.type,
                    blockType: cell.blockType,
                    ...cell
                };
            }
        }
        return null;
    },

    // Check if position has obstacle
    hasObstacle(x, y) {
        return window.gameState.grid[y] && window.gameState.grid[y][x] === -1;
    },

    // Get block texture filename
    getBlockTexture(blockType) {
        const textureMap = {
            'main': 'slime_main.png',
            'border_top': 'slime_border_top.png',
            'border_right': 'slime_border_right.png',
            'border_bottom': 'slime_border_bottom.png',
            'border_left': 'slime_border_left.png',
            'corner_left_top': 'slime_corner_left_top.png',
            'corner_right_top': 'slime_corner_right_top.png',
            'corner_left_bottom': 'slime_corner_left_bottom.png',
            'corner_right_bottom': 'slime_corner_right_bottom.png'
        };
        
        return textureMap[blockType] || 'slime_main.png';
    },

    // Initialize balls
    initBalls() {
        window.gameState.balls = [];
        window.gameState.players.forEach(player => {
            for (let i = 0; i < 3; i++) {
                const castle = player.castle;
                const baseSpeed = 2;
                window.gameState.balls.push({
                    x: castle.x * this.CELL_SIZE + this.CELL_SIZE/2 + (Math.random() - 0.5) * 8,
                    y: castle.y * this.CELL_SIZE + this.CELL_SIZE/2 + (Math.random() - 0.5) * 8,
                    dx: (Math.random() - 0.5) * baseSpeed,
                    dy: (Math.random() - 0.5) * baseSpeed,
                    owner: player.id,
                    lastHit: null,
                    baseSpeed: baseSpeed,
                    speedBoost: 0,
                    slowEffect: 0
                });
            }
        });
    },

    // Generate random deck for NPCs
    generateRandomDeck() {
        const deck = [];
        for (let i = 0; i < this.DECK_SIZE; i++) {
            deck.push({...window.LunarCards.getRandomCard()});
        }
        return deck;
    },

    // Fill hand from deck
    fillHand(player) {
        while (player.hand.length < this.HAND_SIZE && player.deck.length > 0) {
            const randomIndex = Math.floor(Math.random() * player.deck.length);
            player.hand.push(player.deck.splice(randomIndex, 1)[0]);
        }
    },

    // Initialize all player decks
    initializePlayerDecks() {
        // Get human player's collection for Player 4
        const humanCollection = window.CardCollection ? window.CardCollection.generateDeckFromCollection() : [];
        
        // Initialize AI players (2 and 3) with random decks
        for (let i = 1; i < window.gameState.players.length - 1; i++) {
            const player = window.gameState.players[i];
            player.deck = this.generateRandomDeck();
            player.hand = [];
            this.fillHand(player);
        }
        
        // Initialize Player 4 with same deck as human player
        if (humanCollection.length > 0) {
            const player4 = window.gameState.players[3]; // Player 4 (index 3)
            player4.deck = [...humanCollection];
            player4.hand = [];
            this.fillHand(player4);
        } else {
            // Fallback to random deck if human has no collection
            const player4 = window.gameState.players[3];
            player4.deck = this.generateRandomDeck();
            player4.hand = [];
            this.fillHand(player4);
        }
        
        // Initialize human player (Player 1)
        if (window.gameState.deckBuilding.currentDeck.length > 0) {
            window.gameState.players[0].deck = [...window.gameState.deckBuilding.currentDeck];
            window.gameState.players[0].hand = [];
            this.fillHand(window.gameState.players[0]);
            
            window.gameState.playerDeck = [...window.gameState.players[0].deck];
            window.gameState.playerHand = [...window.gameState.players[0].hand];
        }
    },

    // Use card from hand
    useCardFromHand(player, card) {
        const cardIndex = player.hand.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
            player.hand.splice(cardIndex, 1);
        }
        
        if (player.deck.length > 0) {
            const randomIndex = Math.floor(Math.random() * player.deck.length);
            player.hand.push(player.deck.splice(randomIndex, 1)[0]);
        }
    },

    // Check if player has built a complete deck
    hasValidDeck() {
        // First check if they have a collection
        if (window.CardCollection && window.CardCollection.hasEnoughCards()) {
            return true;
        }
        
        // Fallback to old deck system
        return window.gameState.deckBuilding.currentDeck.length >= this.MIN_CARDS ||
               (window.gameState.players[0].deck.length + window.gameState.players[0].hand.length) >= this.MIN_CARDS;
    },

    // Check if player has a deck
    checkPlayerDeck() {
        // Try collection system first
        if (window.CardCollection && window.CardCollection.hasEnoughCards()) {
            // Generate deck from collection
            const collectionDeck = window.CardCollection.generateDeckFromCollection();
            
            // Shuffle the deck
            for (let i = collectionDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [collectionDeck[i], collectionDeck[j]] = [collectionDeck[j], collectionDeck[i]];
            }
            
            window.gameState.deckBuilding.currentDeck = [...collectionDeck];
            window.gameState.players[0].deck = [...collectionDeck];
            window.gameState.players[0].hand = [];
            
            // Fill initial hand
            for (let i = 0; i < this.HAND_SIZE && window.gameState.players[0].deck.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * window.gameState.players[0].deck.length);
                window.gameState.players[0].hand.push(window.gameState.players[0].deck.splice(randomIndex, 1)[0]);
            }
            
            window.gameState.playerDeck = [...window.gameState.players[0].deck];
            window.gameState.playerHand = [...window.gameState.players[0].hand];
            
            return true;
        }
        
        // Fallback to old deck system
        const savedDeck = localStorage.getItem('lunarConquestDeck');
        if (savedDeck) {
            try {
                const deck = JSON.parse(savedDeck);
                
                if (deck.length >= this.MIN_CARDS) {
                    window.gameState.deckBuilding.currentDeck = [...deck];
                    window.gameState.players[0].deck = [...deck];
                    window.gameState.players[0].hand = [];
                    
                    for (let i = 0; i < this.HAND_SIZE && window.gameState.players[0].deck.length > 0; i++) {
                        const randomIndex = Math.floor(Math.random() * window.gameState.players[0].deck.length);
                        window.gameState.players[0].hand.push(window.gameState.players[0].deck.splice(randomIndex, 1)[0]);
                    }
                    
                    window.gameState.playerDeck = [...window.gameState.players[0].deck];
                    window.gameState.playerHand = [...window.gameState.players[0].hand];
                    
                    return true;
                }
            } catch (e) {
                console.error('Error loading saved deck:', e);
            }
        }
        
        // No valid deck found
        window.gameState.deckBuilding.currentDeck = [];
        window.gameState.players[0].deck = [];
        window.gameState.players[0].hand = [];
        window.gameState.playerDeck = [];
        window.gameState.playerHand = [];
        
        return false;
    },

    // Save deck to localStorage (now saves to collection)
    saveDeck() {
        if (window.gameState.deckBuilding.currentDeck.length > 0) {
            // Save to old system for compatibility
            localStorage.setItem('lunarConquestDeck', JSON.stringify(window.gameState.deckBuilding.currentDeck));
        }
    },

    // Delete saved deck (now managed by collection)
    deleteDeck() {
        localStorage.removeItem('lunarConquestDeck');
        
        window.gameState.playerDeck = [];
        window.gameState.playerHand = [];
        window.gameState.players[0].deck = [];
        window.gameState.players[0].hand = [];
        window.gameState.deckBuilding.currentDeck = [];
    },

    // Reset game for new round
    resetGame() {
        window.gameState.running = false;
        window.gameState.timeLeft = this.GAME_TIME;
        this.initGrid();
        this.initBalls();
        window.gameState.buildings = [];
        window.gameState.players.forEach(player => {
            player.coins = 10;
            player.balls = 3;
            player.hp = 100;
        });
    }
};

// Export for use in main game
window.GameState = GameState;