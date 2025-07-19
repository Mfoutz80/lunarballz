// Game State Management
const GameState = {
    GRID_SIZE: 28,
    CELL_SIZE: 30, // Changed from 20 to 30 (50% larger)
    GAME_TIME: 240, // 4 minutes in seconds
    DECK_SIZE: 12,
    MIN_CARDS: 14, // Minimum cards needed to play
    HAND_SIZE: 4,
    OBSTACLE_PERCENTAGE: 0.50, // 30% of the map
    OBSTACLE_FORMATIONS: 2, // Number of obstacle formations
    MAX_FORMATION_SIZE: 0.25, // Maximum 10% of board size per formation

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
            obstacleFormations: [], // New: array to store obstacle formations
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
        
        // Generate obstacle formations
        this.generateObstacleFormations();
    },

    // Generate large obstacle formations
    generateObstacleFormations() {
        window.gameState.obstacleFormations = [];
        const totalCells = this.GRID_SIZE * this.GRID_SIZE;
        const maxFormationCells = Math.floor(totalCells * this.MAX_FORMATION_SIZE);
        
        const obstacleTypes = ['mountain', 'acid'];
        
        for (let i = 0; i < this.OBSTACLE_FORMATIONS; i++) {
            const formationType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            const formation = this.createObstacleFormation(formationType, maxFormationCells);
            
            if (formation.cells.length > 0) {
                window.gameState.obstacleFormations.push(formation);
                
                // Mark cells in grid as obstacles
                formation.cells.forEach(cell => {
                    window.gameState.grid[cell.y][cell.x] = -1;
                });
            }
        }
    },

    // Create a single obstacle formation
    createObstacleFormation(type, maxCells) {
        const formation = {
            type: type,
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
                
                if (type === 'mountain') {
                    formation.cells = this.generateMountainWall(startX, startY, maxCells);
                } else {
                    formation.cells = this.generateAcidLake(startX, startY, maxCells);
                }
                
                break;
            }
            attempts++;
        }
        
        return formation;
    },

    // Generate mountain wall formation
    generateMountainWall(startX, startY, maxCells) {
        const cells = [];
        const targetCells = Math.floor(maxCells * (0.6 + Math.random() * 0.4)); // 60-100% of max
        
        // Create a wall-like formation
        const isHorizontal = Math.random() > 0.5;
        const length = Math.min(Math.floor(Math.sqrt(targetCells) * 2), 12);
        const width = Math.max(1, Math.floor(targetCells / length));
        
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < width; j++) {
                let x, y;
                
                if (isHorizontal) {
                    x = startX + i - Math.floor(length / 2);
                    y = startY + j - Math.floor(width / 2);
                } else {
                    x = startX + j - Math.floor(width / 2);
                    y = startY + i - Math.floor(length / 2);
                }
                
                if (this.isValidObstacleCell(x, y)) {
                    cells.push({
                        x: x,
                        y: y,
                        isPeak: i === Math.floor(length / 2) && j === Math.floor(width / 2)
                    });
                }
            }
        }
        
        return cells;
    },

    // Generate acid lake formation
    generateAcidLake(startX, startY, maxCells) {
        const cells = [];
        const targetCells = Math.floor(maxCells * (0.7 + Math.random() * 0.3)); // 70-100% of max
        
        // Create a more circular/organic formation
        const radius = Math.floor(Math.sqrt(targetCells / Math.PI)) + 1;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Create organic shape with some randomness
                const threshold = radius * (0.7 + Math.random() * 0.3);
                
                if (distance <= threshold) {
                    const x = startX + dx;
                    const y = startY + dy;
                    
                    if (this.isValidObstacleCell(x, y)) {
                        cells.push({
                            x: x,
                            y: y,
                            isCenter: dx === 0 && dy === 0
                        });
                    }
                }
            }
        }
        
        return cells;
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

    // Get obstacle formation at position
    getObstacleAt(x, y) {
        for (let formation of window.gameState.obstacleFormations) {
            const cell = formation.cells.find(cell => cell.x === x && cell.y === y);
            if (cell) {
                return {
                    type: formation.type,
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