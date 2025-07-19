// AI Logic for CPU Players
const AILogic = {
    // Update CPU players
    updateCPU() {
        window.gameState.players.slice(1).forEach(player => {
            // 1.5% chance per frame to attempt building
            if (Math.random() < 0.015 && player.hand.length > 0) {
                const affordableCards = player.hand.filter(card => player.coins >= card.cost);
                
                if (affordableCards.length > 0) {
                    const randomCard = affordableCards[Math.floor(Math.random() * affordableCards.length)];
                    
                    // Find owned cells without buildings or obstacles
                    const ownedCells = this.getAvailableBuildingSites(player.id);
                    
                    if (ownedCells.length > 0) {
                        const buildingSite = this.chooseBuildingSite(player, randomCard, ownedCells);
                        this.buildStructure(player, randomCard, buildingSite);
                    }
                }
            }
        });
    },

    // Get available building sites for a player
    getAvailableBuildingSites(playerId) {
        const ownedCells = [];
        window.gameState.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === playerId) {
                    const hasBuilding = window.gameState.buildings.some(b => b.x === x && b.y === y);
                    const isCastle = window.gameState.players.some(p => p.castle.x === x && p.castle.y === y);
                    const hasObstacle = window.GameState.hasObstacle(x, y);
                    
                    if (!hasBuilding && !isCastle && !hasObstacle) {
                        ownedCells.push({x, y});
                    }
                }
            });
        });
        return ownedCells;
    },

    // Choose best building site (simple AI strategy)
    chooseBuildingSite(player, card, availableSites) {
        // For now, just choose randomly
        // Could be enhanced with strategic placement logic
        return availableSites[Math.floor(Math.random() * availableSites.length)];
    },

    // Build structure at chosen location
    buildStructure(player, card, location) {
        player.coins -= card.cost;
        
        const newBuilding = {
            type: card.id,
            x: location.x,
            y: location.y,
            owner: player.id,
            balls: 0,
            hp: card.hp,
            maxHp: card.hp,
            cardData: card
        };
        
        window.CardLogic.applyCardEffect(newBuilding, card);
        window.gameState.buildings.push(newBuilding);
        
        window.GameState.useCardFromHand(player, card);
    },

    // Enhanced AI strategies (for future development)
    evaluateBuildingSite(player, card, location) {
        let score = 0;
        
        // Distance from castle (closer is better for defense)
        const castle = player.castle;
        const distanceFromCastle = Math.sqrt(
            Math.pow(location.x - castle.x, 2) + 
            Math.pow(location.y - castle.y, 2)
        );
        score += (20 - distanceFromCastle) * 2;
        
        // Territory density (more owned cells nearby is better)
        const nearbyOwned = this.countNearbyOwnedCells(player.id, location.x, location.y, 3);
        score += nearbyOwned * 5;
        
        // Enemy proximity (closer to enemies for offensive buildings)
        if (card.effect === 'spawn_balls' || card.effect === 'continuous_spawn') {
            const nearbyEnemies = this.countNearbyEnemyCells(player.id, location.x, location.y, 5);
            score += nearbyEnemies * 3;
        }
        
        // Penalty for being near obstacles (they block movement)
        const nearbyObstacles = this.countNearbyObstacles(location.x, location.y, 2);
        score -= nearbyObstacles * 2;
        
        return score;
    },

    // Count nearby owned cells
    countNearbyOwnedCells(playerId, centerX, centerY, radius) {
        let count = 0;
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && x < window.GameState.GRID_SIZE && 
                    y >= 0 && y < window.GameState.GRID_SIZE) {
                    if (window.gameState.grid[y][x] === playerId) {
                        count++;
                    }
                }
            }
        }
        return count;
    },

    // Count nearby enemy cells
    countNearbyEnemyCells(playerId, centerX, centerY, radius) {
        let count = 0;
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && x < window.GameState.GRID_SIZE && 
                    y >= 0 && y < window.GameState.GRID_SIZE) {
                    const cellOwner = window.gameState.grid[y][x];
                    if (cellOwner !== 0 && cellOwner !== playerId && cellOwner !== -1) {
                        count++;
                    }
                }
            }
        }
        return count;
    },

    // Count nearby obstacles
    countNearbyObstacles(centerX, centerY, radius) {
        let count = 0;
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && x < window.GameState.GRID_SIZE && 
                    y >= 0 && y < window.GameState.GRID_SIZE) {
                    if (window.GameState.hasObstacle(x, y)) {
                        count++;
                    }
                }
            }
        }
        return count;
    },

    // AI difficulty settings
    setDifficulty(level) {
        switch (level) {
            case 'easy':
                this.buildFrequency = 0.005; // 0.5% chance per frame
                this.useStrategy = false;
                break;
            case 'medium':
                this.buildFrequency = 0.015; // 1.5% chance per frame
                this.useStrategy = false;
                break;
            case 'hard':
                this.buildFrequency = 0.025; // 2.5% chance per frame
                this.useStrategy = true;
                break;
        }
    }
};

// Export for use in main game
window.AILogic = AILogic;