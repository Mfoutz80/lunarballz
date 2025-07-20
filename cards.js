// Lunar Conquest Card System
// All potential cards for the deck-building system

// Make sure this works in both browser and Node.js environments
(function(global) {
    'use strict';

const CARD_POOL = [
    // === LUNAR THEMED CARDS ===
    {
        id: 'lunar_outpost',
        name: 'LUNAR OUTPOST',
        emoji: '🌙',
        type: 'building',
        cost: 20,
        hp: 6,
        description: 'Grants 2 balls when built. Lose balls if destroyed.',
        effect: 'spawn_balls',
        effectValue: 2,
        rarity: 'common'
    },
    {
        id: 'moon_drill',
        name: 'MOON DRILL',
        emoji: '⛏️',
        type: 'building',
        cost: 25,
        hp: 8,
        description: 'Ball hits generate 4 coins per hit',
        effect: 'generate_coins',
        effectValue: 4,
        rarity: 'epic'
    },
    {
        id: 'crater_launcher',
        name: 'CRATER LAUNCHER',
        emoji: '🚀',
        type: 'building',
        cost: 10,
        hp: 5,
        description: 'Ball hits grant 6s speed boost',
        effect: 'speed_boost',
        effectValue: 360, // 6 seconds at 60fps
        rarity: 'rare'
    },
    {
        id: 'lunar_beacon',
        name: 'LUNAR BEACON',
        emoji: '🔆',
        type: 'building',
        cost: 60,
        hp: 7,
        description: 'Ball hits pull all friendly balls toward this building',
        effect: 'attract_balls',
        effectValue: 50,
        rarity: 'common'
    },
    {
        id: 'moon_base',
        name: 'MOON BASE',
        emoji: '🏭',
        type: 'building',
        cost: 50,
        hp: 10,
        description: 'Spawns 1 ball every 15 seconds',
        effect: 'continuous_spawn',
        effectValue: 900, // 15 seconds at 60fps
        rarity: 'rare'
    },
    {
        id: 'regolith_farm',
        name: 'REGOLITH FARM',
        emoji: '🌾',
        type: 'building',
        cost: 25,
        hp: 6,
        description: 'Generates 2 coins every 2.5 seconds',
        effect: 'passive_income',
        effectValue: 150, // 5 seconds at 60fps
        rarity: 'common'
    },
    {
        id: 'lunar_shield',
        name: 'LUNAR SHIELD',
        emoji: '🛡️',
        type: 'building',
        cost: 140,
        hp: 15,
        description: 'All buildings you control take 50% less damage from enemy balls',
        effect: 'global_damage_reduction',
        effectValue: 0.5,
        rarity: 'legendary'
    },
    {
        id: 'lunar_bastion',
        name: 'LUNAR BASTION',
        emoji: '💰',
        type: 'building',
        cost: 150,
        hp: 15,
        description: 'Boosts all your buildings to produce 50% more credits.',
        effect: 'increase_production',
        effectValue: 0.5,
        rarity: 'legendary'
    },
    {
        id: 'moon_catapult',
        name: 'MOON CATAPULT',
        emoji: '🎯',
        type: 'building',
        cost: 25,
        hp: 6,
        description: 'Ball hits launch balls toward enemy territory',
        effect: 'redirect_balls',
        effectValue: 2.0,
        rarity: 'uncommon'
    },
    {
        id: 'crater_collector',
        name: 'CRATER COLLECTOR',
        emoji: '🕳️',
        type: 'building',
        cost: 40,
        hp: 7,
        description: 'Ball hits slow down enemy balls for 3 seconds',
        effect: 'slow_enemies',
        effectValue: 180, // 3 seconds at 60fps
        rarity: 'epic'
    },
    {
        id: 'lunar_fortress',
        name: 'LUNAR FORTRESS',
        emoji: '🏰',
        type: 'building',
        cost: 200,
        hp: 2,
        description: 'Severely snares enemy balls for 3 seconds when hit by friendly balls(diminishing returns)',
        effect: 'crippling_snare',
        effectValue: 180, // 1 seconds at 60fps
        rarity: 'epic'
    },
    {
        id: 'nuclear_missiles',
        name: 'NUCLEAR SILO',
        emoji: '☢️',
        type: 'building',
        cost: 30,
        hp: 6,
        description: 'Upgrade player base to shoot missiles to destroy obstacles',
        effect: 'nuclear_missiles',
        effectValue: 1,
        rarity: 'legendary'
    },

    // === ALIEN THEMED CARDS ===
    {
        id: 'alien_pod',
        name: 'ALIEN POD',
        emoji: '🛸',
        type: 'building',
        cost: 50,
        hp: 5,
        description: 'Teleports friendly balls to random locations',
        effect: 'teleport_balls',
        effectValue: 1,
        rarity: 'uncommon'
    },
    {
        id: 'xenomorph_hive',
        name: 'XENOMORPH HIVE',
        emoji: '👾',
        type: 'building',
        cost: 40,
        hp: 8,
        description: 'Spawns 3 balls when built, 1 ball when destroyed',
        effect: 'xenomorph_hive',
        effectValue: 3,
        rarity: 'rare'
    },
    {
        id: 'plasma_generator',
        name: 'PLASMA GENERATOR',
        emoji: '⚡',
        type: 'building',
        cost: 20,
        hp: 12,
        description: 'Ball hits create chain lightning to nearby enemies',
        effect: 'chain_damage',
        effectValue: 2,
        rarity: 'uncommon'
    },
    {
        id: 'mind_control_tower',
        name: 'MIND CONTROL',
        emoji: '🧠',
        type: 'building',
        cost: 130,
        hp: 20,
        description: 'Ball hits convert enemy balls to your side',
        effect: 'convert_balls',
        effectValue: 1,
        rarity: 'legendary'
    },
    {
        id: 'gravity_well',
        name: 'GRAVITY WELL',
        emoji: '🌀',
        type: 'building',
        cost: 115,
        hp: 10,
        description: 'Pulls all balls toward this building',
        effect: 'gravity_pull',
        effectValue: 100,
        rarity: 'rare'
    },
    {
        id: 'alien_harvester',
        name: 'ALIEN HARVESTER',
        emoji: '🦑',
        type: 'building',
        cost: 10,
        hp: 20,
        description: 'Gains 1 coin for each enemy ball that passes nearby',
        effect: 'proximity_income',
        effectValue: 40, // Detection radius
        rarity: 'uncommon'
    },
    {
        id: 'warp_gate',
        name: 'WARP GATE',
        emoji: '🌌',
        type: 'building',
        cost: 250,
        hp: 12,
        description: 'Teleports balls to enemy castle area',
        effect: 'warp_to_castle',
        effectValue: 1,
        rarity: 'legendary'
    },
    {
        id: 'crystal_formation',
        name: 'CRYSTAL FORMATION',
        emoji: '💎',
        type: 'building',
        cost: 25,
        hp: 24,
        description: 'A formidable wall shielding your city from enemies.',
        effect: 'bounce_all_balls',
        effectValue: 1,
        rarity: 'common'
    },
    {
        id: 'energy_siphon',
        name: 'ENERGY SIPHON',
        emoji: '🔋',
        type: 'building',
        cost: 250,
        hp: 8,
        description: 'Ball hits drain 2 coins from enemy players',
        effect: 'drain_coins',
        effectValue: 2,
        rarity: 'legendary'
    },
    {
        id: 'metamorphic_spire',
        name: 'METAMORPHIC SPIRE',
        emoji: '🗼',
        type: 'building',
        cost: 20,
        hp: 1,
        description: 'Transforms into a random building when destroyed',
        effect: 'transform_on_death',
        effectValue: 1,
        rarity: 'uncommon'
    }
];

// Rarity weights for card selection
const RARITY_WEIGHTS = {
    common: 50,
    uncommon: 25,
    rare: 15,
    epic: 8,
    legendary: 2
};

// Get random card from pool based on rarity weights
function getRandomCard() {
    const totalWeight = Object.values(RARITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
        random -= weight;
        if (random <= 0) {
            const cardsOfRarity = CARD_POOL.filter(card => card.rarity === rarity);
            return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
        }
    }
    
    // Fallback to common
    const commonCards = CARD_POOL.filter(card => card.rarity === 'common');
    return commonCards[Math.floor(Math.random() * commonCards.length)];
}

// Get 3 random cards for selection
function getCardSelection() {
    return [getRandomCard(), getRandomCard(), getRandomCard()];
}

// Rarity colors for UI
const RARITY_COLORS = {
    common: 'from-gray-400 to-gray-600 border-gray-500',
    uncommon: 'from-green-400 to-green-600 border-green-500',
    rare: 'from-blue-400 to-blue-600 border-blue-500',
    epic: 'from-purple-400 to-purple-600 border-purple-500',
    legendary: 'from-yellow-400 to-yellow-600 border-yellow-500'
};

    // Export for use in main game
    global.LunarCards = {
        CARD_POOL: CARD_POOL,
        getRandomCard: getRandomCard,
        getCardSelection: getCardSelection,
        RARITY_COLORS: RARITY_COLORS,
        RARITY_WEIGHTS: RARITY_WEIGHTS
    };

})(typeof window !== 'undefined' ? window : this);