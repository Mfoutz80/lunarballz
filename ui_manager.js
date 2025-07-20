// UI Management and Rendering
const UIManager = {
    // Create card element with retro styling and image support
    createCardElement(card, isHandCard = false) {
        const cardDiv = document.createElement('div');
        
        if (isHandCard) {
            cardDiv.className = 'hand-card';
            cardDiv.dataset.cardId = card.id;
            cardDiv.addEventListener('click', () => this.selectHandCard(card));
            
            // Add hover events for hand cards
            cardDiv.addEventListener('mouseenter', (e) => {
                this.showCardTooltip(card, e);
            });
            
            cardDiv.addEventListener('mouseleave', () => {
                this.hideCardTooltip();
            });
            
            // Create image element
            const img = document.createElement('img');
            img.className = 'hand-card-image';
            img.src = `cards/${card.id}.png`;
            img.alt = card.name;
            img.onerror = () => {
                // Fallback to emoji if image fails to load
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'image-fallback hand-card-image';
                fallback.innerHTML = card.emoji;
                cardDiv.appendChild(fallback);
            };
            
            // Add cost overlay
            const costDiv = document.createElement('div');
            costDiv.className = 'hand-card-cost';
            costDiv.textContent = card.cost;
            
            cardDiv.appendChild(img);
            cardDiv.appendChild(costDiv);
        } else {
            // For collection and other places
            cardDiv.className = 'card p-3 text-center mini-card';
            
            const img = document.createElement('img');
            img.className = 'card-image';
            img.src = `cards/${card.id}.png`;
            img.alt = card.name;
            img.onerror = () => {
                // Fallback to emoji if image fails to load
                img.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'image-fallback card-image';
                fallback.innerHTML = card.emoji;
                cardDiv.appendChild(fallback);
            };
            
            cardDiv.innerHTML = `
                <div class="mb-2"></div>
                <div class="retro-text text-xs mb-1 card-name">${card.name}</div>
                <div class="text-xs text-cyan-300 mb-1" style="height: 30px; overflow: hidden; font-size: 8px;">${card.description}</div>
                <div class="text-yellow-400 font-bold text-xs card-cost">💰 ${card.cost}</div>
            `;
            
            cardDiv.insertBefore(img, cardDiv.firstChild);
        }
        
        return cardDiv;
    },

    // Create large deck builder card element with limit indicator
    createDeckBuilderCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'deck-builder-large-card';
        cardDiv.dataset.cardId = card.id;
        
        // Check current count in deck being built
        const currentCount = window.gameState.deckBuilding.currentDeck.filter(c => c.id === card.id).length;
        const maxAllowed = card.rarity === 'legendary' ? 1 : 4;
        const isAtLimit = currentCount >= maxAllowed;
        
        // If at limit, disable the card
        if (isAtLimit) {
            cardDiv.classList.add('deck-card-disabled');
        }
        
        // Card image
        const img = document.createElement('img');
        img.className = 'deck-builder-large-card-image';
        img.src = `cards/${card.id}.png`;
        img.alt = card.name;
        img.onerror = () => {
            // Fallback to emoji if image fails to load
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'image-fallback deck-builder-large-card-image';
            fallback.innerHTML = card.emoji;
            fallback.style.fontSize = '100px';
            fallback.style.display = 'flex';
            fallback.style.alignItems = 'center';
            fallback.style.justifyContent = 'center';
            cardDiv.appendChild(fallback);
        };
        
        // Add limit overlay if at limit
        if (isAtLimit) {
            const limitOverlay = document.createElement('div');
            limitOverlay.className = 'card-limit-overlay';
            limitOverlay.innerHTML = `
                <div class="limit-text">LIMIT REACHED</div>
                <div class="limit-count">${currentCount}/${maxAllowed}</div>
            `;
            cardDiv.appendChild(limitOverlay);
        }
        
        // Card info section - just name and description
        const infoDiv = document.createElement('div');
        infoDiv.className = 'deck-builder-card-stats';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'deck-builder-card-name';
        nameDiv.textContent = card.name;
        
        // Add limit indicator to name if at limit
        if (isAtLimit) {
            nameDiv.style.color = '#888888';
        }
        
        const descriptionDiv = document.createElement('div');
        descriptionDiv.className = 'deck-builder-card-description';
        descriptionDiv.textContent = card.description;
        
        // Add count indicator
        const countDiv = document.createElement('div');
        countDiv.className = 'deck-builder-card-count';
        countDiv.innerHTML = `<span class="${isAtLimit ? 'text-red-400' : 'text-green-400'}">${currentCount}/${maxAllowed}</span>`;
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(descriptionDiv);
        infoDiv.appendChild(countDiv);
        
        cardDiv.appendChild(img);
        cardDiv.appendChild(infoDiv);
        
        return cardDiv;
    },

    // Create HP dots instead of bar
    createHPDots(currentHp, maxHp) {
        const hpContainer = document.createElement('div');
        hpContainer.className = 'hp-dots';
        
        for (let i = 0; i < maxHp; i++) {
            const dot = document.createElement('div');
            dot.className = i < currentHp ? 'hp-dot' : 'hp-dot damaged';
            hpContainer.appendChild(dot);
        }
        
        return hpContainer;
    },

    // Select card from hand
    selectHandCard(card) {
        if (!window.gameState.running) return;
        
        if (window.gameState.selectedCard && window.gameState.selectedCard.id === card.id) {
            this.clearCardSelection();
            return;
        }
        
        window.gameState.selectedCard = card;
        
        document.querySelectorAll('.hand-card').forEach(c => c.classList.remove('selected'));
        document.querySelector(`[data-card-id="${card.id}"]`).classList.add('selected');
        
        const gameBoard = document.getElementById('gameBoard');
        const customCursor = document.getElementById('customCursor');
        const customCursorImage = document.getElementById('customCursorImage');
        
        gameBoard.classList.add('building-cursor');
        
        // Use building image for cursor
        if (customCursorImage) {
            customCursorImage.src = `buildings/${card.id}.png`;
            customCursorImage.style.display = 'block';
            customCursor.style.display = 'none';
            
            // Fallback to emoji cursor if image fails
            customCursorImage.onerror = () => {
                customCursorImage.style.display = 'none';
                customCursor.style.display = 'block';
                customCursor.innerHTML = card.emoji;
            };
        } else {
            customCursor.style.display = 'block';
            customCursor.innerHTML = card.emoji;
        }
    },

    // Clear card selection
    clearCardSelection() {
        window.gameState.selectedCard = null;
        document.querySelectorAll('.hand-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('gameBoard').classList.remove('building-cursor');
        document.getElementById('customCursor').style.display = 'none';
        const customCursorImage = document.getElementById('customCursorImage');
        if (customCursorImage) {
            customCursorImage.style.display = 'none';
        }
    },

    // Update hand display
    updateHandDisplay() {
        const handDiv = document.getElementById('handCards');
        handDiv.innerHTML = '';
        
        const playerHand = window.gameState.players[0].hand;
        
        if (playerHand.length === 0) {
            handDiv.innerHTML = '<div class="text-center text-cyan-600 text-xs py-4 w-full">NO CARDS</div>';
            return;
        }
        
        playerHand.forEach(card => {
            const cardElement = this.createCardElement(card, true);
            handDiv.appendChild(cardElement);
        });
    },

    // Update UI stats
    updateUI() {
        const totalCells = window.GameState.GRID_SIZE * window.GameState.GRID_SIZE;
        let territories = [0, 0, 0, 0];
        
        window.gameState.grid.forEach(row => {
            row.forEach(cell => {
                if (cell > 0) {
                    territories[cell - 1]++;
                }
            });
        });
        
        window.gameState.taxRate = Math.min(Math.floor(territories[0] / 10), 50);
        
        // Update territory meter
        const territoryMeter = document.getElementById('territory-meter');
        territoryMeter.innerHTML = '';
        
        territories.forEach((territory, index) => {
            const percentage = (territory / totalCells) * 100;
            const colors = ['territory-1', 'territory-2', 'territory-3', 'territory-4'];
            
            const segment = document.createElement('div');
            segment.className = `${colors[index]} transition-all duration-300`;
            segment.style.width = `${percentage}%`;
            territoryMeter.appendChild(segment);
        });
        
        // Update tax meter (hidden but needed for compatibility)
        const taxMeter = document.getElementById('tax-meter');
        const taxPercentage = document.getElementById('tax-percentage');
        if (taxMeter) {
            taxMeter.style.width = `${(window.gameState.taxRate / 50) * 100}%`;
        }
        taxPercentage.textContent = `${window.gameState.taxRate}%`;
        
        window.gameState.players.forEach((player, index) => {
            player.territory = territories[index];
        });
        
        document.getElementById('p1-coins').textContent = window.gameState.players[0].coins;
        document.getElementById('p1-balls').textContent = window.gameState.players[0].balls;
        document.getElementById('deck-count').textContent = `${window.gameState.players[0].hand.length}/${window.gameState.players[0].deck.length + window.gameState.players[0].hand.length}`;
        
        // Update Lunar Dust display
        if (window.LunarDust) {
            window.LunarDust.updateDisplay();
        }
        
        const minutes = Math.floor(window.gameState.timeLeft / 60);
        const seconds = window.gameState.timeLeft % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    // Check if building has shield protection
    hasShieldProtection(building) {
        return window.gameState.buildings.some(otherBuilding => 
            otherBuilding.owner === building.owner && 
            otherBuilding.cardData && 
            otherBuilding.cardData.effect === 'global_damage_reduction'
        );
    },

    // Check if building has production boost
    hasProductionBoost(building) {
        return window.gameState.buildings.some(otherBuilding => 
            otherBuilding.owner === building.owner && 
            otherBuilding.cardData && 
            otherBuilding.cardData.effect === 'increase_production'
        );
    },

    // Create building image element
    createBuildingImage(building) {
        const img = document.createElement('img');
        img.className = 'building-image';
        img.style.width = '21px';
        img.style.height = '21px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '2px';
        img.src = `buildings/${building.cardData ? building.cardData.id : 'default'}.png`;
        img.alt = building.cardData ? building.cardData.name : 'Building';
        
        // Fallback to emoji if image fails to load
        img.onerror = () => {
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.innerHTML = building.cardData ? building.cardData.emoji : '🏢';
            fallback.style.fontSize = '15px';
            fallback.style.display = 'flex';
            fallback.style.alignItems = 'center';
            fallback.style.justifyContent = 'center';
            fallback.style.width = '21px';
            fallback.style.height = '21px';
            img.parentNode.appendChild(fallback);
        };
        
        return img;
    },

    // Create castle image element
    createCastleImage() {
        const img = document.createElement('img');
        img.className = 'castle-image';
        img.style.width = '24px';
        img.style.height = '24px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '2px';
        img.src = 'buildings/base.png';
        img.alt = 'Base';
        
        // Fallback to emoji if image fails to load
        img.onerror = () => {
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.innerHTML = '🏰';
            fallback.style.fontSize = '15px';
            fallback.style.display = 'flex';
            fallback.style.alignItems = 'center';
            fallback.style.justifyContent = 'center';
            fallback.style.width = '24px';
            fallback.style.height = '24px';
            img.parentNode.appendChild(fallback);
        };
        
        return img;
    },

    // Create block texture image element
    createBlockImage(obstacle) {
        const img = document.createElement('img');
        img.className = 'block-image';
        img.style.width = '30px';
        img.style.height = '30px';
        img.style.objectFit = 'cover';
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.zIndex = '3';
        img.style.pointerEvents = 'none';
        
        // Get the appropriate texture file
        const textureFile = window.GameState.getBlockTexture(obstacle.blockType);
        img.src = `blocks/${textureFile}`;
        img.alt = `Slime block ${obstacle.blockType}`;
        
        // Fallback to colored block if image fails to load
        img.onerror = () => {
            img.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.style.width = '30px';
            fallback.style.height = '30px';
            fallback.style.position = 'absolute';
            fallback.style.top = '0';
            fallback.style.left = '0';
            fallback.style.background = 'linear-gradient(135deg, #44ff44 0%, #33cc33 30%, #22aa22 70%, #116611 100%)';
            fallback.style.border = '1px solid #00ff00';
            fallback.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.6), inset 0 0 4px rgba(0, 255, 0, 0.3)';
            fallback.style.zIndex = '3';
            img.parentNode.appendChild(fallback);
        };
        
        return img;
    },

    // Update grid colors, buildings, and obstacles
    updateGrid() {
        const board = document.getElementById('gameBoard');
        const cells = board.querySelectorAll('.grid-cell');
        
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.className = 'grid-cell absolute cursor-pointer';
            
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const owner = window.gameState.grid[y][x];
            
            if (owner === -1) {
                // This cell has an obstacle - use block textures
                const obstacle = window.GameState.getObstacleAt(x, y);
                if (obstacle && obstacle.type === 'slime_blocks') {
                    cell.classList.add('obstacle-block');
                    
                    // Add the block texture image
                    const blockImg = this.createBlockImage(obstacle);
                    cell.appendChild(blockImg);
                } else {
                    // Fallback for old obstacle types (shouldn't happen with new system)
                    cell.classList.add('obstacle-formation');
                    cell.style.background = 'linear-gradient(135deg, #44ff44 0%, #33cc33 30%, #22aa22 70%, #116611 100%)';
                    cell.style.border = '1px solid #00ff00';
                }
            } else if (owner > 0) {
                const player = window.gameState.players[owner - 1];
                cell.classList.add(player.color);
            } else {
                // Unoccupied cells use lunar gray background
                cell.style.background = '#2a2a2a';
            }
        });
        
        // Add castles with PNG images - adjusted positioning for larger cells
        window.gameState.players.forEach(player => {
            const castle = player.castle;
            const cell = board.querySelector(`[data-x="${castle.x}"][data-y="${castle.y}"]`);
            if (cell) {
                const castleElement = document.createElement('div');
                castleElement.className = 'castle';
                castleElement.style.top = '3px';
                castleElement.style.left = '3px';
                
                // Add castle image instead of emoji
                const castleImg = this.createCastleImage();
                castleElement.appendChild(castleImg);
                
                // Add HP dots instead of bar
                const hpDots = this.createHPDots(Math.ceil(player.hp / 10), 10);
                castleElement.appendChild(hpDots);
                
                cell.appendChild(castleElement);
            }
        });
        
        // Add buildings with PNG images - adjusted positioning for larger cells
        window.gameState.buildings.forEach(building => {
            const cell = board.querySelector(`[data-x="${building.x}"][data-y="${building.y}"]`);
            if (cell) {
                const buildingElement = document.createElement('div');
                buildingElement.className = 'building';
                buildingElement.style.top = '4px';
                buildingElement.style.left = '4px';
                buildingElement.style.cursor = 'pointer';
                buildingElement.dataset.buildingId = `${building.x}-${building.y}`;
                
                // Add building image instead of emoji
                const buildingImg = this.createBuildingImage(building);
                buildingElement.appendChild(buildingImg);
                
                // Add aura effects
                const hasShield = this.hasShieldProtection(building);
                const hasProduction = this.hasProductionBoost(building);
                
                if (hasShield || hasProduction) {
                    const auraElement = document.createElement('div');
                    auraElement.className = 'building-aura';
                    auraElement.style.position = 'absolute';
                    auraElement.style.top = '-2px';
                    auraElement.style.left = '-2px';
                    auraElement.style.width = '26px';
                    auraElement.style.height = '26px';
                    auraElement.style.borderRadius = '50%';
                    auraElement.style.pointerEvents = 'none';
                    auraElement.style.zIndex = '5';
                    
                    if (hasShield && hasProduction) {
                        // Both effects: gradient border (blue + gold)
                        auraElement.style.border = '2px solid transparent';
                        auraElement.style.background = 'linear-gradient(45deg, #4A90E2, #FFD700) border-box';
                        auraElement.style.WebkitMask = 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)';
                        auraElement.style.WebkitMaskComposite = 'xor';
                        auraElement.style.animation = 'aura-pulse 2s ease-in-out infinite';
                    } else if (hasShield) {
                        // Shield only: blue glow
                        auraElement.style.border = '2px solid #4A90E2';
                        auraElement.style.boxShadow = '0 0 8px rgba(74, 144, 226, 0.6)';
                        auraElement.style.animation = 'shield-pulse 2s ease-in-out infinite';
                    } else if (hasProduction) {
                        // Production only: gold glow
                        auraElement.style.border = '2px solid #FFD700';
                        auraElement.style.boxShadow = '0 0 8px rgba(255, 215, 0, 0.6)';
                        auraElement.style.animation = 'production-pulse 2s ease-in-out infinite';
                    }
                    
                    buildingElement.appendChild(auraElement);
                }
                
                buildingElement.addEventListener('mouseenter', (e) => {
                    this.showBuildingTooltip(building, e);
                });
                
                buildingElement.addEventListener('mouseleave', () => {
                    this.hideBuildingTooltip();
                });
                
                // Add HP dots instead of bar
                const hpDots = this.createHPDots(building.hp, building.maxHp);
                buildingElement.appendChild(hpDots);
                
                cell.appendChild(buildingElement);
            }
        });
    },

    // Render balls
    renderBalls() {
        const board = document.getElementById('gameBoard');
        
        board.querySelectorAll('.ball').forEach(ball => ball.remove());
        
        window.gameState.balls.forEach(ball => {
            const ballElement = document.createElement('div');
            ballElement.className = `ball ball-p${ball.owner}`;
            ballElement.style.left = `${ball.x}px`;
            ballElement.style.top = `${ball.y}px`;
            ballElement.style.border = '2px solid #ffffff';
            ballElement.style.boxSizing = 'border-box';
            
            // Apply visual effects based on ball state
            if (ball.cripplingSnare && ball.cripplingSnare > 0) {
                // Crippling snare effect: dark red glow with roots/chains
                ballElement.style.boxShadow = `0 0 20px rgba(139, 0, 0, 0.9), inset 0 0 10px rgba(139, 0, 0, 0.5)`;
                ballElement.style.border = '2px solid #8B0000';
                ballElement.style.transform = 'scale(0.8)';
                ballElement.style.filter = 'brightness(0.6) contrast(1.2)';
                
                // Add pulsing animation for snared balls
                ballElement.style.animation = 'snare-pulse 1s ease-in-out infinite alternate';
            } else if (ball.speedBoost && ball.speedBoost > 0) {
                ballElement.style.boxShadow = `0 0 15px rgba(255, 255, 0, 0.8)`;
                ballElement.style.transform = 'scale(1.3)';
            } else if (ball.slowEffect && ball.slowEffect > 0) {
                ballElement.style.boxShadow = `0 0 10px rgba(0, 0, 255, 0.6)`;
                ballElement.style.filter = 'brightness(0.8)';
            }
            
            board.appendChild(ballElement);
        });
    },

    // Render missiles
    renderMissiles() {
        const board = document.getElementById('gameBoard');
        
        // Remove existing missiles
        board.querySelectorAll('.missile').forEach(missile => missile.remove());
        
        if (!window.gameState.missiles) return;
        
        window.gameState.missiles.forEach(missile => {
            const missileElement = document.createElement('div');
            missileElement.className = 'missile';
            missileElement.style.position = 'absolute';
            missileElement.style.left = `${missile.x - 6}px`;
            missileElement.style.top = `${missile.y - 6}px`;
            missileElement.style.width = '12px';
            missileElement.style.height = '12px';
            missileElement.style.background = 'radial-gradient(circle, #ff0000 0%, #ff6600 50%, #ffff00 100%)';
            missileElement.style.borderRadius = '50%';
            missileElement.style.boxShadow = '0 0 15px #ff0000, 0 0 30px #ff6600';
            missileElement.style.zIndex = '15';
            
            // Add trailing effect
            missileElement.style.filter = 'drop-shadow(0 0 8px #ff0000)';
            
            board.appendChild(missileElement);
        });
    },

    // Create explosion effect
    createExplosionEffect(x, y) {
        const board = document.getElementById('gameBoard');
        const explosion = document.createElement('div');
        explosion.className = 'explosion-effect';
        explosion.style.position = 'absolute';
        explosion.style.left = `${x - 25}px`;
        explosion.style.top = `${y - 25}px`;
        explosion.style.width = '50px';
        explosion.style.height = '50px';
        explosion.style.background = 'radial-gradient(circle, #ffffff 0%, #ffff00 20%, #ff6600 40%, #ff0000 60%, transparent 100%)';
        explosion.style.borderRadius = '50%';
        explosion.style.zIndex = '20';
        explosion.style.animation = 'nuclear-explosion 0.8s ease-out';
        explosion.style.pointerEvents = 'none';
        
        board.appendChild(explosion);
        
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.remove();
            }
        }, 800);
    },

    // Create snare effect for individual ball
    createSnareEffect(ball) {
        const board = document.getElementById('gameBoard');
        const snareEffect = document.createElement('div');
        snareEffect.className = 'snare-effect';
        snareEffect.style.position = 'absolute';
        snareEffect.style.left = `${ball.x - 20}px`;
        snareEffect.style.top = `${ball.y - 20}px`;
        snareEffect.style.width = '40px';
        snareEffect.style.height = '40px';
        snareEffect.style.background = 'radial-gradient(circle, transparent 30%, rgba(139, 0, 0, 0.3) 40%, rgba(139, 0, 0, 0.6) 60%, transparent 70%)';
        snareEffect.style.borderRadius = '50%';
        snareEffect.style.zIndex = '10';
        snareEffect.style.animation = 'snare-bind 0.8s ease-out';
        snareEffect.style.pointerEvents = 'none';
        snareEffect.style.border = '2px dashed #8B0000';
        
        board.appendChild(snareEffect);
        
        setTimeout(() => {
            if (snareEffect.parentNode) {
                snareEffect.remove();
            }
        }, 800);
    },

    // Create fortress activation effect with diminishing returns indicator
    createFortressActivationEffect(building, effectivenessFactor = 1, useCount = 1) {
        const board = document.getElementById('gameBoard');
        const centerX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE / 2;
        const centerY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE / 2;
        
        // Create expanding shockwave effect with diminishing intensity
        const shockwave = document.createElement('div');
        shockwave.className = 'fortress-shockwave';
        shockwave.style.position = 'absolute';
        shockwave.style.left = `${centerX - 30}px`;
        shockwave.style.top = `${centerY - 30}px`;
        shockwave.style.width = '60px';
        shockwave.style.height = '60px';
        
        // Adjust color intensity based on effectiveness
        const redIntensity = Math.floor(139 * effectivenessFactor);
        const alpha = 0.4 + (0.4 * effectivenessFactor); // 0.4 to 0.8 alpha
        
        shockwave.style.background = `radial-gradient(circle, transparent 40%, rgba(${redIntensity}, 0, 0, ${alpha * 0.5}) 50%, rgba(${redIntensity}, 0, 0, ${alpha}) 60%, transparent 70%)`;
        shockwave.style.borderRadius = '50%';
        shockwave.style.zIndex = '25';
        shockwave.style.animation = 'fortress-shockwave 1s ease-out';
        shockwave.style.pointerEvents = 'none';
        shockwave.style.border = `3px solid rgba(${redIntensity}, 0, 0, ${alpha})`;
        
        board.appendChild(shockwave);
        
        // Flash the fortress itself with diminishing intensity
        this.flashBuilding(building, effectivenessFactor);
        
        setTimeout(() => {
            if (shockwave.parentNode) {
                shockwave.remove();
            }
        }, 1000);
    },

    // Show diminishing returns message
    showDiminishingReturnsMessage(building, effectivenessFactor, actualDuration) {
        const board = document.getElementById('gameBoard');
        const centerX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE / 2;
        const centerY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE / 2;
        
        const message = document.createElement('div');
        message.className = 'diminishing-returns-message';
        message.style.position = 'absolute';
        message.style.left = `${centerX - 40}px`;
        message.style.top = `${centerY - 50}px`;
        message.style.width = '80px';
        message.style.textAlign = 'center';
        message.style.fontSize = '10px';
        message.style.fontWeight = 'bold';
        message.style.color = '#FF6B6B';
        message.style.textShadow = '1px 1px 2px #000';
        message.style.zIndex = '30';
        message.style.animation = 'diminishing-message 2s ease-out';
        message.style.pointerEvents = 'none';
        
        const percentage = Math.round(effectivenessFactor * 100);
        const frames = actualDuration;
        message.innerHTML = `${percentage}%<br>${frames}f`;
        
        board.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 2000);
    },

    createTransformationEffect(x, y, newCard) {
        const board = document.getElementById('gameBoard');
        const centerX = x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE / 2;
        const centerY = y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE / 2;
        
        // Create swirling energy effect
        const transformation = document.createElement('div');
        transformation.className = 'transformation-effect';
        transformation.style.position = 'absolute';
        transformation.style.left = `${centerX - 20}px`;
        transformation.style.top = `${centerY - 20}px`;
        transformation.style.width = '40px';
        transformation.style.height = '40px';
        transformation.style.background = 'conic-gradient(from 0deg, #ff00ff, #00ffff, #ffff00, #ff00ff)';
        transformation.style.borderRadius = '50%';
        transformation.style.zIndex = '25';
        transformation.style.animation = 'metamorphic-transformation 1.2s ease-in-out';
        transformation.style.pointerEvents = 'none';
        transformation.style.boxShadow = '0 0 30px #ff00ff, 0 0 60px #00ffff';
        
        board.appendChild(transformation);
        
        // Show the new card image in the center after a delay
        setTimeout(() => {
            const newCardDisplay = document.createElement('div');
            newCardDisplay.style.position = 'absolute';
            newCardDisplay.style.left = `${centerX - 15}px`;
            newCardDisplay.style.top = `${centerY - 15}px`;
            newCardDisplay.style.width = '30px';
            newCardDisplay.style.height = '30px';
            newCardDisplay.style.zIndex = '30';
            newCardDisplay.style.animation = 'card-appear 0.6s ease-out';
            newCardDisplay.style.pointerEvents = 'none';
            
            // Try to show building image, fallback to emoji
            const newCardImg = document.createElement('img');
            newCardImg.style.width = '30px';
            newCardImg.style.height = '30px';
            newCardImg.style.objectFit = 'cover';
            newCardImg.style.borderRadius = '4px';
            newCardImg.src = `buildings/${newCard.id}.png`;
            newCardImg.alt = newCard.name;
            newCardImg.onerror = () => {
                newCardImg.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.style.fontSize = '24px';
                fallback.style.textAlign = 'center';
                fallback.style.lineHeight = '30px';
                fallback.style.textShadow = '0 0 10px #ffffff';
                fallback.innerHTML = newCard.emoji;
                newCardDisplay.appendChild(fallback);
            };
            
            newCardDisplay.appendChild(newCardImg);
            board.appendChild(newCardDisplay);
            
            setTimeout(() => {
                if (newCardDisplay.parentNode) {
                    newCardDisplay.remove();
                }
            }, 600);
        }, 600);
        
        setTimeout(() => {
            if (transformation.parentNode) {
                transformation.remove();
            }
        }, 1200);
    },

    // Building tooltip functions
    showBuildingTooltip(building, event) {
        const tooltip = document.getElementById('buildingTooltip');
        const tooltipEmoji = document.getElementById('tooltipEmoji');
        const tooltipName = document.getElementById('tooltipName');
        const tooltipHealth = document.getElementById('tooltipHealth');
        const tooltipDescription = document.getElementById('tooltipDescription');
        const tooltipCost = document.getElementById('tooltipCost');
        
        // Set tooltip content (keep emoji in tooltip for readability)
        tooltipEmoji.textContent = building.cardData ? building.cardData.emoji : '🏢';
        tooltipName.textContent = building.cardData ? building.cardData.name : 'Building';
        tooltipHealth.textContent = `${building.hp}/${building.maxHp}`;
        tooltipDescription.textContent = building.cardData ? building.cardData.description : 'Basic structure';
        tooltipCost.textContent = building.cardData ? building.cardData.cost : '0';
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2 - 50;
        let top = rect.top - 80;
        
        // Adjust if tooltip goes off screen
        if (left < 10) left = 10;
        if (left + 100 > window.innerWidth - 10) left = window.innerWidth - 110;
        if (top < 10) top = rect.bottom + 10;
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.display = 'block';
    },
    
    hideBuildingTooltip() {
        document.getElementById('buildingTooltip').style.display = 'none';
    },

    // Show card tooltip (for hand cards)
    showCardTooltip(card, event) {
        const tooltip = document.getElementById('buildingTooltip');
        const tooltipEmoji = document.getElementById('tooltipEmoji');
        const tooltipName = document.getElementById('tooltipName');
        const tooltipHealth = document.getElementById('tooltipHealth');
        const tooltipDescription = document.getElementById('tooltipDescription');
        const tooltipCost = document.getElementById('tooltipCost');
        
        // Set tooltip content for card (keep emoji in tooltip for readability)
        tooltipEmoji.textContent = card.emoji;
        tooltipName.textContent = card.name;
        tooltipHealth.textContent = `${card.hp} HP`;
        tooltipDescription.textContent = card.description;
        tooltipCost.textContent = card.cost;
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        let left = rect.right + 10;
        let top = rect.top;
        
        // Adjust if tooltip goes off screen
        if (left + 120 > window.innerWidth) left = rect.left - 120;
        if (top + 80 > window.innerHeight) top = window.innerHeight - 90;
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.display = 'block';
    },

    hideCardTooltip() {
        document.getElementById('buildingTooltip').style.display = 'none';
    },

    // Create chain lightning visual effect
    createChainLightning(building, targets) {
        const board = document.getElementById('gameBoard');
        const buildingX = building.x * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
        const buildingY = building.y * window.GameState.CELL_SIZE + window.GameState.CELL_SIZE/2;
        
        // Flash the building
        this.flashBuilding(building);
        
        targets.forEach((target, index) => {
            setTimeout(() => {
                // Create lightning bolt
                const lightning = document.createElement('div');
                lightning.className = 'chain-lightning';
                lightning.style.position = 'absolute';
                lightning.style.background = 'linear-gradient(90deg, #ffff00, #00ffff, #ffff00)';
                lightning.style.height = '3px';
                lightning.style.zIndex = '15';
                lightning.style.boxShadow = '0 0 15px #ffff00, 0 0 30px #00ffff';
                lightning.style.borderRadius = '2px';
                lightning.style.opacity = '0.9';
                
                // Calculate position and angle
                const dx = target.x - buildingX;
                const dy = target.y - buildingY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                
                lightning.style.width = `${distance}px`;
                lightning.style.left = `${buildingX}px`;
                lightning.style.top = `${buildingY}px`;
                lightning.style.transform = `rotate(${angle}deg)`;
                lightning.style.transformOrigin = '0 50%';
                
                // Add pulsing animation
                lightning.style.animation = 'lightning-pulse 0.3s ease-out';
                
                board.appendChild(lightning);
                
                // Create impact effect at target
                this.createImpactEffect(target.x, target.y);
                
                // Remove lightning after animation
                setTimeout(() => {
                    if (lightning.parentNode) {
                        lightning.remove();
                    }
                }, 300);
                
            }, index * 50);
        });
    },

    // Flash building when it activates with diminishing intensity
    flashBuilding(building, effectivenessFactor = 1) {
        const buildingElement = document.querySelector(`[data-building-id="${building.x}-${building.y}"]`);
        if (buildingElement) {
            const yellowIntensity = Math.floor(255 * effectivenessFactor);
            const cyanIntensity = Math.floor(255 * effectivenessFactor);
            
            buildingElement.style.background = `rgb(${yellowIntensity}, ${yellowIntensity}, 0)`;
            buildingElement.style.boxShadow = `0 0 ${20 * effectivenessFactor}px rgb(${yellowIntensity}, ${yellowIntensity}, 0)`;
            buildingElement.style.transform = `scale(${1 + 0.2 * effectivenessFactor})`;
            
            setTimeout(() => {
                buildingElement.style.background = `rgb(0, ${cyanIntensity}, ${cyanIntensity})`;
                buildingElement.style.boxShadow = '';
                buildingElement.style.transform = 'scale(1)';
            }, 200);
        }
    },

    // Create impact effect at target location
    createImpactEffect(x, y) {
        const board = document.getElementById('gameBoard');
        const impact = document.createElement('div');
        impact.className = 'impact-effect';
        impact.style.position = 'absolute';
        impact.style.left = `${x - 10}px`;
        impact.style.top = `${y - 10}px`;
        impact.style.width = '20px';
        impact.style.height = '20px';
        impact.style.background = 'radial-gradient(circle, #ffff00, #ff0000, transparent)';
        impact.style.borderRadius = '50%';
        impact.style.zIndex = '20';
        impact.style.animation = 'impact-explosion 0.4s ease-out';
        impact.style.pointerEvents = 'none';
        
        board.appendChild(impact);
        
        setTimeout(() => {
            if (impact.parentNode) {
                impact.remove();
            }
        }, 400);
    },

    // Deck builder UI - Updated for large cards with limit checking
    showDeckBuilder() {
        window.gameState.deckBuilding.isBuilding = true;
        window.gameState.deckBuilding.currentDeck = [];
        document.getElementById('deckBuilder').classList.remove('hidden');
        this.showNextCardSelection();
    },

    showNextCardSelection() {
        // Auto-finish when we reach exactly 14 cards
        if (window.gameState.deckBuilding.currentDeck.length >= window.GameState.MIN_CARDS) {
            this.finishDeckBuilding();
            return;
        }
        
        window.gameState.deckBuilding.cardSelection = window.LunarCards.getCardSelection();
        const selectionDiv = document.getElementById('cardSelection');
        selectionDiv.innerHTML = '';
        
        window.gameState.deckBuilding.cardSelection.forEach((card, index) => {
            const cardElement = this.createDeckBuilderCardElement(card);
            
            // Check if card can be selected (not at limit)
            const currentCount = window.gameState.deckBuilding.currentDeck.filter(c => c.id === card.id).length;
            const maxAllowed = card.rarity === 'legendary' ? 1 : 4;
            const isAtLimit = currentCount >= maxAllowed;
            
            if (!isAtLimit) {
                cardElement.addEventListener('click', () => this.selectDeckCard(card, index));
            }
            
            selectionDiv.appendChild(cardElement);
        });
        
        // Update progress text if it exists
        const progressElement = document.getElementById('deckProgress');
        if (progressElement) {
            progressElement.textContent = `${window.gameState.deckBuilding.currentDeck.length}/${window.GameState.MIN_CARDS}`;
        }
    },

    selectDeckCard(card, index) {
        // Check limit before adding
        const currentCount = window.gameState.deckBuilding.currentDeck.filter(c => c.id === card.id).length;
        const maxAllowed = card.rarity === 'legendary' ? 1 : 4;
        
        if (currentCount >= maxAllowed) {
            return; // Can't add more of this card
        }
        
        // Remove selection from all cards
        document.querySelectorAll('.deck-builder-large-card').forEach(c => c.classList.remove('selected'));
        
        // Add selection to clicked card
        const clickedCard = document.querySelector(`[data-card-id="${card.id}"]`);
        if (clickedCard) {
            clickedCard.classList.add('selected');
        }
        
        // Add card to deck and continue
        window.gameState.deckBuilding.currentDeck.push({...card});
        
        // Small delay to show selection, then continue
        setTimeout(() => {
            this.showNextCardSelection();
        }, 500);
    },

    finishDeckBuilding() {
        // Convert deck to collection format
        const collection = {};
        window.gameState.deckBuilding.currentDeck.forEach(card => {
            collection[card.id] = (collection[card.id] || 0) + 1;
        });
        
        // Save to collection system
        if (window.CardCollection) {
            window.CardCollection.saveCollection(collection);
        }
        
        // Update game state
        window.gameState.playerDeck = [...window.gameState.deckBuilding.currentDeck];
        window.gameState.playerHand = [];
        
        window.gameState.players[0].deck = [...window.gameState.playerDeck];
        window.gameState.players[0].hand = [];
        for (let i = 0; i < window.GameState.HAND_SIZE && window.gameState.players[0].deck.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * window.gameState.players[0].deck.length);
            window.gameState.players[0].hand.push(window.gameState.players[0].deck.splice(randomIndex, 1)[0]);
        }
        
        window.gameState.playerDeck = [...window.gameState.players[0].deck];
        window.gameState.playerHand = [...window.gameState.players[0].hand];
        
        // Close deck builder
        document.getElementById('deckBuilder').classList.add('hidden');
        window.gameState.deckBuilding.isBuilding = false;
        
        // Update UI
        this.updateHandDisplay();
        this.updateUI();
        
        // Update button text
        const deckOrCardsBtn = document.getElementById('deckOrCardsBtn');
        if (deckOrCardsBtn) {
            deckOrCardsBtn.textContent = 'CARDS';
            deckOrCardsBtn.title = 'View and manage your card collection';
        }
    },

    // Update custom cursor position
    updateCustomCursor(e) {
        if (window.gameState.selectedCard) {
            const cursor = document.getElementById('customCursor');
            const cursorImage = document.getElementById('customCursorImage');
            
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            
            if (cursorImage) {
                cursorImage.style.left = e.clientX + 'px';
                cursorImage.style.top = e.clientY + 'px';
            }
        }
    },

    // Initialize UI with empty state
    initializeUI() {
        // Add CSS animations for lightning effects and transformation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes lightning-pulse {
                0% { opacity: 0; transform: scaleX(0) rotate(var(--rotation)); }
                50% { opacity: 1; transform: scaleX(1) rotate(var(--rotation)); }
                100% { opacity: 0; transform: scaleX(1) rotate(var(--rotation)); }
            }
            
            @keyframes impact-explosion {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.8; }
                100% { transform: scale(3); opacity: 0; }
            }
            
            @keyframes metamorphic-transformation {
                0% { 
                    transform: scale(0) rotate(0deg); 
                    opacity: 0.8; 
                    filter: blur(0px);
                }
                25% { 
                    transform: scale(1.2) rotate(90deg); 
                    opacity: 1; 
                    filter: blur(2px);
                }
                50% { 
                    transform: scale(0.8) rotate(180deg); 
                    opacity: 0.9; 
                    filter: blur(4px);
                }
                75% { 
                    transform: scale(1.5) rotate(270deg); 
                    opacity: 1; 
                    filter: blur(2px);
                }
                100% { 
                    transform: scale(0) rotate(360deg); 
                    opacity: 0; 
                    filter: blur(0px);
                }
            }
            
            @keyframes snare-pulse {
                0% { 
                    box-shadow: 0 0 20px rgba(139, 0, 0, 0.9), inset 0 0 10px rgba(139, 0, 0, 0.5);
                    filter: brightness(0.6) contrast(1.2);
                }
                100% { 
                    box-shadow: 0 0 30px rgba(139, 0, 0, 1), inset 0 0 15px rgba(139, 0, 0, 0.8);
                    filter: brightness(0.4) contrast(1.4);
                }
            }
            
            @keyframes snare-bind {
                0% { 
                    transform: scale(0) rotate(0deg); 
                    opacity: 0;
                    border-color: transparent;
                }
                50% { 
                    transform: scale(1.2) rotate(180deg); 
                    opacity: 0.8;
                    border-color: #8B0000;
                }
                100% { 
                    transform: scale(1) rotate(360deg); 
                    opacity: 0.6;
                    border-color: #654321;
                }
            }
            
            @keyframes aura-pulse {
                0%, 100% { 
                    opacity: 0.6;
                    transform: scale(1);
                }
                50% { 
                    opacity: 1;
                    transform: scale(1.1);
                }
            }
            
            @keyframes shield-pulse {
                0%, 100% { 
                    opacity: 0.6;
                    box-shadow: 0 0 8px rgba(74, 144, 226, 0.6);
                }
                50% { 
                    opacity: 1;
                    box-shadow: 0 0 12px rgba(74, 144, 226, 0.9);
                }
            }
            
            @keyframes production-pulse {
                0%, 100% { 
                    opacity: 0.6;
                    box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
                }
                50% { 
                    opacity: 1;
                    box-shadow: 0 0 12px rgba(255, 215, 0, 0.9);
                }
            }
            
            @keyframes card-appear {
                0% { 
                    transform: scale(0) rotate(-180deg); 
                    opacity: 0; 
                }
                50% { 
                    transform: scale(1.2) rotate(0deg); 
                    opacity: 0.8; 
                }
                100% { 
                    transform: scale(1) rotate(0deg); 
                    opacity: 1; 
                }
            }
            
            @keyframes nuclear-explosion {
                0% { transform: scale(0); opacity: 1; }
                25% { transform: scale(0.5); opacity: 1; }
                50% { transform: scale(1); opacity: 0.8; }
                75% { transform: scale(1.5); opacity: 0.4; }
                100% { transform: scale(2); opacity: 0; }
            }
            
            @keyframes fortress-shockwave {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.6; }
                100% { transform: scale(3); opacity: 0; }
            }
            
            @keyframes diminishing-message {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
                100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
            }
            
            .chain-lightning {
                filter: drop-shadow(0 0 10px #ffff00);
            }
            
            .transformation-effect {
                filter: drop-shadow(0 0 20px #ff00ff);
            }
            
            /* Deck builder card limit styles */
            .deck-card-disabled {
                opacity: 0.4;
                pointer-events: none;
                filter: grayscale(0.8);
            }
            
            .card-limit-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #ff4444;
                font-weight: bold;
                text-align: center;
                z-index: 10;
                border-radius: 8px;
            }
            
            .limit-text {
                font-size: 14px;
                margin-bottom: 4px;
                text-shadow: 0 0 5px #ff4444;
            }
            
            .limit-count {
                font-size: 12px;
                color: #ffcccc;
            }
            
            .deck-builder-card-count {
                margin-top: 4px;
                font-size: 12px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
        
        // Update button text based on card collection status
        const deckOrCardsBtn = document.getElementById('deckOrCardsBtn');
        if (deckOrCardsBtn) {
            if (window.CardCollection && window.CardCollection.hasEnoughCards()) {
                deckOrCardsBtn.textContent = 'CARDS';
                deckOrCardsBtn.title = 'View and manage your card collection';
            } else {
                deckOrCardsBtn.textContent = 'DECK';
                deckOrCardsBtn.title = 'Build your first deck';
            }
        }
        
        if (!window.GameState.checkPlayerDeck()) {
            const handCards = document.getElementById('handCards');
            if (handCards) {
                handCards.innerHTML = `
                    <div class="text-center text-cyan-600 text-xs py-4 w-full">
                        ${window.CardCollection && window.CardCollection.hasEnoughCards() ? 'READY TO PLAY' : 'BUILD DECK TO START'}
                    </div>
                `;
            }
        } else {
            this.updateHandDisplay();
        }
        this.updateUI();
    }
};

// Export for use in main game
window.UIManager = UIManager;