// End Game Modal Functions
const EndGameManager = {
    // Initialize styling for end game modal
    initializeStyles() {
        // Check if styles are already added to avoid duplicates
        if (document.getElementById('endGameStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'endGameStyles';
        style.textContent = `
    /* FORCE CLEAN END GAME MODAL STYLES - NO INTERFERENCE WITH NAVBAR */
    #endGameModal {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999 !important;
        background: rgba(0, 0, 0, 0.95) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
.end-game-modal {
    position: relative !important;
    margin: 0 auto !important;
    padding: 20px !important;
    max-width: 600px !important;
    width: 80% !important;
    max-height: 70vh !important;
    overflow: hidden !important;
    transform: none !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
}

.trophy-image {
    width: 80px !important;
    height: 80px !important;
    margin: 0 auto 15px auto !important;
    display: block !important;
}

.results-title {
    font-size: 24px !important;
    font-weight: 900 !important;
    color: white !important;
    margin-bottom: 20px !important;
    text-transform: uppercase !important;
    letter-spacing: 2px !important;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8) !important;
}

.continue-button {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
    border: 3px solid #10b981 !important;
    color: white !important;
    padding: 12px 24px !important;
    border-radius: 8px !important;
    font-size: 16px !important;
    font-weight: bold !important;
    cursor: pointer !important;
    transition: all 0.3s !important;
    text-transform: uppercase !important;
    letter-spacing: 1px !important;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    margin-top: 20px !important;
}
    
/* Container for ranking boxes - single row layout */
#playerRankings {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 10px !important;
    flex-wrap: nowrap !important;
    padding: 10px !important;
    max-width: 100% !important;
    overflow: visible !important;
    margin: 0 !important;
    position: relative !important;
}
    
/* Octagon corners for ranking boxes */
.ranking-box {
    position: relative !important;
    border-radius: 8px !important;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
    border: 2px solid #00ffff !important;
    overflow: hidden !important;
    padding: 10px !important;
    min-width: 100px !important;
    max-width: 120px !important;
    flex: 1 !important;
    text-align: center !important;
    opacity: 0 !important;
    transform: translateY(-50px) !important;
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    margin: 0 !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    height: 120px !important;
}
    
    /* Animated state - visible and in position */
    .ranking-box.animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    /* Staggered animation delays for each player */
    .ranking-box.player-1 {
        transition-delay: 0.1s !important;
        border-color: #ff69b4 !important;
        border-width: 4px !important;
        box-shadow: 
            0 0 20px rgba(255, 105, 180, 0.6),
            0 0 40px rgba(255, 105, 180, 0.4),
            inset 0 0 20px rgba(255, 105, 180, 0.1) !important;
        transform: translateY(-100px) scale(1.05) !important;
        z-index: 10 !important;
    }
    
    .ranking-box.player-1.animate-in {
        transform: translateY(0) scale(1.05) !important;
    }
    
    .ranking-box.player-2 {
        transition-delay: 0.3s !important;
        border-color: #00ff00 !important;
    }
    
    .ranking-box.player-3 {
        transition-delay: 0.5s !important;
        border-color: #9370db !important;
    }
    
    .ranking-box.player-4 {
        transition-delay: 0.7s !important;
        border-color: #ffa500 !important;
    }
    
    /* Enhanced text styling for octagon boxes */
    .ranking-place {
        font-weight: bold !important;
        text-shadow: 0 0 10px currentColor !important;
        font-size: 1.2em !important;
        position: relative !important;
        z-index: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    
    .ranking-reward {
        color: #00ffff !important;
        text-shadow: 0 0 8px #00ffff !important;
        position: relative !important;
        z-index: 1 !important;
        margin: 10px 0 !important;
        padding: 0 !important;
    }
    
    .ranking-territory {
        color: #ffff00 !important;
        text-shadow: 0 0 8px #ffff00 !important;
        position: relative !important;
        z-index: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
    }

            
            /* Octagon corners for ranking boxes */
            .ranking-box {
                position: relative;
                border-radius: 0 !important;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #00ffff;
                clip-path: polygon(
                    15px 0%, 
                    calc(100% - 15px) 0%, 
                    100% 15px, 
                    100% calc(100% - 15px), 
                    calc(100% - 15px) 100%, 
                    15px 100%, 
                    0% calc(100% - 15px), 
                    0% 15px
                );
                overflow: hidden;
                padding: 15px;
                min-width: 140px;
                max-width: 160px;
                flex: 1;
                text-align: center;
                /* Initial state - hidden and positioned off-screen */
                opacity: 0;
                transform: translateY(-100px);
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            /* Animated state - visible and in position */
            .ranking-box.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* Staggered animation delays for each player */
            .ranking-box.player-1 {
                transition-delay: 0.1s;
            }
            
            .ranking-box.player-2 {
                transition-delay: 0.3s;
            }
            
            .ranking-box.player-3 {
                transition-delay: 0.5s;
            }
            
            .ranking-box.player-4 {
                transition-delay: 0.7s;
            }
            
            /* Animated background lines */
            .ranking-box::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(0, 255, 255, 0.1) 10px,
                    rgba(0, 255, 255, 0.1) 12px,
                    transparent 12px,
                    transparent 22px,
                    rgba(0, 255, 255, 0.15) 22px,
                    rgba(0, 255, 255, 0.15) 24px
                );
                animation: movingLines 3s linear infinite;
                z-index: 0;
            }
            
            /* Player-specific animated lines */
            .ranking-box.player-1::after {
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255, 105, 180, 0.1) 10px,
                    rgba(255, 105, 180, 0.1) 12px,
                    transparent 12px,
                    transparent 22px,
                    rgba(255, 105, 180, 0.15) 22px,
                    rgba(255, 105, 180, 0.15) 24px
                );
            }
            
            .ranking-box.player-2::after {
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(0, 255, 0, 0.1) 10px,
                    rgba(0, 255, 0, 0.1) 12px,
                    transparent 12px,
                    transparent 22px,
                    rgba(0, 255, 0, 0.15) 22px,
                    rgba(0, 255, 0, 0.15) 24px
                );
            }
            
            .ranking-box.player-3::after {
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(147, 112, 219, 0.1) 10px,
                    rgba(147, 112, 219, 0.1) 12px,
                    transparent 12px,
                    transparent 22px,
                    rgba(147, 112, 219, 0.15) 22px,
                    rgba(147, 112, 219, 0.15) 24px
                );
            }
            
            .ranking-box.player-4::after {
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255, 165, 0, 0.1) 10px,
                    rgba(255, 165, 0, 0.1) 12px,
                    transparent 12px,
                    transparent 22px,
                    rgba(255, 165, 0, 0.15) 22px,
                    rgba(255, 165, 0, 0.15) 24px
                );
            }
            
            /* Moving lines animation */
            @keyframes movingLines {
                0% {
                    left: -100%;
                }
                100% {
                    left: 100%;
                }
            }
            
            /* Octagon glow effect */
            .ranking-box::before {
                content: '';
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff);
                clip-path: polygon(
                    15px 0%, 
                    calc(100% - 15px) 0%, 
                    100% 15px, 
                    100% calc(100% - 15px), 
                    calc(100% - 15px) 100%, 
                    15px 100%, 
                    0% calc(100% - 15px), 
                    0% 15px
                );
                z-index: -1;
                opacity: 0.3;
                animation: octagonGlow 2s ease-in-out infinite alternate;
            }
            
            /* Player-specific colors for ranking boxes */
            .ranking-box.player-1 {
                border-color: #ff69b4;
                border-width: 4px;
                box-shadow: 
                    0 0 20px rgba(255, 105, 180, 0.6),
                    0 0 40px rgba(255, 105, 180, 0.4),
                    inset 0 0 20px rgba(255, 105, 180, 0.1);
                transform: scale(1.05);
                z-index: 10;
            }
            
            .ranking-box.player-1::before {
                background: linear-gradient(45deg, #ff69b4, #ff1493, #ff69b4);
                opacity: 0.6;
                animation: playerHighlight 1.5s ease-in-out infinite alternate;
            }
            
            .ranking-box.player-2 {
                border-color: #00ff00;
            }
            
            .ranking-box.player-2::before {
                background: linear-gradient(45deg, #00ff00, #32cd32, #00ff00);
            }
            
            .ranking-box.player-3 {
                border-color: #9370db;
            }
            
            .ranking-box.player-3::before {
                background: linear-gradient(45deg, #9370db, #8a2be2, #9370db);
            }
            
            .ranking-box.player-4 {
                border-color: #ffa500;
            }
            
            .ranking-box.player-4::before {
                background: linear-gradient(45deg, #ffa500, #ff8c00, #ffa500);
            }
            
            /* Glow animation */
            @keyframes octagonGlow {
                0% {
                    opacity: 0.2;
                    transform: scale(1);
                }
                100% {
                    opacity: 0.5;
                    transform: scale(1.02);
                }
            }
            
            /* Special pulsing animation for player 1 */
            @keyframes playerHighlight {
                0% {
                    opacity: 0.4;
                    transform: scale(1);
                }
                100% {
                    opacity: 0.8;
                    transform: scale(1.03);
                }
            }
            
            /* Enhanced text styling for octagon boxes */
            .ranking-place {
                font-weight: bold;
                text-shadow: 0 0 10px currentColor;
                font-size: 1.2em;
                position: relative;
                z-index: 1;
            }
            
            .ranking-reward {
                color: #00ffff;
                text-shadow: 0 0 8px #00ffff;
                position: relative;
                z-index: 1;
            }
            
            .ranking-territory {
                color: #ffff00;
                text-shadow: 0 0 8px #ffff00;
                position: relative;
                z-index: 1;
            }
        `;
        
        document.head.appendChild(style);
    },

    // Show end game results modal with new design
    showEndGameModal(gameResults) {
        // Initialize styles first
        this.initializeStyles();
        
        // Stop all game sounds and play end game music
        if (window.SoundManager) {
            window.SoundManager.stopBackgroundMusic();
            window.SoundManager.startEndGameMusic();
        }

        const modal = document.getElementById('endGameModal');
        const rankingsContainer = document.getElementById('playerRankings');
        
        // Clear previous rankings
        rankingsContainer.innerHTML = '';
        
        // Calculate territory percentages and sort players by territory
        const players = window.gameState.players.map(player => ({
            ...player,
            territoryPercentage: Math.round((player.territory / (window.GameState.GRID_SIZE * window.GameState.GRID_SIZE)) * 100)
        }));
        
        // Sort players by territory (descending)
        players.sort((a, b) => b.territory - a.territory);
        
        // Create ranking boxes for each player
        players.forEach((player, index) => {
            const rankingBox = document.createElement('div');
            rankingBox.className = `ranking-box player-${player.id}`;
            
            // Determine place text and reward
            let placeText, reward;
            switch (index) {
                case 0:
                    placeText = '1st<br>Place';
                    reward = `+${player.territory} <i class="netrva-lunite"></i>`;
                    break;
                case 1:
                    placeText = '2nd<br>Place';
                    reward = '+50 <i class="netrva-lunite"></i>';
                    break;
                case 2:
                    placeText = '3rd<br>Place';
                    reward = '+10 <i class="netrva-lunite"></i>';
                    break;
                case 3:
                    placeText = '4th<br>Place';
                    reward = 'No Reward';
                    break;
            }
            
            rankingBox.innerHTML = `
                <div class="ranking-place">${placeText}</div>
                <div class="ranking-reward">${reward}</div>
                <div class="ranking-territory">
                    <i class="netrva-pie_chart"></i>
                    ${player.territoryPercentage}%
                </div>
            `;
            
            rankingsContainer.appendChild(rankingBox);
        });
        
        // Award dust based on rankings
        if (window.LunarDust) {
            players.forEach((player, index) => {
                // Only award dust to human player (Player 1)
                if (player.id === 1) {
                    let dustEarned = 0;
                    switch (index) {
                        case 0: // 1st place
                            dustEarned = player.territory;
                            break;
                        case 1: // 2nd place
                            dustEarned = 50;
                            break;
                        case 2: // 3rd place
                            dustEarned = 10;
                            break;
                        case 3: // 4th place
                            dustEarned = 0;
                            break;
                    }
                    
                    if (dustEarned > 0) {
                        window.LunarDust.addDust(dustEarned);
                    }
                }
            });
        }
        
        // Show the modal first (background visible)
        modal.classList.remove('hidden');
        
        // Wait 1 second, then animate boxes sliding in
        setTimeout(() => {
            const rankingBoxes = rankingsContainer.querySelectorAll('.ranking-box');
            rankingBoxes.forEach(box => {
                box.classList.add('animate-in');
            });
        }, 1000);
    },
    
    // Hide end game modal
    hideEndGameModal() {
        const modal = document.getElementById('endGameModal');
        modal.classList.add('hidden');
        
        // Stop end game music
        if (window.SoundManager) {
            window.SoundManager.stopEndGameMusic();
        }
    },
    
    // Calculate final rankings
    calculateRankings() {
        const players = [...window.gameState.players];
        
        // Sort by territory (primary), then by coins (secondary)
        players.sort((a, b) => {
            if (b.territory !== a.territory) {
                return b.territory - a.territory;
            }
            return b.coins - a.coins;
        });
        
        return players;
    }
};

// Add to window for global access
window.EndGameManager = EndGameManager;