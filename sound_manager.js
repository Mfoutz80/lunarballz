// Fixed Sound Manager - Handles all audio in the game
const SoundManager = {
    sounds: {},
    enabled: true,
    volume: 0.5,
    audioContext: null,
    lastPlayTimes: {}, // Track when sounds were last played
    backgroundMusic: null, // Background music element
    musicVolume: 0.7, // Background music volume (separate from sound effects)
    
    // Initialize the sound system
    init() {
        // Create audio context for better sound management
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('AudioContext not supported:', e);
        }
        
        // Preload common sounds
        this.preloadSounds();
        
        // Load background music
        this.loadBackgroundMusic();
        
        // Add volume control to UI if needed
        this.setupVolumeControl();
    },
    
    // Preload sound files
    preloadSounds() {
        const soundFiles = [
            'default_build',
            'coin_generate',
            'speed_boost',
            'teleport',
            'explosion',
            'chain_lightning',
            'snare_activate',
            'shield_activate',
            'ball_spawn',
            'building_destroy',
            'missile_launch',
            'transformation'
        ];
        
        soundFiles.forEach(soundName => {
            this.loadSound(soundName, `sounds/${soundName}.mp3`);
        });
    },
    
    // Load a sound file
    loadSound(name, path) {
        const audio = new Audio(path);
        audio.volume = this.volume;
        audio.preload = 'auto';
        
        // Handle loading errors gracefully
        audio.onerror = (e) => {
            console.warn(`Sound file not found or failed to load: ${path}`, e);
            this.sounds[name] = null;
        };
        
        audio.oncanplaythrough = () => {
            this.sounds[name] = audio;
            console.log(`Sound loaded successfully: ${name}`);
        };
        
        // Try to load immediately
        audio.load();
    },
    
    // Play a sound effect with cooldown checking
    playSound(soundName, volume = 1.0) {
        if (!this.enabled) return false;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not available: ${soundName}`);
            return false;
        }
        
        // Check cooldowns for specific sounds
        if (this.isSoundOnCooldown(soundName)) {
            return false;
        }
        
        try {
            // Clone the audio for multiple simultaneous plays
            const audioClone = sound.cloneNode();
            audioClone.volume = this.volume * volume;
            audioClone.currentTime = 0;
            
            // Update last play time
            this.lastPlayTimes[soundName] = Date.now();
            
            // Handle play promise
            const playPromise = audioClone.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn(`Sound play failed for ${soundName}:`, e.message);
                    // If autoplay is blocked, show a one-time message
                    if (e.name === 'NotAllowedError' && !this.autoplayWarningShown) {
                        console.log('Audio autoplay blocked by browser. User interaction required.');
                        this.autoplayWarningShown = true;
                    }
                });
            }
            return true;
        } catch (e) {
            console.warn(`Sound playback error for ${soundName}:`, e);
            return false;
        }
    },
    
    // Check if a sound is on cooldown
    isSoundOnCooldown(soundName) {
        const cooldowns = {
            'snare_activate': 60000,    // 1 minute
            'speed_boost': 10000,       // 10 seconds
            'teleport': 10000,          // 10 seconds
            'coin_generate': 5000,      // 5 seconds
            'chain_lightning': 4000     // 4 seconds
        };
        
        const cooldownTime = cooldowns[soundName];
        if (!cooldownTime) return false; // No cooldown for this sound
        
        const lastPlayTime = this.lastPlayTimes[soundName] || 0;
        const currentTime = Date.now();
        
        return (currentTime - lastPlayTime) < cooldownTime;
    },
    
    // Load background music
    loadBackgroundMusic() {
        this.backgroundMusic = new Audio('sounds/music/music.mp3');
        this.backgroundMusic.loop = true; // Loop the music
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.preload = 'auto';
        
        // Handle loading errors gracefully
        this.backgroundMusic.onerror = (e) => {
            console.warn('Background music file not found or failed to load: sounds/music/music.mp3', e);
            this.backgroundMusic = null;
        };
        
        this.backgroundMusic.oncanplaythrough = () => {
            console.log('Background music loaded successfully');
        };
        
        // Try to load immediately
        this.backgroundMusic.load();
    },
    
    // Start background music
    startBackgroundMusic() {
        if (!this.enabled || !this.backgroundMusic) return false;
        
        try {
            const playPromise = this.backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Background music started');
                }).catch(e => {
                    console.warn('Background music play failed:', e.message);
                    if (e.name === 'NotAllowedError') {
                        console.log('Background music blocked by browser. User interaction required.');
                    }
                });
            }
            return true;
        } catch (e) {
            console.warn('Background music playback error:', e);
            return false;
        }
    },
    
    // Stop background music
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            console.log('Background music stopped');
        }
    },
    
    // Set music volume (separate from sound effects)
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume;
        }
    },
    
    // Play building placement sound (only for human player)
    playBuildSound(card, playerId = 1) {
        // Only play sound for human player (ID 1)
        if (playerId === 1) {
            this.playSound('default_build');
        }
    },
    
    // Play specific game event sounds
    playBuildingDestroy() {
        this.playSound('building_destroy');
    },
    
    playMissileLaunch() {
        this.playSound('missile_launch');
    },
    
    playExplosion() {
        this.playSound('explosion');
    },
    
    playTransformation() {
        this.playSound('transformation');
    },
    
    playChainLightning() {
        this.playSound('chain_lightning');
    },
    
    playSnareActivate() {
        this.playSound('snare_activate');
    },
    
    playBallSpawn() {
        this.playSound('ball_spawn');
    },
    
    playCoinGenerate() {
        this.playSound('coin_generate');
    },
    
    playSpeedBoost() {
        this.playSound('speed_boost');
    },
    
    playTeleport() {
        this.playSound('teleport');
    },
    
    // Resume audio context (needed for some browsers)
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed');
                // Try to start background music after resuming context
                this.startBackgroundMusic();
            }).catch(e => {
                console.warn('Failed to resume audio context:', e);
            });
        } else {
            // If context is already running, just start the music
            this.startBackgroundMusic();
        }
    },
    
    // Toggle sound on/off (affects both SFX and music)
    toggleSound() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        console.log(`Sound ${this.enabled ? 'enabled' : 'disabled'}`);
        return this.enabled;
    },
    
    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update all loaded sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.volume;
            }
        });
    },
    
    // Setup volume control
    setupVolumeControl() {
        // This can be expanded later for UI controls
    }
};

// Export for use in main game
window.SoundManager = SoundManager;