// End Game Modal Functions
const EndGameManager = {
    // Show end game results modal with new design
    showEndGameModal(gameResults) {
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
                    placeText = '1st Place';
                    reward = `+${player.territory} 🌙`;
                    break;
                case 1:
                    placeText = '2nd Place';
                    reward = '+50 🌙';
                    break;
                case 2:
                    placeText = '3rd Place';
                    reward = '+10 🌙';
                    break;
                case 3:
                    placeText = '4th Place';
                    reward = 'No Reward';
                    break;
            }
            
            rankingBox.innerHTML = `
                <div class="ranking-place">${placeText}</div>
                <div class="ranking-reward">${reward}</div>
                <div class="ranking-territory">
                    <span class="pie-icon"></span>
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
        
        // Show the modal
        modal.classList.remove('hidden');
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