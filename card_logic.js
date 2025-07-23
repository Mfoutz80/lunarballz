// Card Logic and Building Effects
const CardLogic = {
    // Find a safe position for ball teleportation (avoiding obstacles)
    findSafePosition(targetX, targetY, radius = 40) {
        const BOARD_SIZE = window.GameState.GRID_SIZE * window.GameState.CELL_SIZE;
        const BALL_RADIUS = 7.5;
        
        // Try the target position first
        if (this.isPositionSafe(targetX, targetY)) {
            return { x: targetX, y: targetY };
        }
        
        // Try positions in expanding circles around the target
        for (let searchRadius = 20; searchRadius <= radius; searchRadius += 10) {
            for (let angle = 0; angle < 360; angle += 30) {
                const radians = (angle * Math.PI) / 180;
                const testX = targetX + Math.cos(radians) * searchRadius;
                const testY = targetY + Math.sin(radians) * searchRadius;
                
                // Make sure position is within bounds
                if (testX >= BALL_RADIUS && testX <= BOARD_SIZE - BALL_RADIUS &&
                    testY >= BALL_RADIUS && testY <= BOARD_SIZE - BALL_RADIUS) {
                    
                    if (this.isPositionSafe(testX, testY)) {
                        return { x: testX, y: testY };
                    }
                }
            }
        }
        
        // Fallback: find any safe position on the board
        for (let attempts = 0; attempts < 50; attempts++) {
            const randomX = Math.random() * (BOARD_SIZE - 2 * BALL_RADIUS) + BALL_RADIUS;
            const randomY = Math.random() * (BOARD_SIZE - 2 * BALL_RADIUS) + BALL_RADIUS;
            
            if (this.isPositionSafe(randomX, randomY)) {
                return { x: randomX, y: randomY };
            }
        }
        
        // Last resort: return original position (shouldn't happen)
        return { x: targetX, y: targetY };
    },

    // Check if a position is safe for ball placement
    isPositionSafe(x, y) {
        const BALL_RADIUS = 7.5;
        const ballLeft = x - BALL_RADIUS;
        const ballRight = x + BALL_RADIUS;
        const ballTop = y - BALL_RADIUS;
        const ballBottom = y + BALL_RADIUS;
        
        // Check all grid cells that the ball would overlap
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
                    
                    // Check if cell has obstacle
                    if (window.GameState.hasObstacle(gridX, gridY)) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    },

    // Apply initial card effect when building is placed
    applyCardEffect(building, card) {
        switch (card.effect) {
            case 'spawn_balls':
                building.balls = card.effectValue;
                for (let i = 0; i < card.effectValue; i++) {
                    const baseSpeed = 2;
                    const targetX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const targetY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const safePos = this.findSafePosition(targetX, targetY, 30);
                    
                    window.gameState.balls.push({
                        x: safePos.x,
                        y: safePos.y,
                        dx: (Math.random() - 0.5) * baseSpeed,
                        dy: (Math.random() - 0.5) * baseSpeed,
                        owner: building.owner,
                        lastHit: null,
                        baseSpeed: baseSpeed,
                        speedBoost: 0,
                        slowEffect: 0,
                        cripplingSnare: 0 // New: crippling snare effect
                    });
                }
                window.gameState.players[building.owner - 1].balls += card.effectValue;
                
                // Play ball spawn sound (only for human player)
                if (window.SoundManager && building.owner === 1) {
                    window.SoundManager.playBallSpawn();
                }
                break;
            case 'sacrifice_building':
                // Check if player has any other buildings to sacrifice
                const availableBuildings = window.gameState.buildings.filter(b => 
                    b.owner === building.owner && 
                    !(b.x === building.x && b.y === building.y)
                );
                
                if (availableBuildings.length === 0) {
                    // No buildings to sacrifice - this shouldn't happen due to placement restriction
                    // But as safety, still grant balls and show a message
                    console.warn('Rusty Relics played with no buildings to sacrifice');
                }
                
                // Don't store balls in the building - they should be permanent
                building.balls = 0; // This building doesn't store any balls
                
                // Use setTimeout to delay the sacrifice until after the building is placed
                setTimeout(() => {
                    // Find all player's buildings (excluding the Rusty Relics itself)
                    const playerBuildings = window.gameState.buildings.filter(b => 
                        b.owner === building.owner && 
                        !(b.x === building.x && b.y === building.y)
                    );
                    
                    if (playerBuildings.length > 0) {
                        // Pick a random building to sacrifice
                        const randomIndex = Math.floor(Math.random() * playerBuildings.length);
                        const sacrificeBuilding = playerBuildings[randomIndex];
                        
                        // Create visual effect at the sacrificed building
                        if (window.UIManager && window.UIManager.createSacrificeEffect) {
                            window.UIManager.createSacrificeEffect(sacrificeBuilding);
                        }
                        
                        // Remove the sacrificed building after a brief delay for the effect
                        setTimeout(() => {
                            this.destroyBuilding(sacrificeBuilding);
                        }, 200);
                        
                        // Play sacrifice sound (only for human player)
                        if (window.SoundManager && building.owner === 1) {
                            if (window.SoundManager.playSacrificeSound) {
                                window.SoundManager.playSacrificeSound();
                            } else {
                                // Fallback to existing sound
                                window.SoundManager.playBuildingDestroy();
                            }
                        }
                    }
                }, 100);
                
                // Grant permanent balls immediately - these are not tied to the building
                for (let i = 0; i < card.effectValue; i++) {
                    const baseSpeed = 2;
                    const targetX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const targetY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const safePos = this.findSafePosition(targetX, targetY, 30);
                    
                    window.gameState.balls.push({
                        x: safePos.x,
                        y: safePos.y,
                        dx: (Math.random() - 0.5) * baseSpeed,
                        dy: (Math.random() - 0.5) * baseSpeed,
                        owner: building.owner,
                        lastHit: null,
                        baseSpeed: baseSpeed,
                        speedBoost: 0,
                        slowEffect: 0,
                        cripplingSnare: 0
                    });
                }
                window.gameState.players[building.owner - 1].balls += card.effectValue;
                
                // Play ball spawn sound (only for human player)
                if (window.SoundManager && building.owner === 1) {
                    window.SoundManager.playBallSpawn();
                }
                break;
            case 'spawn_on_death':
                building.balls = card.effectValue;
                break;
            case 'xenomorph_hive':
                // Special case: spawn 3 balls immediately, store 1 for death
                building.balls = 1; // Store 1 ball for death effect
                for (let i = 0; i < 3; i++) {
                    const baseSpeed = 2;
                    const targetX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const targetY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const safePos = this.findSafePosition(targetX, targetY, 30);
                    
                    window.gameState.balls.push({
                        x: safePos.x,
                        y: safePos.y,
                        dx: (Math.random() - 0.5) * baseSpeed,
                        dy: (Math.random() - 0.5) * baseSpeed,
                        owner: building.owner,
                        lastHit: null,
                        baseSpeed: baseSpeed,
                        speedBoost: 0,
                        slowEffect: 0,
                        cripplingSnare: 0 // New: crippling snare effect
                    });
                }
                window.gameState.players[building.owner - 1].balls += 3;
                
                // Play ball spawn sound (only for human player)
                if (window.SoundManager && building.owner === 1) {
                    window.SoundManager.playBallSpawn();
                }
                break;
            case 'continuous_spawn':
                building.spawnTimer = card.effectValue;
                break;
            case 'passive_income':
                building.incomeTimer = card.effectValue;
                break;
            case 'nuclear_missiles':
                building.missileTimer = 200; 
                break;
        }
    },

    // Calculate production multiplier for a building based on global effects
    calculateProductionMultiplier(building) {
        let productionMultiplier = 1.0; // Start with normal production
        
        // Check for global production increase from Lunar Bastion
        window.gameState.buildings.forEach(otherBuilding => {
            if (otherBuilding.owner === building.owner && 
                otherBuilding.cardData && 
                otherBuilding.cardData.effect === 'increase_production') {
                productionMultiplier += otherBuilding.cardData.effectValue;
            }
        });
        
        return productionMultiplier;
    },

    // Process all building effects each frame
    processBuildingEffects() {
        window.gameState.buildings.forEach(building => {
            // Update snare cooldown timer
            if (building.snareCooldown !== undefined && building.snareCooldown > 0) {
                building.snareCooldown--;
            }
            
            // Continuous spawn timer
            if (building.spawnTimer !== undefined) {
                building.spawnTimer--;
                if (building.spawnTimer <= 0) {
                    const baseSpeed = 2;
                    const targetX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const targetY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                    const safePos = this.findSafePosition(targetX, targetY, 30);
                    
                    window.gameState.balls.push({
                        x: safePos.x,
                        y: safePos.y,
                        dx: (Math.random() - 0.5) * baseSpeed,
                        dy: (Math.random() - 0.5) * baseSpeed,
                        owner: building.owner,
                        lastHit: null,
                        baseSpeed: baseSpeed,
                        speedBoost: 0,
                        slowEffect: 0,
                        cripplingSnare: 0 // New: crippling snare effect
                    });
                    window.gameState.players[building.owner - 1].balls += 1;
                    building.spawnTimer = 900;
                    
                    // Play ball spawn sound (only for human player)
                    if (window.SoundManager && building.owner === 1) {
                        window.SoundManager.playBallSpawn();
                    }
                }
            }
            
            // Passive income timer with production boost
            if (building.incomeTimer !== undefined) {
                building.incomeTimer--;
                if (building.incomeTimer <= 0) {
                    const baseIncome = 20; // Change from 2 to 20
                    const productionMultiplier = this.calculateProductionMultiplier(building);
                    const boostedIncome = Math.floor(baseIncome * productionMultiplier);
                    
                    window.gameState.players[building.owner - 1].coins += boostedIncome;
                    building.incomeTimer = 600; // Change from 300 to 600 (10 seconds at 60fps)
                    
                    // Play coin generate sound (only for human player)
                    if (window.SoundManager && building.owner === 1) {
                        window.SoundManager.playCoinGenerate();
                    }
                }
            }
            
            // Nuclear missile timer
            if (building.missileTimer !== undefined) {
                building.missileTimer--;
                if (building.missileTimer <= 0) {
                    this.launchNuclearMissile(building);
                    building.missileTimer = 200; // Reset timer for next missile
                }
            }
            
            // Gravity pull effect
            if (building.cardData && building.cardData.effect === 'gravity_pull') {
                window.gameState.balls.forEach(ball => {
                    const buildingCenterX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
                    const buildingCenterY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
                    
                    const dx = buildingCenterX - ball.x;
                    const dy = buildingCenterY - ball.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < building.cardData.effectValue && distance > 0) {
                        const force = 0.1;
                        ball.dx += (dx / distance) * force;
                        ball.dy += (dy / distance) * force;
                    }
                });
            }
            
            // Attract friendly balls
            if (building.cardData && building.cardData.effect === 'attract_balls') {
                window.gameState.balls.forEach(ball => {
                    if (ball.owner === building.owner) {
                        const buildingCenterX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
                        const buildingCenterY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
                        
                        const dx = buildingCenterX - ball.x;
                        const dy = buildingCenterY - ball.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < building.cardData.effectValue && distance > 0) {
                            const force = 0.05;
                            ball.dx += (dx / distance) * force;
                            ball.dy += (dy / distance) * force;
                        }
                    }
                });
            }
        });
    },

    // Launch nuclear missile from building
    launchNuclearMissile(building) {
        // Find the nearest obstacle to target
        const target = this.findNearestObstacle(building);
        if (!target) return; // No obstacles to target
        
        // Get player's castle position as launch point
        const player = window.gameState.players[building.owner - 1];
        const castle = player.castle;
        const launchX = castle.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
        const launchY = castle.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
        
        // Create missile
        const missile = {
            x: launchX,
            y: launchY,
            targetX: target.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2,
            targetY: target.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2,
            speed: 8,
            owner: building.owner,
            obstacleTarget: target
        };
        
        // Calculate direction
        const dx = missile.targetX - missile.x;
        const dy = missile.targetY - missile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            missile.dx = (dx / distance) * missile.speed;
            missile.dy = (dy / distance) * missile.speed;
        } else {
            missile.dx = 0;
            missile.dy = 0;
        }
        
        // Add to missiles array
        if (!window.gameState.missiles) {
            window.gameState.missiles = [];
        }
        window.gameState.missiles.push(missile);
        
        // Play missile launch sound (only for human player)
        if (window.SoundManager && building.owner === 1) {
            window.SoundManager.playMissileLaunch();
        }
    },

    // Find nearest obstacle to target
    findNearestObstacle(building) {
        let nearestObstacle = null;
        let minDistance = Infinity;
        
        window.gameState.obstacleFormations.forEach(formation => {
            formation.cells.forEach(cell => {
                const dx = cell.x - building.x;
                const dy = cell.y - building.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestObstacle = cell;
                }
            });
        });
        
        return nearestObstacle;
    },

    // Activate building effect when friendly ball touches it
    activateBuildingEffect(building, ball) {
        if (!building.cardData) return;
        
        switch (building.cardData.effect) {
            case 'generate_coins':
                const baseCoins = building.cardData.effectValue;
                const productionMultiplier = this.calculateProductionMultiplier(building);
                const boostedCoins = Math.floor(baseCoins * productionMultiplier);
                
                window.gameState.players[ball.owner - 1].coins += boostedCoins;
                
                // Play coin generate sound (only for human player)
                if (window.SoundManager && ball.owner === 1) {
                    window.SoundManager.playCoinGenerate();
                }
                break;
            case 'speed_boost':
                ball.speedBoost = building.cardData.effectValue;
                
                // Play speed boost sound (only for human player)
                if (window.SoundManager && ball.owner === 1) {
                    window.SoundManager.playSpeedBoost();
                }
                break;
            case 'slow_enemies':
                window.gameState.balls.forEach(enemyBall => {
                    if (enemyBall.owner !== ball.owner) {
                        enemyBall.slowEffect = building.cardData.effectValue;
                    }
                });
                break;
            case 'crippling_snare':
                // Check if this building is already on cooldown (prevent retriggering until effect ends)
                if (building.snareCooldown && building.snareCooldown > 0) {
                    return; // Effect is still active, don't trigger again
                }
                
                // Get the player who owns this building
                const ownerPlayer = window.gameState.players[building.owner - 1];
                
                // Calculate diminishing returns: 100%, 50%, 25%, 12.5%, etc.
                const effectivenessFactor = Math.pow(0.5, ownerPlayer.snareUseCount);
                const diminishedDuration = Math.max(1, Math.floor(building.cardData.effectValue * effectivenessFactor));
                
                // Set building cooldown to prevent retriggering until effect ends
                building.snareCooldown = diminishedDuration;
                
                // Increment the player's snare use count
                ownerPlayer.snareUseCount++;
                
                // Apply crippling snare to all enemy balls with diminished duration
                let snaredBallCount = 0;
                window.gameState.balls.forEach(enemyBall => {
                    if (enemyBall.owner !== ball.owner) {
                        enemyBall.cripplingSnare = diminishedDuration;
                        snaredBallCount++;
                        
                        // Create visual snare effect on each enemy ball
                        window.UIManager.createSnareEffect(enemyBall);
                    }
                });
                
                // Play snare activate sound (only for human player)
                if (window.SoundManager && ball.owner === 1) {
                    window.SoundManager.playSnareActivate();
                }
                
                // Create fortress activation effect with diminishing returns indicator
                window.UIManager.createFortressActivationEffect(building, effectivenessFactor, ownerPlayer.snareUseCount);
                
                // Optional: Show diminishing returns message (you can remove this if too much UI clutter)
                if (ownerPlayer.snareUseCount > 1) {
                    window.UIManager.showDiminishingReturnsMessage(building, effectivenessFactor, diminishedDuration);
                }
                break;
            case 'teleport_balls':
                // Find a safe random position
                const BOARD_SIZE = window.GameState.GRID_SIZE * window.GameState.CELL_SIZE;
                const BALL_RADIUS = 7.5;
                const randomX = Math.random() * (BOARD_SIZE - 2 * BALL_RADIUS) + BALL_RADIUS;
                const randomY = Math.random() * (BOARD_SIZE - 2 * BALL_RADIUS) + BALL_RADIUS;
                const safePos = this.findSafePosition(randomX, randomY, 80);
                
                ball.x = safePos.x;
                ball.y = safePos.y;
                
                // Play teleport sound (only for human player)
                if (window.SoundManager && ball.owner === 1) {
                    window.SoundManager.playTeleport();
                }
                break;
            case 'redirect_balls':
                let nearestEnemy = null;
                let minDistance = Infinity;
                
                window.gameState.players.forEach(player => {
                    if (player.id !== ball.owner) {
                        const castle = player.castle;
                        const distance = Math.sqrt(
                            Math.pow(castle.x * window.GameState.CELL_SIZE - ball.x, 2) + 
                            Math.pow(castle.y * window.GameState.CELL_SIZE - ball.y, 2)
                        );
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestEnemy = castle;
                        }
                    }
                });
                
                if (nearestEnemy) {
                    const dirX = nearestEnemy.x * window.GameState.CELL_SIZE - ball.x;
                    const dirY = nearestEnemy.y * window.GameState.CELL_SIZE - ball.y;
                    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
                    
                    if (distance > 0) {
                        ball.dx = (dirX / distance) * ball.baseSpeed * building.cardData.effectValue;
                        ball.dy = (dirY / distance) * ball.baseSpeed * building.cardData.effectValue;
                    }
                }
                break;
            case 'convert_balls':
                let nearestEnemyBall = null;
                let minBallDistance = Infinity;
                
                window.gameState.balls.forEach(enemyBall => {
                    if (enemyBall.owner !== ball.owner) {
                        const distance = Math.sqrt(
                            Math.pow(enemyBall.x - ball.x, 2) + 
                            Math.pow(enemyBall.y - ball.y, 2)
                        );
                        if (distance < minBallDistance) {
                            minBallDistance = distance;
                            nearestEnemyBall = enemyBall;
                        }
                    }
                });
                
                if (nearestEnemyBall && minBallDistance < 200) {
                    window.gameState.players[nearestEnemyBall.owner - 1].balls--;
                    nearestEnemyBall.owner = ball.owner;
                    window.gameState.players[ball.owner - 1].balls++;
                }
                break;
            case 'drain_coins':
                window.gameState.players.forEach(player => {
                    if (player.id !== ball.owner) {
                        const baseDrain = building.cardData.effectValue;
                        const productionMultiplier = this.calculateProductionMultiplier(building);
                        const boostedDrain = Math.floor(baseDrain * productionMultiplier);
                        
                        const drainAmount = Math.min(player.coins, boostedDrain);
                        player.coins -= drainAmount;
                        window.gameState.players[ball.owner - 1].coins += drainAmount;
                    }
                });
                
                // Play coin generate sound for draining (only for human player)
                if (window.SoundManager && ball.owner === 1) {
                    window.SoundManager.playCoinGenerate();
                }
                break;
            case 'warp_to_castle':
                const enemyCastles = window.gameState.players.filter(p => p.id !== ball.owner);
                if (enemyCastles.length > 0) {
                    const randomCastle = enemyCastles[Math.floor(Math.random() * enemyCastles.length)].castle;
                    const targetX = randomCastle.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 40;
                    const targetY = randomCastle.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 40;
                    const safePos = this.findSafePosition(targetX, targetY, 60);
                    
                    ball.x = safePos.x;
                    ball.y = safePos.y;
                    
                    // Play teleport sound (only for human player)
                    if (window.SoundManager && ball.owner === 1) {
                        window.SoundManager.playTeleport();
                    }
                }
                break;
            case 'proximity_income':
                window.gameState.balls.forEach(enemyBall => {
                    if (enemyBall.owner !== ball.owner) {
                        const distance = Math.sqrt(
                            Math.pow(enemyBall.x - building.x * window.GameState.CELL_SIZE, 2) + 
                            Math.pow(enemyBall.y - building.y * window.GameState.CELL_SIZE, 2)
                        );
                        if (distance < building.cardData.effectValue) {
                            const baseIncome = 1;
                            const productionMultiplier = this.calculateProductionMultiplier(building);
                            const boostedIncome = Math.floor(baseIncome * productionMultiplier);
                            
                            window.gameState.players[ball.owner - 1].coins += boostedIncome;
                            
                            // Play coin generate sound (only for human player)
                            if (window.SoundManager && ball.owner === 1) {
                                window.SoundManager.playCoinGenerate();
                            }
                        }
                    }
                });
                break;
            case 'chain_damage':
                // Find nearby enemy territory squares within range
                const chainRange = building.cardData.effectValue; // Range in grid cells
                const enemySquares = [];
                
                for (let dy = -chainRange; dy <= chainRange; dy++) {
                    for (let dx = -chainRange; dx <= chainRange; dx++) {
                        const targetX = building.x + dx;
                        const targetY = building.y + dy;
                        
                        // Check if within grid bounds
                        if (targetX >= 0 && targetX < window.GameState.GRID_SIZE && 
                            targetY >= 0 && targetY < window.GameState.GRID_SIZE) {
                            
                            const cellOwner = window.gameState.grid[targetY][targetX];
                            
                            // If it's enemy territory (not neutral or friendly)
                            if (cellOwner > 0 && cellOwner !== building.owner) {
                                enemySquares.push({
                                    x: targetX,
                                    y: targetY,
                                    owner: cellOwner
                                });
                            }
                        }
                    }
                }
                
                // Chain damage to up to 6 nearby enemy squares
                const maxTargets = Math.min(6, enemySquares.length);
                const targetSquares = [];
                
                for (let i = 0; i < maxTargets; i++) {
                    const target = enemySquares[i];
                    // Convert territory back to neutral
                    window.gameState.grid[target.y][target.x] = 0;
                    
                    // Store for visual effect
                    targetSquares.push({
                        x: target.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2,
                        y: target.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2
                    });
                }
                
                // Play chain lightning sound (only for human player)
                if (window.SoundManager && targetSquares.length > 0 && ball.owner === 1) {
                    window.SoundManager.playChainLightning();
                }
                
                // Show visual effect
                if (targetSquares.length > 0) {
                    window.UIManager.createChainLightning(building, targetSquares);
                }
                break;
        }
    },

    // Get a random card for transformation (excluding metamorphic spire itself)
    getRandomTransformationCard() {
        const availableCards = window.LunarCards.CARD_POOL.filter(card => 
            card.id !== 'metamorphic_spire' && card.effect !== 'transform_on_death'
        );
        
        if (availableCards.length === 0) {
            // Fallback to a basic card if pool is empty
            return {
                id: 'lunar_outpost',
                name: 'LUNAR OUTPOST',
                emoji: '🌙',
                type: 'building',
                cost: 20,
                hp: 6,
                description: 'Grants 2 balls when built. Lose balls if destroyed.',
                effect: 'spawn_balls',
                effectValue: 2,
                rarity: 'common',
                on_build_sound: 'default',
                sound_effect: 'none'
            };
        }
        
        return availableCards[Math.floor(Math.random() * availableCards.length)];
    },

    // Destroy building and handle death effects
    destroyBuilding(building) {
        // Handle transformation on death (Metamorphic Spire)
        if (building.cardData && building.cardData.effect === 'transform_on_death') {
            // Get a random card to transform into
            const newCard = this.getRandomTransformationCard();
            
            // Create new building with the transformed card
            const transformedBuilding = {
                type: newCard.id,
                x: building.x,
                y: building.y,
                owner: building.owner,
                balls: 0,
                hp: newCard.hp,
                maxHp: newCard.hp,
                cardData: newCard
            };
            
            // Apply the new card's effects
            this.applyCardEffect(transformedBuilding, newCard);
            
            // Remove the old building from the array
            const buildingIndex = window.gameState.buildings.findIndex(b => b.x === building.x && b.y === building.y);
            if (buildingIndex !== -1) {
                window.gameState.buildings.splice(buildingIndex, 1);
            }
            
            // Add the transformed building
            window.gameState.buildings.push(transformedBuilding);
            
            // Play transformation sound (only for human player)
            if (window.SoundManager && building.owner === 1) {
                window.SoundManager.playTransformation();
            }
            
            // Create visual transformation effect
            window.UIManager.createTransformationEffect(building.x, building.y, newCard);
            
            // Don't continue with normal destruction logic
            return;
        }
        
        // Spawn on death effect (including xenomorph hive)
        if (building.cardData && (building.cardData.effect === 'spawn_on_death' || building.cardData.effect === 'xenomorph_hive')) {
            const baseSpeed = 2;
            const spawnCount = building.cardData.effect === 'xenomorph_hive' ? 1 : building.cardData.effectValue;
            
            for (let i = 0; i < spawnCount; i++) {
                const targetX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                const targetY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2 + (Math.random() - 0.5) * 10;
                const safePos = this.findSafePosition(targetX, targetY, 30);
                
                window.gameState.balls.push({
                    x: safePos.x,
                    y: safePos.y,
                    dx: (Math.random() - 0.5) * baseSpeed,
                    dy: (Math.random() - 0.5) * baseSpeed,
                    owner: building.owner,
                    lastHit: null,
                    baseSpeed: baseSpeed,
                    speedBoost: 0,
                    slowEffect: 0,
                    cripplingSnare: 0 // New: crippling snare effect
                });
            }
            window.gameState.players[building.owner - 1].balls += spawnCount;
            
            // Play ball spawn sound for death spawning (only for human player)
            if (window.SoundManager && building.owner === 1) {
                window.SoundManager.playBallSpawn();
            }
        }
        
        // Remove balls stored in building
        if (building.balls > 0) {
            const playerBalls = window.gameState.balls.filter(ball => ball.owner === building.owner);
            for (let i = 0; i < Math.min(building.balls, playerBalls.length); i++) {
                const ballIndex = window.gameState.balls.findIndex(ball => ball.owner === building.owner);
                if (ballIndex !== -1) {
                    window.gameState.balls.splice(ballIndex, 1);
                }
            }
            window.gameState.players[building.owner - 1].balls -= building.balls;
        }
        
        // Remove building from game state
        const buildingIndex = window.gameState.buildings.findIndex(b => b.x === building.x && b.y === building.y);
        if (buildingIndex !== -1) {
            window.gameState.buildings.splice(buildingIndex, 1);
        }
    }
};

// Export for use in main game
window.CardLogic = CardLogic;