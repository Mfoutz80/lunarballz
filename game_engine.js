// Game Engine - Core Mechanics and Ball Physics
const GameEngine = {
    // Handle cell clicks for building placement
    handleCellClick(x, y) {
        if (!window.gameState.running || !window.gameState.selectedCard) return;
        
        const cellOwner = window.gameState.grid[y][x];
        if (cellOwner !== 1) return;
        
        // Check if cell has obstacle
        if (window.GameState.hasObstacle(x, y)) return;
        
        const existingBuilding = window.gameState.buildings.find(b => b.x === x && b.y === y);
        if (existingBuilding) return;
        
        const isCastle = window.gameState.players.some(p => p.castle.x === x && p.castle.y === y);
        if (isCastle) return;
        
        // Check if player has enough coins
        if (window.gameState.players[0].coins < window.gameState.selectedCard.cost) return;
        
        // Check if card can be played (new restriction check)
        const playabilityCheck = this.canPlayCard(window.gameState.selectedCard, 1);
        if (!playabilityCheck.canPlay) {
            // Show error message to player
            this.showErrorMessage(playabilityCheck.reason);
            return;
        }
        
        window.gameState.players[0].coins -= window.gameState.selectedCard.cost;
        
        const newBuilding = {
            type: window.gameState.selectedCard.id,
            x: x,
            y: y,
            owner: 1,
            balls: 0,
            hp: window.gameState.selectedCard.hp,
            maxHp: window.gameState.selectedCard.hp,
            cardData: window.gameState.selectedCard
        };
        
        // Play building placement sound (human player only)
        if (window.SoundManager) {
            window.SoundManager.playBuildSound(window.gameState.selectedCard, 1);
        }
        
        window.CardLogic.applyCardEffect(newBuilding, window.gameState.selectedCard);
        
        window.gameState.buildings.push(newBuilding);
        this.useCard(window.gameState.selectedCard);
        window.UIManager.clearCardSelection();
        window.UIManager.updateUI();
    },

    // Use card from hand
    useCard(card) {
        window.GameState.useCardFromHand(window.gameState.players[0], card);
        window.gameState.playerDeck = [...window.gameState.players[0].deck];
        window.gameState.playerHand = [...window.gameState.players[0].hand];
        window.UIManager.updateHandDisplay();
        window.UIManager.updateUI();
    },

    // Check if a card can be played based on its requirements
    canPlayCard(card, playerId) {
        // Check if it's Rusty Relics
        if (card.effect === 'sacrifice_building') {
            // Count player's current buildings
            const playerBuildings = window.gameState.buildings.filter(b => b.owner === playerId);
            
            if (playerBuildings.length === 0) {
                return {
                    canPlay: false,
                    reason: 'Need at least 1 building to sacrifice'
                };
            }
        }
        
        return {
            canPlay: true,
            reason: ''
        };
    },

    // Show error message to player
    showErrorMessage(message) {
        // Create a temporary error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.background = 'rgba(139, 0, 0, 0.9)';
        errorDiv.style.color = '#fff';
        errorDiv.style.padding = '15px 25px';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.border = '2px solid #ff4444';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.boxShadow = '0 0 20px rgba(139, 0, 0, 0.6)';
        errorDiv.style.animation = 'error-fade 3s ease-out forwards';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after animation
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    },

    // Normalize ball speed with crippling snare effect
    normalizeBallSpeed(ball) {
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (currentSpeed === 0) return;
        
        let targetSpeed = ball.baseSpeed;
        
        // Apply speed effects in order of priority
        if (ball.cripplingSnare > 0) {
            // Crippling snare: reduce speed to 5% of normal (virtually rooted)
            targetSpeed *= 0.05;
        } else if (ball.speedBoost > 0) {
            targetSpeed *= 1.5;
        } else if (ball.slowEffect > 0) {
            targetSpeed *= 0.5;
        }
        
        const ratio = targetSpeed / currentSpeed;
        ball.dx *= ratio;
        ball.dy *= ratio;
    },

    // Update ball positions and handle collisions
    updateBalls() {
        // Calculate board boundaries based on scaled size
        const BOARD_SIZE = window.GameState.GRID_SIZE * window.GameState.CELL_SIZE; // 28 * 30 = 840px
        const BALL_RADIUS = 7.5; // Half of 15px ball size
        
        window.gameState.balls.forEach(ball => {
            // Update effect timers
            if (ball.speedBoost > 0) {
                ball.speedBoost--;
            }
            if (ball.slowEffect > 0) {
                ball.slowEffect--;
            }
            if (ball.cripplingSnare > 0) {
                ball.cripplingSnare--;
            }
            
            this.normalizeBallSpeed(ball);
            
            // Store previous position for collision detection
            const prevX = ball.x;
            const prevY = ball.y;
            
            // Update position
            ball.x += ball.dx;
            ball.y += ball.dy;
            
            // Check for obstacle collisions
            if (this.checkObstacleCollision(ball, prevX, prevY)) {
                // Ball bounced off obstacle, position already corrected
                return;
            }
            
            // Bounce off walls - updated for 840px board
            if (ball.x <= BALL_RADIUS || ball.x >= BOARD_SIZE - BALL_RADIUS) {
                ball.dx *= -1;
            }
            if (ball.y <= BALL_RADIUS || ball.y >= BOARD_SIZE - BALL_RADIUS) {
                ball.dy *= -1;
            }
            
            // Keep within bounds - updated for 840px board
            ball.x = Math.max(BALL_RADIUS, Math.min(BOARD_SIZE - BALL_RADIUS, ball.x));
            ball.y = Math.max(BALL_RADIUS, Math.min(BOARD_SIZE - BALL_RADIUS, ball.y));
            
            // Handle grid interactions
            this.handleBallGridInteraction(ball);
        });
    },

    // Update missiles
    updateMissiles() {
        if (!window.gameState.missiles) return;
        
        window.gameState.missiles.forEach((missile, index) => {
            // Update missile position
            missile.x += missile.dx;
            missile.y += missile.dy;
            
            // Check if missile reached target
            const distanceToTarget = Math.sqrt(
                Math.pow(missile.x - missile.targetX, 2) + 
                Math.pow(missile.y - missile.targetY, 2)
            );
            
            if (distanceToTarget < 15) { // Close enough to target
                // Destroy the obstacle cell
                this.destroyObstacleCell(missile.obstacleTarget);
                
                // Play explosion sound (global - affects all players)
                if (window.SoundManager) {
                    window.SoundManager.playExplosion();
                }
                
                // Create explosion effect
                window.UIManager.createExplosionEffect(missile.x, missile.y);
                
                // Remove missile
                window.gameState.missiles.splice(index, 1);
            }
        });
    },

    // Destroy a single obstacle cell
    destroyObstacleCell(obstacleCell) {
        // Remove from grid
        window.gameState.grid[obstacleCell.y][obstacleCell.x] = 0;
        
        // Remove from obstacle formations
        window.gameState.obstacleFormations.forEach(formation => {
            const cellIndex = formation.cells.findIndex(cell => 
                cell.x === obstacleCell.x && cell.y === obstacleCell.y
            );
            if (cellIndex !== -1) {
                formation.cells.splice(cellIndex, 1);
            }
        });
        
        // Remove empty formations
        window.gameState.obstacleFormations = window.gameState.obstacleFormations.filter(
            formation => formation.cells.length > 0
        );
    },

    // Check for obstacle collisions and handle bouncing
    checkObstacleCollision(ball, prevX, prevY) {
        const ballRadius = 7.5;
        const ballLeft = ball.x - ballRadius;
        const ballRight = ball.x + ballRadius;
        const ballTop = ball.y - ballRadius;
        const ballBottom = ball.y + ballRadius;
        
        // Check all grid cells that the ball might be overlapping
        const leftCell = Math.floor(ballLeft / window.GameState.CELL_SIZE);
        const rightCell = Math.floor(ballRight / window.GameState.CELL_SIZE);
        const topCell = Math.floor(ballTop / window.GameState.CELL_SIZE);
        const bottomCell = Math.floor(ballBottom / window.GameState.CELL_SIZE);
        
        // Check each potentially overlapping cell
        for (let gridY = topCell; gridY <= bottomCell; gridY++) {
            for (let gridX = leftCell; gridX <= rightCell; gridX++) {
                // Check if cell is in valid bounds
                if (gridX >= 0 && gridX < window.GameState.GRID_SIZE && 
                    gridY >= 0 && gridY < window.GameState.GRID_SIZE) {
                    
                    // Check if current cell has obstacle
                    if (window.GameState.hasObstacle(gridX, gridY)) {
                        // Calculate obstacle bounds
                        const obstacleLeft = gridX * window.GameState.CELL_SIZE;
                        const obstacleRight = obstacleLeft + window.GameState.CELL_SIZE;
                        const obstacleTop = gridY * window.GameState.CELL_SIZE;
                        const obstacleBottom = obstacleTop + window.GameState.CELL_SIZE;
                        
                        // Check if ball is colliding with this obstacle cell
                        if (ballRight > obstacleLeft && ballLeft < obstacleRight &&
                            ballBottom > obstacleTop && ballTop < obstacleBottom) {
                            
                            // Determine collision direction based on ball's movement
                            const prevBallLeft = prevX - ballRadius;
                            const prevBallRight = prevX + ballRadius;
                            const prevBallTop = prevY - ballRadius;
                            const prevBallBottom = prevY + ballRadius;
                            
                            // Check which side of the obstacle was hit
                            const hitFromLeft = prevBallRight <= obstacleLeft && ballRight > obstacleLeft;
                            const hitFromRight = prevBallLeft >= obstacleRight && ballLeft < obstacleRight;
                            const hitFromTop = prevBallBottom <= obstacleTop && ballBottom > obstacleTop;
                            const hitFromBottom = prevBallTop >= obstacleBottom && ballTop < obstacleBottom;
                            
                            // Handle horizontal collision
                            if (hitFromLeft || hitFromRight) {
                                ball.dx *= -1;
                                if (hitFromLeft) {
                                    ball.x = obstacleLeft - ballRadius - 1;
                                } else {
                                    ball.x = obstacleRight + ballRadius + 1;
                                }
                            }
                            
                            // Handle vertical collision
                            if (hitFromTop || hitFromBottom) {
                                ball.dy *= -1;
                                if (hitFromTop) {
                                    ball.y = obstacleTop - ballRadius - 1;
                                } else {
                                    ball.y = obstacleBottom + ballRadius + 1;
                                }
                            }
                            
                            // If no clear direction, bounce both ways (corner collision)
                            if (!hitFromLeft && !hitFromRight && !hitFromTop && !hitFromBottom) {
                                ball.dx *= -1;
                                ball.dy *= -1;
                                // Move ball back to previous position
                                ball.x = prevX;
                                ball.y = prevY;
                            }
                            
                            return true; // Collision occurred
                        }
                    }
                }
            }
        }
        
        return false; // No collision
    },

    // Handle ball interaction with grid cells
    handleBallGridInteraction(ball) {
        const gridX = Math.floor(ball.x / window.GameState.CELL_SIZE);
        const gridY = Math.floor(ball.y / window.GameState.CELL_SIZE);
        
        if (gridX >= 0 && gridX < window.GameState.GRID_SIZE && 
            gridY >= 0 && gridY < window.GameState.GRID_SIZE) {
            const currentOwner = window.gameState.grid[gridY][gridX];
            const cellKey = `${gridX},${gridY}`;
            
            if (ball.lastHit === cellKey) return;
            
            // Skip if cell has obstacle
            if (window.GameState.hasObstacle(gridX, gridY)) return;
            
            // Check for building collision
            const building = window.gameState.buildings.find(b => b.x === gridX && b.y === gridY);
            if (building) {
                this.handleBallBuildingCollision(ball, building, cellKey);
                return;
            }
            
            // Handle territory capture
            this.handleTerritoryCapture(ball, gridX, gridY, currentOwner, cellKey);
        }
    },

    // Calculate damage reduction for a building based on global effects
    calculateDamageReduction(building) {
        let damageReduction = 1.0; // Start with full damage (no reduction)
        
        // Check if this building has its own damage reduction
        if (building.cardData && building.cardData.effect === 'damage_reduction') {
            damageReduction *= building.cardData.effectValue;
        }
        
        // Check for global damage reduction from Lunar Shield
        window.gameState.buildings.forEach(otherBuilding => {
            if (otherBuilding.owner === building.owner && 
                otherBuilding.cardData && 
                otherBuilding.cardData.effect === 'global_damage_reduction') {
                damageReduction *= otherBuilding.cardData.effectValue;
            }
        });
        
        return damageReduction;
    },

    // Handle ball collision with buildings
    handleBallBuildingCollision(ball, building, cellKey) {
        // Special handling for Crystal Formation - all balls bounce off
        if (building.cardData && building.cardData.effect === 'bounce_all_balls') {
            // Make ball bounce off by reversing its direction
            ball.dx *= -1;
            ball.dy *= -1;
            
            // Only enemy balls cause damage
            if (building.owner !== ball.owner) {
                let damage = 1;
                damage *= this.calculateDamageReduction(building);
                
                building.hp -= damage;
                
                if (building.hp <= 0) {
                    // Play building destroy sound (only for human player buildings)
                    if (window.SoundManager && building.owner === 1) {
                        window.SoundManager.playBuildingDestroy();
                    }
                    
                    window.CardLogic.destroyBuilding(building);
                    window.UIManager.updateUI();
                }
            }
            
            ball.lastHit = cellKey;
            setTimeout(() => { ball.lastHit = null; }, 500);
            return;
        }
        
        // Normal building collision logic for all other buildings
        if (building.owner === ball.owner) {
            window.CardLogic.activateBuildingEffect(building, ball);
        } else {
            let damage = 1;
            damage *= this.calculateDamageReduction(building);
            
            building.hp -= damage;
            
            if (building.hp <= 0) {
                // Play building destroy sound (only for human player buildings)
                if (window.SoundManager && building.owner === 1) {
                    window.SoundManager.playBuildingDestroy();
                }
                
                window.CardLogic.destroyBuilding(building);
                window.UIManager.updateUI();
            }
        }
        
        ball.lastHit = cellKey;
        setTimeout(() => { ball.lastHit = null; }, 500);
    },

    // Handle territory capture mechanics
    handleTerritoryCapture(ball, gridX, gridY, currentOwner, cellKey) {
        let territoryChanged = false;
        
        if (currentOwner === 0 && ball.owner !== 0) {
            window.gameState.grid[gridY][gridX] = ball.owner;
            territoryChanged = true;
            window.gameState.players[ball.owner - 1].coins += 1;
        } else if (currentOwner !== 0 && currentOwner !== ball.owner) {
            window.gameState.grid[gridY][gridX] = 0;
            territoryChanged = true;
        }
        
        if (territoryChanged) {
            ball.lastHit = cellKey;
            this.redirectBallToCastle(ball);
            setTimeout(() => { ball.lastHit = null; }, 500);
        }
    },

    // Redirect ball towards friendly castle after capturing territory
    redirectBallToCastle(ball) {
        const castle = window.gameState.players[ball.owner - 1].castle;
        const castleX = castle.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
        const castleY = castle.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
        
        const dirX = castleX - ball.x;
        const dirY = castleY - ball.y;
        const distance = Math.sqrt(dirX * dirX + dirY * dirY);
        
        if (distance > 0) {
            ball.dx = (dirX / distance) * ball.baseSpeed * 0.7 + (Math.random() - 0.5) * 0.5;
            ball.dy = (dirY / distance) * ball.baseSpeed * 0.7 + (Math.random() - 0.5) * 0.5;
        }
    },

    // Create visual grid
    createGrid() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        
        for (let y = 0; y < window.GameState.GRID_SIZE; y++) {
            for (let x = 0; x < window.GameState.GRID_SIZE; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell absolute cursor-pointer';
                cell.style.left = `${x * window.GameState.CELL_SIZE}px`;
                cell.style.top = `${y * window.GameState.CELL_SIZE}px`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', () => this.handleCellClick(x, y));
                board.appendChild(cell);
            }
        }
    },

    // Main game loop
    gameLoop() {
        if (!window.gameState.running) return;
        
        this.updateBalls();
        this.updateMissiles();
        window.AILogic.updateCPU();
        window.CardLogic.processBuildingEffects();
        window.UIManager.renderBalls();
        window.UIManager.renderMissiles();
        window.UIManager.updateGrid();
        window.UIManager.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    },

    // Timer management
    startTimer() {
        const timer = setInterval(() => {
            window.gameState.timeLeft--;
            window.UIManager.updateUI();
            
            if (window.gameState.timeLeft <= 0) {
                clearInterval(timer);
                this.endGame();
            }
        }, 1000);
    },

    // End game and show results modal - UPDATED FOR NEW MODAL
    endGame() {
        window.gameState.running = false;
        
        // Calculate final territories
        this.calculateTerritoryControl();
        
        // Use the new EndGameManager to show the modal
        if (window.EndGameManager) {
            window.EndGameManager.showEndGameModal();
        }
        
        document.getElementById('startBtn').textContent = 'START';
    },

    // Calculate territory control for end game
    calculateTerritoryControl() {
        // Reset territory counts
        window.gameState.players.forEach(player => {
            player.territory = 0;
        });
        
        // Count territory for each player
        for (let y = 0; y < window.GameState.GRID_SIZE; y++) {
            for (let x = 0; x < window.GameState.GRID_SIZE; x++) {
                const cellOwner = window.gameState.grid[y][x];
                if (cellOwner > 0 && cellOwner <= 4) {
                    const player = window.gameState.players.find(p => p.id === cellOwner);
                    if (player) {
                        player.territory++;
                    }
                }
            }
        }
    },

    // Start new game
    startGame() {
        if (!window.GameState.hasValidDeck()) {
            alert('YOU NEED AT LEAST 14 CARDS TO PLAY! CHECK YOUR CARD COLLECTION.');
            return;
        }
        
        // Resume audio context and start background music for browsers that require user interaction
        if (window.SoundManager) {
            window.SoundManager.resumeContext();
        }
        
        // No need to save deck anymore - it's in collection
        window.GameState.initializePlayerDecks();
        
        window.gameState.running = true;
        window.gameState.timeLeft = window.GameState.GAME_TIME;
        window.GameState.initGrid(); // This will also generate new obstacles
        window.GameState.initBalls();
        window.gameState.buildings = [];
        window.gameState.missiles = []; // Reset missiles
        window.gameState.players.forEach(player => {
            player.coins = 10;
            player.balls = 3;
            player.hp = 100;
            player.snareUseCount = 0; // Reset snare diminishing returns
        });
        
        document.getElementById('startBtn').textContent = 'RUNNING';
        
        this.startTimer();
        this.gameLoop();
    },

    // Check if player is a new player and needs to build first deck
    checkNewPlayer() {
        const hasNoDust = window.LunarDust.getDust() === 0;
        const hasNoCards = window.CardCollection.getTotalCards() === 0;
        const hasNoValidDeck = !window.GameState.hasValidDeck();
        
        return hasNoDust && hasNoCards && hasNoValidDeck;
    },

    // Initialize game engine with new player handling
    initialize() {
        // Initialize sound system
        if (window.SoundManager) {
            window.SoundManager.init();
        }
        
        // Make global constants available
        window.GRID_SIZE = window.GameState.GRID_SIZE;
        window.CELL_SIZE = window.GameState.CELL_SIZE;
        
        // Initialize game state
        window.gameState = window.GameState.createInitialState();
        
        // Check if this is a new player first
        const isNewPlayer = this.checkNewPlayer();
        
        if (isNewPlayer) {
            // For completely new players, delay the grid creation until after deck building
            console.log('New player detected - will initialize game board after deck building');
        } else {
            // For existing players, initialize normally
            this.createGrid();
            window.GameState.initGrid();
            window.UIManager.updateGrid();
        }
        
        window.UIManager.initializeUI();
        
        // Set up event listeners
        this.setupEventListeners();
    },

    // Initialize game board (called after deck building for new players)
    initializeGameBoard() {
        this.createGrid();
        window.GameState.initGrid();
        window.UIManager.updateGrid();
        window.UIManager.updateUI();
    },

    // Set up all event listeners
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        
        document.getElementById('deckOrCardsBtn').addEventListener('click', () => {
            if (window.gameState.running) {
                alert('CANNOT ACCESS CARDS WHILE GAME IS RUNNING!');
                return;
            }
            
            // Check if player has enough cards
            if (window.CardCollection.hasEnoughCards()) {
                // Show card collection
                window.CardCollection.updateCollectionDisplay();
                document.getElementById('cardCollectionModal').classList.remove('hidden');
            } else {
                // Show deck builder for first time
                window.UIManager.showDeckBuilder();
            }
        });

        document.getElementById('finishDeck').addEventListener('click', () => {
            window.UIManager.finishDeckBuilding();
        });

        // UPDATED: Remove old end game modal listener and add new one
        document.getElementById('continueButton').addEventListener('click', () => {
            // Stop end game music
            if (window.SoundManager) {
                window.SoundManager.stopEndGameMusic();
            }
            // Refresh the page
            location.reload();
        });

        document.getElementById('closeCardCollection').addEventListener('click', () => {
            document.getElementById('cardCollectionModal').classList.add('hidden');
        });

        document.addEventListener('mousemove', (e) => window.UIManager.updateCustomCursor(e));

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#gameBoard') && !e.target.closest('#handCards')) {
                window.UIManager.clearCardSelection();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.UIManager.clearCardSelection();
            }
        });

        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            gameBoard.addEventListener('mouseleave', () => {
                window.UIManager.hideBuildingTooltip();
            });
        }
    }
};

// Export for use in main game
window.GameEngine = GameEngine;