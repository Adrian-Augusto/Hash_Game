// ========== MAIN SETUP ========== //
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Elementos da tela de login
const loginScreen = document.getElementById("loginScreen");
const nicknameInput = document.getElementById("nickname");
const startButton = document.getElementById("startButton");

// Add game over screen elements
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// Add UI elements
const scoreDisplay = document.getElementById('scoreDisplay');
const bulletCount = document.getElementById('bulletCount');
const bulletCooldown = document.getElementById('bulletCooldown');

// Configuração do Socket.IO
const socket = io();

// Lista de jogadores conectados
let connectedPlayers = new Map();

// Elemento para mostrar a lista de jogadores
const playerList = document.createElement('div');
playerList.id = 'playerList';
playerList.style.cssText = `
    position: fixed;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    border-radius: 8px;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    display: none;
    z-index: 1000;
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    min-width: 200px;
`;

// Título da lista com contador
const playerListTitle = document.createElement('div');
playerListTitle.style.cssText = `
    font-size: 16px;
    font-weight: bold;
    color: #00bfff;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const titleText = document.createElement('span');
titleText.textContent = 'Jogadores Online';
titleText.style.cssText = 'text-transform: uppercase;';

const playerCount = document.createElement('span');
playerCount.style.cssText = `
    background: rgba(0, 191, 255, 0.2);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 14px;
`;

playerListTitle.appendChild(titleText);
playerListTitle.appendChild(playerCount);
playerList.appendChild(playerListTitle);

// Container para a lista de jogadores
const playerListContainer = document.createElement('div');
playerListContainer.style.cssText = `
    max-height: 300px;
    overflow-y: auto;
    padding-right: 5px;
`;
playerList.appendChild(playerListContainer);

document.body.appendChild(playerList);

// Eventos do Socket.IO
socket.on('connect', () => {
    console.log('Conectado ao servidor');
});

socket.on('currentPlayers', (players) => {
    console.log('Jogadores atuais recebidos:', players);
    connectedPlayers.clear();
    players.forEach(player => {
        if (player.nickname) {
            connectedPlayers.set(player.id, { 
                id: player.id,
                nickname: player.nickname.toUpperCase(),
                x: player.x || 0,
                y: player.y || 0,
                radius: player.radius || 20,
                color: player.color || '#FFFFFF',
                score: player.score || 0
            });
        }
    });
    updatePlayerList();
});

socket.on('playerJoined', (data) => {
    console.log('Novo jogador conectado:', data.nickname);
    if (data.nickname) {
        connectedPlayers.set(data.id, { 
            id: data.id,
            nickname: data.nickname.toUpperCase(),
            x: data.x || 0,
            y: data.y || 0,
            radius: data.radius || 20,
            color: data.color || '#FFFFFF',
            score: data.score || 0
        });
        updatePlayerList();
    }
});

socket.on('playerLeft', (data) => {
    console.log('Jogador desconectado:', data.id);
    connectedPlayers.delete(data.id);
    updatePlayerList();
});

socket.on('playerUpdate', (data) => {
    if (connectedPlayers.has(data.id)) {
        const player = connectedPlayers.get(data.id);
        player.x = data.x;
        player.y = data.y;
        player.radius = data.radius;
        player.score = data.score;
        connectedPlayers.set(data.id, player);
    }
});

// Função para atualizar a lista de jogadores
function updatePlayerList() {
    if (!playerListContainer || !playerCount) return;
    
    playerListContainer.innerHTML = '';
    playerCount.textContent = `${connectedPlayers.size} ONLINE`;
    
    connectedPlayers.forEach(player => {
        if (player.nickname) {
            const playerElement = document.createElement('div');
            playerElement.style.cssText = `
                padding: 8px 10px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #fff;
                display: flex;
                align-items: center;
                font-weight: bold;
            `;
            
            // Adiciona um indicador de status (ponto verde)
            const statusDot = document.createElement('div');
            statusDot.style.cssText = `
                width: 8px;
                height: 8px;
                background: #00ff88;
                border-radius: 50%;
                margin-right: 10px;
                box-shadow: 0 0 10px #00ff88;
            `;
            
            playerElement.appendChild(statusDot);
            playerElement.appendChild(document.createTextNode(player.nickname.toUpperCase()));
            playerListContainer.appendChild(playerElement);
        }
    });
}

// Evento para enviar o nickname quando o jogador inicia
startButton.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim() || 'JOGADOR';
    socket.emit('setNickname', nickname.toUpperCase());
    console.log('Nickname enviado:', nickname.toUpperCase());
});

// Evento para mostrar/esconder a lista de jogadores
document.addEventListener('keydown', (e) => {
    if (e.key === 'CapsLock') {
        playerList.style.display = 'block';
        // Pausa o jogo enquanto a lista está visível
        gamePaused = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'CapsLock') {
        playerList.style.display = 'none';
        // Despausa o jogo quando a lista é escondida
        gamePaused = false;
    }
});

// Garante que a tela de login seja exibida ao carregar a página
window.addEventListener('load', () => {
    inMenu = true;
    gameOver = false;
    loginScreen.style.display = "flex";
    gameOverScreen.style.display = "none";
});

// ========== ZOOM CONFIG ========== //
const zoomConfig = {
    minZoom: 0.4, // mínimo de 0.4x
    maxZoom: 4.0, // máximo de 4x
    sensitivity: 0.5, // reduzida para diminuir mais gradualmente
    smoothness: 0.1
};
let currentZoom = 0.5;
let targetZoom = 4;

// ========== GAME CONFIG ========== //
const world = { width: 10000, height: 10000 };
const config = {
    baseSpeed: 2.2, // mais rápido
    boostMultiplier: 3.0,
    boostDuration: 200,
    stunDuration: 300,
    maxRadius: 120,
    minRadius: 15,
    energyBallCount: 650,
    zoneCount: 15,
    zoneRespawnDelay: 200,
    infectionDuration: 300,
    invisibleDuration: 300,
    trapDuration: 200,
    mergeDelay: 100,
    // New mechanics config
    dashSpeed: 2.5, // dash mais lento
    dashDuration: 15, // dash mais curto
    dashCooldown: 1800, // 30 segundos
    goldenMassCount: 5, // Number of golden mass items
    goldenMassRespawnDelay: 600, // 10 seconds
    splitTypes: {
        normal: { count: 2, sizeRatio: 0.7 },
        triple: { count: 3, sizeRatio: 0.6 },
        quad: { count: 4, sizeRatio: 0.5 },
        scatter: { count: 5, sizeRatio: 0.4 },
        explosive: { count: 8, sizeRatio: 0.3 }
    },
    mergeRadius: 50,
    mergeSpeed: 0.8,
    fogOfWarRadius: 300,
    particleMode: {
        maxParticles: 10,
        baseSpeed: 2.5,
        minRadius: 10,
        maxRadius: 50,
        energyConsumption: 0.1,
        mergeDistance: 30,
        splitRadius: 20,
        groupStrategies: ['follow', 'circle', 'spread', 'attack'],
        splitForce: 8,
        mergeDelay: 30
    },
    attackMode: {
        maxProjectiles: 5,
        projectileSpeed: 12.0,
        projectileRadius: 10,
        cooldown: 30,
        damage: 0.1,
        energyCost: 0.1,
        slowFactor: 0.4,
        maxAmmo: 5,
        ammoRegenRate: 1,
        ammoRegenDelay: 1200,
        shotCooldown: 10
    },
    specialAttack: {
        cooldown: 3000,
        duration: 120,
        radius: 150,
        mass: 25, // dano ainda mais reduzido
        color: "#FF00FF"
    },
    shield: {
        cooldown: 1800, // 30 segundos (1800 frames)
        duration: 180, // 3 segundos
        color: "#ADD8E6", // Cor azul claro para o escudo
        damageReduction: 0.3, // Reduz o dano em 70% (1 - 0.3 = 0.7)
        sizeMultiplier: 2.5 // Aumenta o tamanho do escudo
    }
};

// ========== GAME STATE ========== //
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let boostTimer = 0;
let stunTimer = 0;
let infectionTimer = 0;
let invisibleTimer = 0;
let trapTimer = 0;
let dashTimer = 0;
let dashCooldownTimer = 0;
let score = 0;
let gameOver = false;
let inMenu = true;
let playerName = "";
let particleEffects = [];
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
let enemies = [];
let mergeTimer = 0;
let playerCells = []; // Array to store split cells
let portals = []; // Array to store teleport portals
let fogAreas = []; // Array to store fog of war areas
let gameZones = []; // Array to store regular zones

// Multiplayer support
let players = [];
let localPlayers = [];

// ===== EFEITOS ESPECIAIS =====
let fireZones = [];
let shockwaves = [];
let specialStunApplied = false;

// Definição centralizada dos personagens
const CHARACTERS = {
  roxo: {
    id: 'roxo',
    color: '#a259ff',
    name: 'Roxo',
    effect: 'Equilíbrio',
    attr: 'Padrão',
    baseSpeed: 2.5,
    canStun: false,
    burnAttack: false,
    explosiveAttack: false
  },
  verde: {
    id: 'verde',
    color: '#00ff88',
    name: 'Verde',
    effect: '+Velocidade',
    attr: 'Speed',
    baseSpeed: 2.5,
    canStun: false,
    burnAttack: false,
    explosiveAttack: false
  },
  azul: {
    id: 'azul',
    color: '#00bfff',
    name: 'Azul',
    effect: 'Atordoa inimigos',
    attr: 'Stun',
    baseSpeed: 2.5,
    canStun: true,
    burnAttack: false,
    explosiveAttack: false
  },
  amarelo: {
    id: 'amarelo',
    color: '#ffe066',
    name: 'Amarelo',
    effect: 'Dano ao longo do tempo',
    attr: 'Queimadura',
    baseSpeed: 2.5,
    canStun: false,
    burnAttack: true,
    explosiveAttack: false
  },
  vermelho: {
    id: 'vermelho',
    color: '#ff3b3b',
    name: 'Vermelho',
    effect: 'Dano em área',
    attr: 'Explosão',
    baseSpeed: 2.3,
    canStun: false,
    burnAttack: false,
    explosiveAttack: true
  }
};

// Function to create a new player
function createPlayer(name, color, effect) {
    return {
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        radius: 105,
        color: color || "#a259ff",
        effect: effect || "default",
        name: name,
        score: 0,
        isInvisible: false,
        hasTrap: false,
        cells: [],
        projectiles: [],
        currentAmmo: config.attackMode.maxAmmo,
        ammoRegenTimer: 0,
        lastShotTime: 0,
        shotCooldown: 0,
        boostTimer: 0,
        stunTimer: 0,
        infectionTimer: 0,
        invisibleTimer: 0,
        trapTimer: 0,
        dashTimer: 0,
        dashCooldownTimer: 0,
        specialAttackTimer: 0,
        specialAttackCooldown: 0,
        specialAttackActive: false,
        shieldTimer: 0,
        shieldCooldown: 0,
        shieldActive: false
    };
}

// Function to add a local player
function addLocalPlayer(name) {
    const newPlayer = createPlayer(name);
    localPlayers.push(newPlayer);
    players.push(newPlayer);
    return newPlayer;
}

// Function to update a player
function updatePlayer(player, mouseX, mouseY, isKeyboard = false) {
    if (player.stunTimer > 0) {
        player.stunTimer--;
        return;
    }

    let dx = 0;
    let dy = 0;

    if (isKeyboard) {
        // Keyboard controls
        if (keys.w || keys.arrowUp) dy -= 1;
        if (keys.s || keys.arrowDown) dy += 1;
        if (keys.a || keys.arrowLeft) dx -= 1;
        if (keys.d || keys.arrowRight) dx += 1;
    } else {
        // Mouse controls
        dx = mouseX - canvas.width / 2 - player.x;
        dy = mouseY - canvas.height / 2 - player.y;
    }

    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
        const speed = config.baseSpeed * (player.boostTimer > 0 ? config.boostMultiplier : 1);
        player.x += (dx / dist) * speed;
        player.y += (dy / dist) * speed;
    }

    // Update timers
    if (player.boostTimer > 0) player.boostTimer--;
    if (player.invisibleTimer > 0) player.invisibleTimer--;
    if (player.trapTimer > 0) player.trapTimer--;
    if (player.dashTimer > 0) player.dashTimer--;
    if (player.dashCooldownTimer > 0) player.dashCooldownTimer--;
    if (player.specialAttackTimer > 0) player.specialAttackTimer--;
    if (player.specialAttackCooldown > 0) player.specialAttackCooldown--;
    if (player.shieldTimer > 0) player.shieldTimer--;
    if (player.shieldCooldown > 0) player.shieldCooldown--;

    // Keep player within world bounds
    player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
}

// Function to draw a player
function drawPlayer(player) {
    if (player.isInvisible) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Draw player circle
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    
    // Draw player name above the character
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(player.name || playerName, 0, -player.radius - 20);
    
    // Draw shield if active
    if (player.shieldActive) {
        ctx.beginPath();
        ctx.arc(0, 0, player.radius * config.shield.sizeMultiplier, 0, Math.PI * 2);
        ctx.strokeStyle = config.shield.color;
        ctx.lineWidth = 5;
        ctx.stroke();
    }
    
    ctx.restore();
}

// Adiciona estrelas para o fundo
const stars = Array.from({ length: 500 }, () => ({
    x: Math.random() * world.width,
    y: Math.random() * world.height,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 0.8 + 0.2,
    brightness: Math.random() * 0.7 + 0.3,
    color: `hsl(${Math.random() * 60 + 200}, 100%, ${Math.random() * 30 + 50}%)`
}));

const player = {
    x: world.width / 2,
    y: world.height / 2,
    radius: 105,
    color: '#a259ff', // default, will be overwritten on start
    trail: [],
    isInvisible: false,
    hasTrap: false
};

const energyBalls = Array.from({ length: config.energyBallCount }, createEnergyBall);
let zones = generateRandomZones(config.zoneCount);

let particleMode = false;
let currentGroupStrategy = 'follow';
let selectedParticles = new Set();
let particles = [];

// Add to game state
let projectiles = [];
let attackCooldown = 0;
let attackMode = false;
let currentAmmo = config.attackMode.maxAmmo;
let ammoRegenTimer = 0;
let lastShotTime = 0;
let shotCooldown = 0;
let isMouseDown = false;

// Adiciona variável para slow por tiro
let hitSlowTimer = 0;

// Adiciona array para armazenar os rastros do dash
let dashTrails = [];

// Variáveis para o ataque especial
let specialAttackTimer = 0;
let specialAttackCooldown = 0;
let specialAttackActive = false;
let shieldTimer = 0;
let shieldCooldown = 0;
let shieldActive = false;

// UI Configuration
const uiConfig = {
    padding: 20,
    statsWidth: 150,
    statsHeight: 100,
    cooldownWidth: 250,
    cooldownHeight: 80,
    minimapSize: 200,
    minimapPadding: 20,
    rankingWidth: 250,
    rankingHeight: 100,
    rankingPadding: 5
};

class Particle {
    constructor(x, y, radius, isLeader = false) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = isLeader ? '#FF0000' : getRandomColor();
        this.speed = config.particleMode.baseSpeed * (1 + (config.particleMode.minRadius / radius));
        this.isLeader = isLeader;
        this.targetX = x;
        this.targetY = y;
        this.angle = 0;
        this.energy = 100;
        this.mergeTimer = 0;
        this.splitTimer = 0;
        this.vx = 0;
        this.vy = 0;
    }

    update() {
        // Update energy based on size
        this.energy -= config.particleMode.energyConsumption * (this.radius / config.particleMode.minRadius);
        if (this.energy <= 0) return false;

        // Update timers
        if (this.mergeTimer > 0) this.mergeTimer--;
        if (this.splitTimer > 0) this.splitTimer--;

        // Natural movement with momentum
        const dx = mouseX - canvas.width / 2 - this.x;
        const dy = mouseY - canvas.height / 2 - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 1) {
            // Apply force towards cursor
            const force = this.speed / dist;
            this.vx += dx * force;
            this.vy += dy * force;
            
            // Apply friction
            this.vx *= 0.95;
            this.vy *= 0.95;
            
            // Update position
            this.x += this.vx;
            this.y += this.vy;
        }

        // Keep within bounds
        this.x = Math.max(this.radius, Math.min(world.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(world.height - this.radius, this.y));

        return true;
    }
}




// ========== UTILITY FUNCTIONS ========== //
function getRandomColor() {
    const colors = ['#00FFCC', '#FF00CC', '#CC00FF', '#00CCFF', '#FFCC00', '#CCFF00', '#FF6B6B', '#4ECDC4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function generateRandomZones(count) {
    const types = [
        { type: "infection", color: "rgba(255, 50, 50, 0.4)" },
        { type: "slow", color: "rgba(100, 100, 255, 0.4)" },
        { type: "boost", color: "rgba(50, 255, 50, 0.4)" },
        { type: "stun", color: "rgba(255, 200, 50, 0.7)" },
        { type: "invisible", color: "rgba(150, 150, 150, 0.4)" },
        { type: "trap", color: "rgba(200, 100, 0, 0.7)" }
    ];
    
    const zones = [];
    const portals = [];
    
    // Garante um número par de portais (2 ou 4)
    const portalCount = Math.floor(Math.random() * 2) * 2 + 2;
    
    // Gera os portais em pares
    for (let i = 0; i < portalCount; i++) {
        const portal = {
            x: Math.random() * world.width,
            y: Math.random() * world.height,
            radius: 40,
            type: "portal",
            color: "rgba(200, 50, 200, 0.7)",
            active: true,
            respawnTimer: 0
        };
        portals.push(portal);
    }
    
    // Vincula os portais em pares
    for (let i = 0; i < portals.length; i += 2) {
        portals[i].linkedTo = portals[i + 1];
        portals[i + 1].linkedTo = portals[i];
    }
    
    // Gera as outras zonas
    for (let i = 0; i < count - portalCount; i++) {
        const z = types[Math.floor(Math.random() * types.length)];
        const zone = {
            x: Math.random() * world.width,
            y: Math.random() * world.height,
            radius: 20 + Math.random() * 20,
            type: z.type,
            color: z.color,
            active: true,
            respawnTimer: 0
        };
        zones.push(zone);
    }
    
    return { zones, portals, fogAreas: [] };
}

function resetGame() {
    Object.assign(player, {
        x: world.width / 2,
        y: world.height / 2,
        radius: 25,
        // NÃO alterar cor aqui!
        trail: [],
        isInvisible: false,
        hasTrap: false
    });
    score = 0;
    gameOver = false;
    particleEffects = [];
    const { zones: newZones, portals: newPortals, fogAreas: newFogAreas } = generateRandomZones(config.zoneCount);
    gameZones = newZones;
    portals = newPortals;
    fogAreas = newFogAreas;
    infectionTimer = 0;
    invisibleTimer = 0;
    trapTimer = 0;
    currentZoom = 1;
    targetZoom = 1;
    enemies = generateEnemies(10);
    playerCells = [];
    // Hide game over screen
    gameOverScreen.style.display = 'none';
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particleEffects.push({
            x, y, color,
            size: Math.random() * 3 + 2,
            speed: Math.random() * 2 + 1,
            angle: Math.random() * Math.PI * 2,
            life: 30 + Math.random() * 30
        });
    }
}

function createEnergyBall() {
    const isGolden = Math.random() < 0.01; // 1% chance to be golden
    return {
        x: Math.random() * world.width,
        y: Math.random() * world.height,
        radius: isGolden ? 8 + Math.random() * 4 : 5 + Math.random() * 3,
        color: isGolden ? "#FFD700" : `hsl(${Math.random() * 360}, 100%, 60%)`,
        glow: 0,
        isGolden: isGolden
    };
}

function generateEnemies(count) {
    return Array.from({ length: count }, () => {
        const radius = 15 + Math.random() * 50;
        return {
            x: Math.random() * world.width,
            y: Math.random() * world.height,
            radius: radius,
            originalRadius: radius,
            color: getRandomColor(),
            speed: 0.5 + Math.random(),
            angle: Math.random() * Math.PI * 2
        };
    });
}

function addHighScore(name, score) {
    // Remove existing score for this player if exists
    highScores = highScores.filter(entry => entry.name !== name);
    
    // Add new score
    highScores.push({ name, score });
    
    // Sort and limit to top 10
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

// ========== GAME LOGIC ========== //
function updateInteractiveEnvironments() {
    let speed = config.baseSpeed;
    
    // Update zones
    if (gameZones) {
        gameZones.forEach(zone => {
            if (!zone.active) {
                zone.respawnTimer--;
                if (zone.respawnTimer <= 0) {
                    zone.active = true;
                    zone.x = Math.random() * world.width;
                    zone.y = Math.random() * world.height;
                }
                return;
            }
            
            const d = Math.hypot(player.x - zone.x, player.y - zone.y);
            if (d < zone.radius + player.radius) {
                switch (zone.type) {
                    case "infection":
                        infectionTimer = config.infectionDuration;
                        createParticles(player.x, player.y, "#FF0000", 10);
                        break;
                    case "slow":
                        speed *= 0.4;
                        break;
                    case "boost":
                        boostTimer = config.boostDuration;
                        createParticles(player.x, player.y, "#00FF00", 10);
                        break;
                    case "stun":
                        stunTimer = config.stunDuration;
                        createParticles(player.x, player.y, "#FFA500", 15);
                        break;
                    case "invisible":
                        invisibleTimer = config.invisibleDuration;
                        createParticles(player.x, player.y, "#FFFFFF", 15);
                        break;
                    case "trap":
                        trapTimer = config.trapDuration;
                        createParticles(player.x, player.y, "#FF8000", 15);
                        break;
                }
                zone.active = false;
                zone.respawnTimer = config.zoneRespawnDelay;
                createParticles(zone.x, zone.y, zone.color, 15);
            }
        });
    }
    
    // Update portals
    portals.forEach(portal => {
        if (!portal.active) {
            portal.respawnTimer--;
            if (portal.respawnTimer <= 0) {
                portal.active = true;
            }
            return;
        }
        
        const d = Math.hypot(player.x - portal.x, player.y - portal.y);
        if (d < portal.radius + player.radius) {
            const linkedPortal = portal.linkedTo;
            if (linkedPortal && linkedPortal.active) {
                player.x = linkedPortal.x;
                player.y = linkedPortal.y;
                createParticles(player.x, player.y, portal.color, 30);
                createExplosion(player.x, player.y, portal.color, player.radius, 50, 2.0);
                
                // Desativa ambos os portais temporariamente
                portal.active = false;
                linkedPortal.active = false;
                portal.respawnTimer = config.zoneRespawnDelay;
                linkedPortal.respawnTimer = config.zoneRespawnDelay;
            }
        }
    });
    
    return speed;
}

function updatePlayer() {
    if (gameOver || inMenu) return;

    if (player.radius <= config.minRadius) {
        handleGameOver();
        return;
    }

    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 20) player.trail.shift();

    if (stunTimer-- > 0) {
        createParticles(player.x, player.y, "#FFA500", 2);
        return;
    }

    // Atualizar temporizadores de poderes
    if (invisibleTimer > 0) {
        invisibleTimer--;
        player.isInvisible = true;
        if (invisibleTimer === 0) {
            player.isInvisible = false;
            createParticles(player.x, player.y, "#FFFFFF", 20);
        }
    }

    if (trapTimer > 0) {
        trapTimer--;
        player.hasTrap = true;
        if (trapTimer === 0) {
            player.hasTrap = false;
            createParticles(player.x, player.y, "#FF8000", 20);
        }
    }

    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const dist = Math.hypot(dx, dy);
    let speed = updateInteractiveEnvironments();

    // Calcula a velocidade base baseada no tamanho do jogador
    // Se score > 300, velocidade fixa e constante
    if (score > 300) {
        speed = config.baseSpeed * 0.35; // valor fixo, ajuste se quiser mais rápido/lento
    } else {
        const sizeSpeedFactor = Math.max(0.1, 1 - (player.radius / config.maxRadius) * 0.8);
        speed *= sizeSpeedFactor;
    }

    // Aplica o fator de lentidão quando no modo de ataque
    if (attackMode) {
        speed *= config.attackMode.slowFactor;
    }

    // Aplica slow quando atingido
    if (hitSlowTimer > 0) {
        speed *= 0.5;
        hitSlowTimer--;
    }

    if (boostTimer-- > 0) {
        speed *= config.boostMultiplier;
        createParticles(player.x, player.y, "#00FF00", 3);
    }

    if (dashTimer > 0) {
        speed *= config.dashSpeed;
        createParticles(player.x, player.y, player.color, 2);
    }

    if (infectionTimer > 0) {
        infectionTimer--;
        player.radius -= 0.1;
        if (infectionTimer % 10 === 0) {
            createParticles(player.x, player.y, "#FF0000", 2);
        }
    }

    if (dist > 1) {
        player.x += dx / dist * speed;
        player.y += dy / dist * speed;
    }

    player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));

    // Ajusta o zoom para diminuir mais gradualmente conforme o jogador cresce
    const zoomFactor = (1 - (player.radius / config.maxRadius) * zoomConfig.sensitivity) * 0.8;
    targetZoom = Math.max(zoomConfig.minZoom, Math.min(zoomConfig.maxZoom, zoomFactor));
    currentZoom += (targetZoom - currentZoom) * zoomConfig.smoothness;
}

function updateEnemies() {
    enemies.forEach(enemy => {
        // Stun: inimigo não se move enquanto stunTimer > 0
        if (enemy.stunTimer && enemy.stunTimer > 0) {
            enemy.stunTimer--;
            return;
        }
        // Burn: inimigo perde tamanho ao longo do tempo
        if (enemy.burnTimer && enemy.burnTimer > 0) {
            enemy.burnTimer--;
            enemy.radius = Math.max(enemy.radius - 0.15, 10);
            createParticles(enemy.x, enemy.y, '#ffe066', 1);
        }
        // Movimento aleatório dos inimigos
        enemy.angle += (Math.random() - 0.5) * 0.2;
        enemy.x += Math.cos(enemy.angle) * enemy.speed;
        enemy.y += Math.sin(enemy.angle) * enemy.speed;

        // Manter dentro dos limites do mundo
        enemy.x = Math.max(enemy.radius, Math.min(world.width - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(world.height - enemy.radius, enemy.y));

        // Verificar colisão com o jogador
        if (!player.isInvisible) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            // Mecânica de juntar células (como no Agar.io)
            if (mergeTimer <= 0) {
                if (dist < player.radius + enemy.radius) {
                    if (player.radius > enemy.radius * 1.1) {
                        // Jogador come o inimigo
                        player.radius += enemy.radius * 0.2;
                        score += Math.floor(enemy.radius);
                        createParticles(enemy.x, enemy.y, enemy.color, 20);
                        // Reposicionar inimigo
                        enemy.x = Math.random() * world.width;
                        enemy.y = Math.random() * world.height;
                        enemy.radius = 15 + Math.random() * 50;
                        enemy.color = getRandomColor();
                        mergeTimer = config.mergeDelay;
                    } else if (enemy.radius > player.radius * 1.1) {
                        // Inimigo come o jogador
                        player.radius -= enemy.radius * 0.1;
                        createParticles(player.x, player.y, player.color, 20);
                        mergeTimer = config.mergeDelay;
                    }
                }
            }
        }
        // Verificar se o jogador tem armadilha ativa
        if (player.hasTrap) {
            const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (distToPlayer < player.radius * 2) {
                // Atrair inimigos para a armadilha
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                enemy.x += Math.cos(angle) * 0.5;
                enemy.y += Math.sin(angle) * 0.5;
            }
        }
    });
    if (mergeTimer > 0) mergeTimer--;
}

function updateParticles() {
    if (!particleMode) return;
    
    // Update particles
    particles = particles.filter(p => p.update());
    
    // Check for collisions between particles
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < p1.radius + p2.radius) {
                if (p1.radius > p2.radius * 1.1 && p1.mergeTimer === 0) {
                    // p1 eats p2
                    p1.radius = Math.sqrt(p1.radius * p1.radius + p2.radius * p2.radius);
                    p1.speed = config.particleMode.baseSpeed * (1 + (config.particleMode.minRadius / p1.radius));
                    particles.splice(j, 1);
                } else if (p2.radius > p1.radius * 1.1 && p2.mergeTimer === 0) {
                    // p2 eats p1
                    p2.radius = Math.sqrt(p1.radius * p1.radius + p2.radius * p2.radius);
                    p2.speed = config.particleMode.baseSpeed * (1 + (config.particleMode.minRadius / p2.radius));
                    particles.splice(i, 1);
                }
            }
        }
    }
    
    // Check for enemy collisions
    for (let enemyIndex = 0; enemyIndex < enemies.length; enemyIndex++) {
        const enemy = enemies[enemyIndex];
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < player.radius + enemy.radius) {
            if (player.radius > enemy.radius * 1.1) {
                // Cell eats enemy
                const massGain = enemy.radius * 0.2;
                player.radius = Math.sqrt(player.radius * player.radius + massGain * massGain);
                score += Math.floor(enemy.radius);
                
                createExplosion(enemy.x, enemy.y, enemy.color, enemy.radius, 50, 1.5);
                
                // Respawn enemy
                enemy.x = Math.random() * world.width;
                enemy.y = Math.random() * world.height;
                enemy.radius = 15 + Math.random() * 50;
                enemy.color = getRandomColor();
            } else if (enemy.radius > player.radius * 1.1) {
                // Enemy eats cell
                player.radius -= enemy.radius * 0.1;
                return; // Exit the update function for this cell
            }
        }
    }
}

function collectEnergy() {
    for (let i = energyBalls.length - 1; i >= 0; i--) {
        const e = energyBalls[i];
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < player.radius + e.radius) {
            if (player.radius < config.maxRadius) {
                // Dificultar crescimento: ganho de raio bem menor
                const massGain = e.isGolden ? 0.6 : 0.3;
                player.radius += massGain;
                // Score sempre 1 ponto por bolinha
                score += 1;
                createParticles(e.x, e.y, e.color, e.isGolden ? 20 : 10);
                if (e.isGolden) {
                    createExplosion(e.x, e.y, e.color, e.radius, 30, 1.5);
                }
                updateUI();
            }
            energyBalls.splice(i, 1);
        } else {
            e.glow = (e.glow + 0.05) % (Math.PI * 2);
            e.radius = e.isGolden ? 
                (8 + Math.sin(e.glow) * 3) : 
                (5 + Math.sin(e.glow) * 2);
        }
    }
    while (energyBalls.length < config.energyBallCount) {
        energyBalls.push(createEnergyBall());
    }
}

function update() {
    if (!gameOver && !inMenu) {
        if (particleMode) {
            updateParticles();
        } else {
            updatePlayer();
            updatePlayerCells();
        }
        updateEnemies();
        collectEnergy();
        
        // Atualiza timers
        if (dashTimer > 0) dashTimer--;
        if (dashCooldownTimer > 0) dashCooldownTimer--;
        if (shotCooldown > 0) shotCooldown--;
        
        // Regeneração de munição
        if (ammoRegenTimer > 0) {
            ammoRegenTimer--;
        } else if (currentAmmo < config.attackMode.maxAmmo) {
            lastShotTime++;
            if (lastShotTime >= 60) {
                currentAmmo = Math.min(config.attackMode.maxAmmo, 
                    currentAmmo + config.attackMode.ammoRegenRate);
            }
        }
        
        // Atualiza modo de ataque
        if (attackCooldown > 0) attackCooldown--;
        if (attackMode) {
            updateProjectiles();
        }
        updateSpecialAttack();
        updateShield();
        
        // Update high scores in real-time if current score is higher than previous
        const currentHighScore = highScores.find(entry => entry.name === playerName);
        if (!currentHighScore || score > currentHighScore.score) {
            addHighScore(playerName, score);
        }
    }
    updateParticles();
    updateDashTrails();
}

// ========== RENDERING ========== //
function drawGlow(x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
}

function drawMiniMap() {
    const minimapSize = uiConfig.minimapSize;
    const minimapPadding = uiConfig.minimapPadding;
    const minimapX = canvas.width - minimapSize - minimapPadding;
    const minimapY = canvas.height - minimapSize - minimapPadding;
    const scale = minimapSize / world.width;
    const centerX = minimapX + minimapSize/2;
    const centerY = minimapY + minimapSize/2;
    const radius = minimapSize/2;

    // Fundo circular com glow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 229, 255, 0.3)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = minimapSize / 4;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(minimapX + i * gridSize, minimapY);
        ctx.lineTo(minimapX + i * gridSize, minimapY + minimapSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(minimapX, minimapY + i * gridSize);
        ctx.lineTo(minimapX + minimapSize, minimapY + i * gridSize);
        ctx.stroke();
    }

    // Borda
    ctx.save();
    ctx.shadowColor = 'rgba(0, 229, 255, 0.5)';
    ctx.shadowBlur = 5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Compass
    const compassSize = 20;
    const compassX = centerX + radius - compassSize - 5;
    const compassY = centerY - radius + 5;
    ctx.save();
    ctx.translate(compassX + compassSize/2, compassY + compassSize/2);
    ctx.rotate(Math.atan2(mouseY - canvas.height/2, mouseX - canvas.width/2));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, compassSize/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -compassSize/2);
    ctx.lineTo(0, compassSize/2);
    ctx.stroke();
    ctx.restore();

    // Player principal (sempre usar player.x/player.y)
    const px = minimapX + (player.x / world.width) * minimapSize;
    const py = minimapY + (player.y / world.height) * minimapSize;
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(player.radius * scale, 4), 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.restore();

    // Desenha outros jogadores online
    connectedPlayers.forEach(otherPlayer => {
        if (otherPlayer && otherPlayer.id !== socket.id) {
            const opx = minimapX + (otherPlayer.x / world.width) * minimapSize;
            const opy = minimapY + (otherPlayer.y / world.height) * minimapSize;
            ctx.save();
            ctx.shadowColor = otherPlayer.color;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(opx, opy, Math.max(otherPlayer.radius * scale, 4), 0, Math.PI * 2);
            ctx.fillStyle = otherPlayer.color;
            ctx.fill();
            ctx.restore();
        }
    });

    // Viewport como círculo verde
    const viewportRadius = (Math.min(canvas.width, canvas.height) * scale) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, viewportRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Zoom
    const zoomText = `Zoom: ${currentZoom.toFixed(1)}x`;
    ctx.font = '10px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(zoomText, minimapX + minimapSize - 5, minimapY + minimapSize - 5);
}

function drawUI() {
    // Ranking apenas com jogadores reais ativos (online/local)
    let currentRanking = Array.from(connectedPlayers.values())
        .filter(p => p && p.name && !p.disconnected)
        .map(p => ({ name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

    // Garante que o jogador atual esteja no ranking
    const currentPlayer = currentRanking.find(p => p.name === playerName);
    if (!currentPlayer) {
        currentRanking.push({ name: playerName, score: score });
    }

    // Pega os top 10, mas mantém o jogador atual se não estiver entre eles
    let topPlayers = currentRanking.slice(0, 10);
    if (!topPlayers.some(p => p.name === playerName) && currentRanking.length > 10) {
        topPlayers[9] = { name: playerName, score: score };
    }

    // Ranking Panel
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(20, 20, 250, 40 + topPlayers.length * 30);
    ctx.strokeStyle = "rgba(124, 77, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 250, 40 + topPlayers.length * 30);

    // Ranking Title
    ctx.fillStyle = "#7c4dff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(124, 77, 255, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText("Top 10 Players", 145, 45);
    ctx.shadowBlur = 0;

    // Ranking Entries
    topPlayers.forEach((entry, i) => {
        const isCurrentPlayer = entry.name === playerName;
        const y = 70 + i * 30;

        // Background for current player
        if (isCurrentPlayer) {
            ctx.fillStyle = "rgba(124, 77, 255, 0.2)";
            ctx.fillRect(25, y - 15, 240, 25);
        }

        // Position
        ctx.fillStyle = i === 0 ? "#00e5ff" : "#7c4dff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText(`${i + 1}.`, 35, y);

        // Name
        ctx.fillStyle = isCurrentPlayer ? "#00e5ff" : "white";
        ctx.font = `${isCurrentPlayer ? "bold" : "normal"} 14px Arial`;
        ctx.fillText(entry.name, 60, y);

        // Score (legível)
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "right";
        ctx.shadowColor = "#222";
        ctx.shadowBlur = 6;
        ctx.fillStyle = i === 0 ? "#00e5ff" : "#fff";
        ctx.fillText(entry.score, 250, y);
        ctx.shadowBlur = 0;
    });
    ctx.textAlign = "left";

    // Game state messages
    if (stunTimer > 0) {
        const pulse = Math.sin(Date.now() / 100) * 5;
        ctx.fillStyle = "rgba(255, 165, 0, 0.7)";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("STUNNED!", canvas.width / 2, 50 + pulse);
        ctx.textAlign = "left";
    }

    if (infectionTimer > 0) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("INFECTED!", canvas.width / 2, 90);
        ctx.textAlign = "left";
    }

    if (invisibleTimer > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("INVISIBLE!", canvas.width / 2, 130);
        ctx.textAlign = "left";
    }

    if (trapTimer > 0) {
        ctx.fillStyle = "rgba(255, 128, 0, 0.7)";
        ctx.font = "bold 30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TRAP ACTIVE!", canvas.width / 2, 170);
        ctx.textAlign = "left";
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (inMenu) return;

    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;
    
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-canvas.width/2, -canvas.height/2);
    ctx.translate(-camX, -camY);

    // Desenha o fundo estelar
    stars.forEach(star => {
        const x = (star.x - camX) % world.width;
        const y = (star.y - camY) % world.height;
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.brightness;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Anima as estrelas
        star.y += star.speed;
        if (star.y > world.height) star.y = 0;
    });
    ctx.globalAlpha = 1;

    // Draw zones
    gameZones.forEach(z => {
        if (z.active) {
            drawGlow(z.x, z.y, z.radius * 1.5, z.color);
            ctx.beginPath();
            ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
            ctx.fillStyle = z.color.replace('0.4', '0.2').replace('0.7', '0.3');
            ctx.fill();
        }
    });

    // Draw portals
    portals.forEach(portal => {
        if (portal.active) {
            drawGlow(portal.x, portal.y, portal.radius * 2, portal.color);
            ctx.beginPath();
            ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
            ctx.fillStyle = portal.color;
            ctx.fill();
            
            // Draw portal connection line
            ctx.beginPath();
            ctx.moveTo(portal.x, portal.y);
            ctx.lineTo(portal.linkedTo.x, portal.linkedTo.y);
            ctx.strokeStyle = portal.color;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    // Draw fog of war
    fogAreas.forEach(fog => {
        if (fog.active) {
            const d = Math.hypot(player.x - fog.x, player.y - fog.y);
            if (d < config.fogOfWarRadius) {
                ctx.beginPath();
                ctx.arc(fog.x, fog.y, fog.radius, 0, Math.PI * 2);
                ctx.fillStyle = fog.color;
                ctx.fill();
            }
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        drawGlow(enemy.x, enemy.y, enemy.radius * 1.5, `${enemy.color}40`);
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
    });

    // Draw player cells
    playerCells.forEach(cell => {
        // Draw cell trail
        cell.trail.forEach((p, i) => {
            const alpha = i / cell.trail.length * 0.7;
            const size = cell.radius * (i / cell.trail.length);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `${cell.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
        });
        
        // Draw cell
        drawGlow(cell.x, cell.y, cell.radius * 3, `${cell.color}80`);
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
        ctx.fillStyle = cell.color;
        ctx.fill();
    });

    // Draw player trail
    player.trail.forEach((p, i) => {
        const alpha = i / player.trail.length * 0.7;
        const size = player.radius * (i / player.trail.length);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${player.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
    });

    // Draw energy balls
    energyBalls.forEach(e => {
        drawGlow(e.x, e.y, e.radius * 3, e.color.replace(')', ', 0.3)'));
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.fill();
    });

    // Draw particles
    if (particleMode) {
        particles.forEach((particle, index) => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = selectedParticles.has(index) ? '#FFFF00' : particle.color;
            ctx.fill();
            
            if (particle.isLeader) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }

    // Draw player
    if (!gameOver && !player.isInvisible) {
        const skinColor = applySkinEffects(ctx, player.x, player.y, player.radius);
        const glowColor = currentSkin ? currentSkin.glowColor : `${player.color}80`;
        
        // Efeito especial durante a ultimate
        if (specialAttackActive) {
            // Brilho pulsante colorido
            const pulse = Math.sin(Date.now() / 150) * 0.3 + 1.2;
            ctx.save();
            ctx.globalAlpha = 0.7;
            const grad = ctx.createRadialGradient(player.x, player.y, player.radius * 1.1, player.x, player.y, player.radius * 2.2 * pulse);
            grad.addColorStop(0, 'rgba(255,0,255,0.5)');
            grad.addColorStop(0.5, 'rgba(0,229,255,0.3)');
            grad.addColorStop(1, 'rgba(255,255,0,0.1)');
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius * 2.2 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }

        drawGlow(player.x, player.y, player.radius * 3, glowColor);
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);

        if (stunTimer > 0) {
            const pulse = Math.sin(Date.now() / 100) * 5;
            ctx.fillStyle = `rgba(255, 165, 0, 0.7)`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 200, 100, 0.9)`;
            ctx.lineWidth = 4;
            ctx.beginPath();
        } else {
            ctx.fillStyle = skinColor;
            ctx.fill();
        }

        // Draw player name above the character
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(player.name || playerName, player.x, player.y - player.radius - 20);
    }

    // Draw trap if active
    if (player.hasTrap) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius * 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 128, 0, 0.5)";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw projectiles
    if (attackMode) {
        projectiles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            // Add glow effect
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }

    // Desenha interface de munição melhorada
    if (attackMode) {
        // Fundo da barra de munição com efeito de brilho
        const glowSize = 5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = player.color;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(20 - glowSize, 20 - glowSize, 200 + glowSize * 2, 80 + glowSize * 2);
        ctx.shadowBlur = 0;
        
        // Texto de munição com efeito de brilho
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.shadowBlur = 5;
        ctx.shadowColor = player.color;
        ctx.fillText(`Ammo: ${currentAmmo}/${config.attackMode.maxAmmo}`, 30, 45);
        ctx.shadowBlur = 0;
        
        // Barra de munição com gradiente e efeito de brilho
        const barWidth = 180;
        const barHeight = 15;
        const ammoPercent = currentAmmo / config.attackMode.maxAmmo;
        
        // Fundo da barra com efeito de brilho
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(30, 50, barWidth, barHeight);
        ctx.shadowBlur = 0;
        
        // Barra de munição com gradiente animado
        const gradient = ctx.createLinearGradient(30, 50, 30 + barWidth, 50);
        if (ammoPercent > 0.3) {
            gradient.addColorStop(0, "#00FF00");
            gradient.addColorStop(0.5, "#00CC00");
            gradient.addColorStop(1, "#00FF00");
        } else if (ammoPercent > 0.1) {
            gradient.addColorStop(0, "#FFFF00");
            gradient.addColorStop(0.5, "#CCCC00");
            gradient.addColorStop(1, "#FFFF00");
        } else {
            gradient.addColorStop(0, "#FF0000");
            gradient.addColorStop(0.5, "#CC0000");
            gradient.addColorStop(1, "#FF0000");
        }
        
        // Efeito de pulso na barra
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9;
        ctx.fillStyle = gradient;
        ctx.fillRect(30, 50, barWidth * ammoPercent * pulse, barHeight);
        
        // Indicador de cooldown com efeito de brilho
        if (ammoRegenTimer > 0) {
            const cooldownPercent = 1 - (ammoRegenTimer / config.attackMode.ammoRegenDelay);
            ctx.shadowBlur = 5;
            ctx.shadowColor = "rgba(255, 0, 0, 0.5)";
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(30, 50, barWidth * cooldownPercent, barHeight);
            ctx.shadowBlur = 0;
            
            // Texto de cooldown com efeito de brilho
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.shadowBlur = 3;
            ctx.shadowColor = "rgba(255, 0, 0, 0.5)";
            const secondsLeft = Math.ceil(ammoRegenTimer / 60);
            ctx.fillText(`${secondsLeft}s`, 220, 45);
            ctx.shadowBlur = 0;
        }
        
        // Indicador de modo de ataque ativo
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(25, 25, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Efeito de pulso no indicador
        const indicatorPulse = Math.sin(Date.now() / 200) * 5 + 15;
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(25, 25, indicatorPulse, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Desenha conexão entre portais
    gameZones.forEach(zone => {
        if (zone.type === "portal" && zone.active && zone.linkedTo && zone.linkedTo.active) {
            ctx.beginPath();
            ctx.moveTo(zone.x, zone.y);
            ctx.lineTo(zone.linkedTo.x, zone.linkedTo.y);
            ctx.strokeStyle = "rgba(200, 50, 200, 0.3)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });

    // Desenha os rastros do dash
    dashTrails.forEach(trail => {
        ctx.globalAlpha = trail.alpha;
        ctx.fillStyle = trail.color;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Desenha o ataque especial quando ativo
    if (specialAttackActive) {
        // Desenha o círculo de ataque
        ctx.beginPath();
        ctx.arc(player.x, player.y, config.specialAttack.radius, 0, Math.PI * 2);
        ctx.fillStyle = config.specialAttack.color + "20";
        ctx.fill();
        
        // Adiciona efeito de pulso
        const pulse = Math.sin(Date.now() / 100) * 0.2 + 0.8;
        ctx.strokeStyle = config.specialAttack.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, config.specialAttack.radius * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Desenha partículas no perímetro
        for (let i = 0; i < 360; i += 10) {
            const angle = (i * Math.PI) / 180;
            const x = player.x + Math.cos(angle) * config.specialAttack.radius;
            const y = player.y + Math.sin(angle) * config.specialAttack.radius;
            createParticles(x, y, config.specialAttack.color, 1);
        }
    }
    
    // Desenha o cooldown do ataque especial
    if (specialAttackCooldown > 0) {
        const cooldownPercent = 1 - (specialAttackCooldown / config.specialAttack.cooldown);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Especial: ${Math.ceil(specialAttackCooldown / 60)}s`, 20, 100);
        
        // Barra de cooldown
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(20, 110, 100, 10);
        ctx.fillStyle = config.specialAttack.color;
        ctx.fillRect(20, 110, 100 * cooldownPercent, 10);
    }

    // Desenha o escudo quando ativo
    if (shieldActive) {
        // Desenha o círculo do escudo maior
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius * config.shield.sizeMultiplier, 0, Math.PI * 2);
        ctx.fillStyle = config.shield.color + "20";
        ctx.fill();
        
        // Adiciona efeito de pulso
        const pulse = Math.sin(Date.now() / 100) * 0.2 + 0.8;
        ctx.strokeStyle = config.shield.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius * config.shield.sizeMultiplier * pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        // Desenha partículas girando
        for (let i = 0; i < 360; i += 20) {
            const angle = (i * Math.PI) / 180 + Date.now() / 500;
            const x = player.x + Math.cos(angle) * player.radius * config.shield.sizeMultiplier;
            const y = player.y + Math.sin(angle) * player.radius * config.shield.sizeMultiplier;
            createParticles(x, y, config.shield.color, 1);
        }
    }
    
    // Desenha o cooldown do escudo
    if (shieldCooldown > 0) {
        const cooldownPercent = 1 - (shieldCooldown / config.shield.cooldown);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Escudo: ${Math.ceil(shieldCooldown / 60)}s`, 20, 100);
        
        // Barra de cooldown
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(20, 110, 100, 10);
        ctx.fillStyle = config.shield.color;
        ctx.fillRect(20, 110, 100 * cooldownPercent, 10);
    }

    ctx.restore();
    drawMiniMap();
    drawUI();
}

// ========== GAME LOOP ========== //
function gameLoop() {
    if (!inMenu && !gameOver) {
        // Atualiza apenas o player local
        updatePlayer();
        update();
        draw();

        // Envia a posição do jogador para o servidor
        socket.emit('playerUpdate', {
            x: player.x,
            y: player.y,
            radius: player.radius,
            score: score,
            color: player.color
        });
    }
    requestAnimationFrame(gameLoop);
}

// ========== EVENT HANDLERS ========== //
window.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        // Return to home screen
        gameOver = true;
        inMenu = true;
        loginScreen.style.display = "flex";
        gameOverScreen.style.display = "none";
        return;
    }

    if (gameOver || inMenu) return;
    
    try {
        switch (e.key.toLowerCase()) {
            case "w":
            case " ":
                dash();
                break;
            case "e":
                activateShield();
                break;
            case "r":
                activateSpecialAttack();
                break;
            case "q":
                toggleAttackMode();
                break;
            case "f":
                if (particleMode) mergeSelectedParticles();
                break;
            case "d":
                if (particleMode && particles.length > 0) splitParticle(0);
                break;
            case "c":
                if (particleMode) {
                    const currentIndex = config.particleMode.groupStrategies.indexOf(currentGroupStrategy);
                    currentGroupStrategy = config.particleMode.groupStrategies[(currentIndex + 1) % config.particleMode.groupStrategies.length];
                }
                break;
        }
    } catch (error) {
        console.error("Error handling key press:", error);
    }
});

// Add keyboard controls for second player
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    arrowUp: false,
    arrowLeft: false,
    arrowDown: false,
    arrowRight: false
};

// Keyboard event listeners
window.addEventListener('keydown', (e) => {
    if (typeof e.key === 'string') {
        switch(e.key.toLowerCase()) {
            case 'w': keys.w = true; break;
            case 'a': keys.a = true; break;
            case 's': keys.s = true; break;
            case 'd': keys.d = true; break;
            case 'arrowup': keys.arrowUp = true; break;
            case 'arrowleft': keys.arrowLeft = true; break;
            case 'arrowdown': keys.arrowDown = true; break;
            case 'arrowright': keys.arrowRight = true; break;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (typeof e.key === 'string') {
        switch(e.key.toLowerCase()) {
            case 'w': keys.w = false; break;
            case 'a': keys.a = false; break;
            case 's': keys.s = false; break;
            case 'd': keys.d = false; break;
            case 'arrowup': keys.arrowUp = false; break;
            case 'arrowleft': keys.arrowLeft = false; break;
            case 'arrowdown': keys.arrowDown = false; break;
            case 'arrowright': keys.arrowRight = false; break;
        }
    }
});

// Modify the updatePlayer function to handle keyboard input
function updatePlayer() {
    if (gameOver || inMenu) return;

    if (player.radius <= config.minRadius) {
        handleGameOver();
        return;
    }

    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 20) player.trail.shift();

    if (stunTimer-- > 0) {
        createParticles(player.x, player.y, "#FFA500", 2);
        return;
    }

    // Atualizar temporizadores de poderes
    if (invisibleTimer > 0) {
        invisibleTimer--;
        player.isInvisible = true;
        if (invisibleTimer === 0) {
            player.isInvisible = false;
            createParticles(player.x, player.y, "#FFFFFF", 20);
        }
    }

    if (trapTimer > 0) {
        trapTimer--;
        player.hasTrap = true;
        if (trapTimer === 0) {
            player.hasTrap = false;
            createParticles(player.x, player.y, "#FF8000", 20);
        }
    }

    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const dist = Math.hypot(dx, dy);
    let speed = updateInteractiveEnvironments();

    // Calcula a velocidade base baseada no tamanho do jogador
    // Se score > 300, velocidade fixa e constante
    if (score > 300) {
        speed = config.baseSpeed * 0.35; // valor fixo, ajuste se quiser mais rápido/lento
    } else {
        const sizeSpeedFactor = Math.max(0.1, 1 - (player.radius / config.maxRadius) * 0.8);
        speed *= sizeSpeedFactor;
    }

    // Aplica o fator de lentidão quando no modo de ataque
    if (attackMode) {
        speed *= config.attackMode.slowFactor;
    }

    // Aplica slow quando atingido
    if (hitSlowTimer > 0) {
        speed *= 0.5;
        hitSlowTimer--;
    }

    if (boostTimer-- > 0) {
        speed *= config.boostMultiplier;
        createParticles(player.x, player.y, "#00FF00", 3);
    }

    if (dashTimer > 0) {
        speed *= config.dashSpeed;
        createParticles(player.x, player.y, player.color, 2);
    }

    if (infectionTimer > 0) {
        infectionTimer--;
        player.radius -= 0.1;
        if (infectionTimer % 10 === 0) {
            createParticles(player.x, player.y, "#FF0000", 2);
        }
    }

    if (dist > 1) {
        player.x += dx / dist * speed;
        player.y += dy / dist * speed;
    }

    player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));

    // Ajusta o zoom para diminuir mais gradualmente conforme o jogador cresce
    const zoomFactor = (1 - (player.radius / config.maxRadius) * zoomConfig.sensitivity) * 0.8;
    targetZoom = Math.max(zoomConfig.minZoom, Math.min(zoomConfig.maxZoom, zoomFactor));
    currentZoom += (targetZoom - currentZoom) * zoomConfig.smoothness;
}

// Modify the game loop to handle both players
function gameLoop() {
    if (!inMenu && !gameOver) {
        // Update all players
        localPlayers.forEach((player, index) => {
            if (index === 0) {
                // First player uses mouse
                updatePlayer(player, mouseX, mouseY, false);
            } else {
                // Second player uses keyboard
                updatePlayer(player, mouseX, mouseY, true);
            }
        });
        
        // Update other game elements
        update();
        
        // Draw everything
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Modify the start game function to handle multiple players
startButton.addEventListener('click', (e) => {
  // Nickname opcional
  let nick = nicknameInput.value.trim();
  if (!nick) nick = 'Player';

  // Obter personagem selecionado do localStorage
  let charKey = null;
  if (window.getSelectedCharKey) {
    charKey = window.getSelectedCharKey();
  } else {
    charKey = localStorage.getItem('selectedChar');
  }
  if (!charKey || !CHARACTERS[charKey]) {
    alert('Escolha um personagem para jogar!');
    e.preventDefault();
    return false;
  }

  // Buscar dados do personagem pelo objeto centralizado
  const charData = CHARACTERS[charKey];

  playerName = nick;
  Object.assign(player, {
    name: playerName,
    color: charData.color,
    effect: charData.effect,
    attr: charData.attr
  });

  // Reset habilidades
  config.baseSpeed = 2.2; // já ajustado para mais rápido
  player.canStun = charData.canStun;
  player.burnAttack = charData.burnAttack;
  player.explosiveAttack = charData.explosiveAttack;

  // Dash especial para Roxo, Vermelho, Azul, Amarelo
  if (["roxo", "vermelho", "azul", "amarelo"].includes(charKey)) {
    config.dashSpeed = 6.0; // dash ainda mais rápido
    config.dashDuration = 40; // dash ainda mais longo
  } else {
    config.dashSpeed = 2.5;
    config.dashDuration = 15;
  }

  // NÃO adicionar múltiplos jogadores locais
  // addLocalPlayer(playerName);

  loginScreen.style.display = 'none';
  inMenu = false;
  resetGame();
});

function createExplosion(x, y, color, size, count = 30, force = 1) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 5 + 2) * force;
        const life = 30 + Math.random() * 30;
        const particleSize = size * (0.3 + Math.random() * 0.7);
        
        particleEffects.push({
            x, y,
            color: color,
            size: particleSize,
            speed: speed,
            angle: angle,
            life: life,
            glow: true,
            fade: true
        });
    }
}

function splitCell(type) {
    if (playerCells.length > 0 || player.radius < config.minRadius * 2) return;
    
    // Create massive explosion effect
    createExplosion(player.x, player.y, player.color, player.radius, 300, 2.5);
    
    const baseRadius = player.radius;
    const angle = Math.atan2(mouseY - canvas.height / 2 - player.y, mouseX - canvas.width / 2 - player.x);
    
    // Clear existing cells
    playerCells = [];
    
    // Different split types
    let cells = [];
    switch(type) {
        case "normal":
            // Standard split into 2 cells
            cells = createSplitCells(baseRadius * 0.6, angle, 2, 1.0);
            break;
        case "triple":
            // Split into 3 cells in a triangle formation
            cells = createSplitCells(baseRadius * 0.5, angle, 3, 1.2);
            break;
        case "quad":
            // Split into 4 cells in a square formation
            cells = createSplitCells(baseRadius * 0.45, angle, 4, 1.4);
            break;
        case "scatter":
            // Split into 5 cells in a star formation
            cells = createSplitCells(baseRadius * 0.4, angle, 5, 1.6);
            break;
        case "explosive":
            // Split into 8 cells in all directions
            cells = createSplitCells(baseRadius * 0.35, angle, 8, 2.0);
            break;
        default:
            cells = createSplitCells(baseRadius * 0.6, angle, 2, 1.0);
    }
    
    // Add all cells
    playerCells.push(...cells);
    
    // Update player to be the first cell
    player.x = cells[0].x;
    player.y = cells[0].y;
    player.radius = cells[0].radius;
    player.trail = [];
}

function createSplitCells(baseRadius, angle, count, forceMultiplier) {
    const cells = [];
    const angleStep = (Math.PI * 2) / count;
    const baseForce = 25 * forceMultiplier;
    
    for (let i = 0; i < count; i++) {
        const cellAngle = angle + (i * angleStep);
        const force = baseForce + Math.random() * 10;
        const speed = config.baseSpeed * (2.0 + (i * 0.2));
        
        const cell = {
            x: player.x,
            y: player.y,
            radius: baseRadius,
            color: player.color,
            speed: speed,
            vx: Math.cos(cellAngle) * force,
            vy: Math.sin(cellAngle) * force,
            mergeTimer: config.mergeDelay,
            splitTimer: 60,
            trail: [],
            mass: baseRadius * baseRadius,
            isLeader: i === 0
        };
        
        // Add explosion effect for each cell
        createExplosion(cell.x, cell.y, cell.color, cell.radius, 50, 1.5);
        
        cells.push(cell);
    }
    
    return cells;
}

function splitParticle(index) {
    if (index >= particles.length) return;
    
    const particle = particles[index];
    if (particle.radius < config.particleMode.splitRadius * 2 || particle.splitTimer > 0) return;
    
    // Create explosion effect
    createExplosion(particle.x, particle.y, particle.color, particle.radius, 30);
    
    const newRadius = particle.radius / 2;
    const angle = Math.atan2(mouseY - canvas.height / 2 - particle.y, mouseX - canvas.width / 2 - particle.x);
    const force = config.particleMode.splitForce * 1.5;
    
    // Create two new particles with enhanced split force
    particles.push(new Particle(
        particle.x,
        particle.y,
        newRadius
    ));
    
    particles.push(new Particle(
        particle.x,
        particle.y,
        newRadius
    ));
    
    // Apply enhanced split force
    const lastIndex = particles.length - 1;
    particles[lastIndex].vx = Math.cos(angle) * force;
    particles[lastIndex].vy = Math.sin(angle) * force;
    particles[lastIndex-1].vx = -Math.cos(angle) * force;
    particles[lastIndex-1].vy = -Math.sin(angle) * force;
    
    // Create explosion for each new particle
    createExplosion(particles[lastIndex].x, particles[lastIndex].y, particles[lastIndex].color, newRadius, 15);
    createExplosion(particles[lastIndex-1].x, particles[lastIndex-1].y, particles[lastIndex-1].color, newRadius, 15);
    
    // Set split timer
    particles[lastIndex].splitTimer = config.particleMode.mergeDelay;
    particles[lastIndex-1].splitTimer = config.particleMode.mergeDelay;
    
    // Remove original particle
    particles.splice(index, 1);
}

function mergeSelectedParticles() {
    if (selectedParticles.size < 2) return;
    
    const particlesToMerge = Array.from(selectedParticles);
    const totalMass = particlesToMerge.reduce((sum, i) => sum + particles[i].radius * particles[i].radius, 0);
    const newRadius = Math.sqrt(totalMass);
    
    // Calculate center of mass
    const centerX = particlesToMerge.reduce((sum, i) => sum + particles[i].x, 0) / particlesToMerge.length;
    const centerY = particlesToMerge.reduce((sum, i) => sum + particles[i].y, 0) / particlesToMerge.length;
    
    // Create explosion effect for each merged particle
    particlesToMerge.forEach(i => {
        createExplosion(particles[i].x, particles[i].y, particles[i].color, particles[i].radius, 20);
    });
    
    // Create new merged particle
    const newParticle = new Particle(
        centerX,
        centerY,
        newRadius,
        particles[particlesToMerge[0]].isLeader
    );
    
    // Create big explosion for the new merged particle
    createExplosion(centerX, centerY, newParticle.color, newRadius, 40);
    
    // Set merge timer
    newParticle.mergeTimer = config.particleMode.mergeDelay;
    
    // Remove merged particles and add new one
    particles = particles.filter((_, i) => !selectedParticles.has(i));
    particles.push(newParticle);
    selectedParticles.clear();
}

function updatePlayerCells() {
    if (playerCells.length === 0) return;
    
    // Update each cell with momentum
    for (let i = playerCells.length - 1; i >= 0; i--) {
        const cell = playerCells[i];
        if (!cell) continue;
        
        try {
            // Update timers
            if (cell.mergeTimer > 0) cell.mergeTimer--;
            if (cell.splitTimer > 0) cell.splitTimer--;
            
            // Apply friction to velocity (less friction for faster movement)
            cell.vx *= 0.98;
            cell.vy *= 0.98;
            
            // Add mouse following force (stronger for leader)
            const dx = mouseX - canvas.width / 2 - cell.x;
            const dy = mouseY - canvas.height / 2 - cell.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 1) {
                const force = cell.speed / dist * (cell.isLeader ? 1.2 : 1.0);
                cell.vx += dx * force;
                cell.vy += dy * force;
            }
            
            // Update position
            cell.x += cell.vx;
            cell.y += cell.vy;
            
            // Keep within bounds with bounce
            if (cell.x < cell.radius) {
                cell.x = cell.radius;
                cell.vx *= -0.7;
            } else if (cell.x > world.width - cell.radius) {
                cell.x = world.width - cell.radius;
                cell.vx *= -0.7;
            }
            
            if (cell.y < cell.radius) {
                cell.y = cell.radius;
                cell.vy *= -0.7;
            } else if (cell.y > world.height - cell.radius) {
                cell.y = world.height - cell.radius;
                cell.vy *= -0.7;
            }
            
            // Update trail with fade effect
            if (!cell.trail) cell.trail = [];
            cell.trail.push({ 
                x: cell.x, 
                y: cell.y,
                alpha: 1.0
            });
            
            // Fade trail
            cell.trail.forEach(point => point.alpha *= 0.95);
            if (cell.trail.length > 20) cell.trail.shift();
            
            // Check for collisions between cells
            for (let j = 0; j < playerCells.length; j++) {
                if (i === j) continue;
                const otherCell = playerCells[j];
                const dist = Math.hypot(cell.x - otherCell.x, cell.y - otherCell.y);
                
                if (dist < cell.radius + otherCell.radius && cell.mergeTimer === 0 && otherCell.mergeTimer === 0) {
                    // Create explosion effect
                    createExplosion(cell.x, cell.y, cell.color, cell.radius, 100, 1.5);
                    
                    // Merge cells
                    const totalMass = cell.mass + otherCell.mass;
                    const newRadius = Math.sqrt(totalMass);
                    
                    // Update main cell
                    cell.radius = newRadius;
                    cell.mass = totalMass;
                    cell.speed = config.baseSpeed * (1 + (config.minRadius / newRadius));
                    cell.mergeTimer = config.mergeDelay;
                    cell.isLeader = cell.isLeader || otherCell.isLeader;
                    
                    // Remove other cell
                    playerCells.splice(j, 1);
                    break;
                }
            }
            
            // Check for enemy collisions
            for (let enemyIndex = 0; enemyIndex < enemies.length; enemyIndex++) {
                const enemy = enemies[enemyIndex];
                const dist = Math.hypot(cell.x - enemy.x, cell.y - enemy.y);
                if (dist < cell.radius + enemy.radius) {
                    if (cell.radius > enemy.radius * 1.1) {
                        // Cell eats enemy
                        const massGain = enemy.radius * 0.2;
                        cell.radius = Math.sqrt(cell.mass + massGain * massGain);
                        cell.mass = cell.radius * cell.radius;
                        score += Math.floor(enemy.radius);
                        
                        createExplosion(enemy.x, enemy.y, enemy.color, enemy.radius, 50, 1.5);
                        
                        // Respawn enemy
                        enemy.x = Math.random() * world.width;
                        enemy.y = Math.random() * world.height;
                        enemy.radius = 15 + Math.random() * 50;
                        enemy.color = getRandomColor();
                    } else if (enemy.radius > cell.radius * 1.1) {
                        // Enemy eats cell
                        playerCells.splice(i, 1);
                        return;
                    }
                }
            }
        } catch (error) {
            console.error("Error updating cell:", error);
            playerCells.splice(i, 1);
        }
    }
    
    // Check if all cells can merge back
    if (playerCells.length === 1 && playerCells[0] && playerCells[0].mergeTimer === 0) {
        const lastCell = playerCells[0];
        // Create final explosion
        createExplosion(lastCell.x, lastCell.y, lastCell.color, lastCell.radius, 200, 2.0);
        
        player.x = lastCell.x;
        player.y = lastCell.y;
        player.radius = lastCell.radius;
        player.trail = [];
        playerCells = [];
    }
}

function dash() {
    if (dashCooldownTimer > 0 || dashTimer > 0) return;
    
    dashTimer = config.dashDuration;
    dashCooldownTimer = config.dashCooldown;
    
    // Cria efeito de rastro do dash aumentado
    const angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
    const trailCount = 30; // Aumentado para 30 partículas
    
    for (let i = 0; i < trailCount; i++) {
        const size = player.radius * (1 - i/trailCount) * 1.2; // Aumentado o tamanho
        const alpha = 1 - (i/trailCount);
        const distance = -player.radius * (i/trailCount) * 3; // Aumentado a distância
        
        dashTrails.push({
            x: player.x + Math.cos(angle) * distance,
            y: player.y + Math.sin(angle) * distance,
            size: size,
            color: player.color,
            alpha: alpha,
            life: 30 - i // Aumentado o tempo de vida
        });
    }
    
    // Efeito de partículas aumentado
    for (let i = 0; i < 40; i++) { // Aumentado para 40 partículas
        const spread = (Math.random() - 0.5) * Math.PI / 3; // Aumentado o spread
        const speed = Math.random() * 4 + 3; // Aumentado a velocidade
        particleEffects.push({
            x: player.x,
            y: player.y,
            color: player.color,
            size: Math.random() * 4 + 3, // Aumentado o tamanho
            speed: speed,
            angle: angle + spread,
            life: 25 // Aumentado o tempo de vida
        });
    }
}

function enterParticleMode() {
    if (particleMode) return;
    
    particleMode = true;
    particles = [];
    selectedParticles.clear();
    
    // Create initial particles
    const baseRadius = player.radius / 2;
    for (let i = 0; i < config.particleMode.maxParticles; i++) {
        const angle = (i / config.particleMode.maxParticles) * Math.PI * 2;
        const distance = baseRadius * 2;
        
        particles.push(new Particle(
            player.x + Math.cos(angle) * distance,
            player.y + Math.sin(angle) * distance,
            baseRadius,
            i === 0
        ));
    }
    
    player.radius = 0; // Hide main player
}

function exitParticleMode() {
    if (!particleMode) return;
    
    particleMode = false;
    // Merge all particles back into player
    const totalMass = particles.reduce((sum, p) => sum + p.radius * p.radius, 0);
    player.radius = Math.sqrt(totalMass);
    player.x = particles[0].x;
    player.y = particles[0].y;
    particles = [];
    selectedParticles.clear();
}

function redistributeMass() {
    const totalMass = particles.reduce((sum, p) => sum + p.radius * p.radius, 0);
    const avgRadius = Math.sqrt(totalMass / particles.length);
    
    particles.forEach(p => {
        p.radius = avgRadius;
        p.speed = config.particleMode.baseSpeed * (1 + (config.particleMode.minRadius / p.radius));
    });
}

// Add mouse click handler for selecting particles
canvas.addEventListener('click', e => {
    if (!particleMode) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find clicked particle
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dist = Math.hypot(x - p.x, y - p.y);
        if (dist < p.radius) {
            if (selectedParticles.has(i)) {
                selectedParticles.delete(i);
            } else {
                selectedParticles.add(i);
            }
            break;
        }
    }
});

// Add click handler for shooting
canvas.addEventListener("click", e => {
    if (attackMode && !inMenu && !gameOver) {
        shootProjectile();
    }
});

function createProjectile(x, y, angle) {
    // Dano reduzido se score >= 200
    let damage = config.attackMode.damage * player.radius;
    if (score >= 200) {
        damage *= 0.5; // metade do dano
    }
    return {
        x: x,
        y: y,
        radius: config.attackMode.projectileRadius,
        color: player.color,
        speed: config.attackMode.projectileSpeed,
        vx: Math.cos(angle) * config.attackMode.projectileSpeed,
        vy: Math.sin(angle) * config.attackMode.projectileSpeed,
        life: 120, // Aumentei o tempo de vida
        damage: damage
    };
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        // Atualiza posição
        p.x += p.vx;
        p.y += p.vy;
        
        // Verifica colisão com inimigos
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            
            if (dist < p.radius + enemy.radius) {
                // Calcula o dano (10% do tamanho atual)
                const damage = enemy.radius * 0.1;
                const originalRadius = enemy.radius;
                
                // Aplica o dano, mas não deixa menor que 50% do tamanho original
                if (enemy.radius > enemy.originalRadius * 0.5) {
                    enemy.radius = Math.max(enemy.originalRadius * 0.5, enemy.radius - damage);
                    score += Math.floor(originalRadius - enemy.radius);
                    
                    // Aplica slow no inimigo
                    hitSlowTimer = 30; // 30 frames de slow
                    
                    // Efeito de explosão
                    createExplosion(p.x, p.y, p.color, p.radius, 30, 1.5);
                    
                    // Efeito visual no inimigo
                    createExplosion(enemy.x, enemy.y, enemy.color, enemy.radius, 20, 1.2);
                } else {
                    // Efeito visual quando o inimigo já atingiu o limite de dano
                    createExplosion(p.x, p.y, p.color, p.radius, 15, 0.8);
                }
                
                // Remove projétil
                projectiles.splice(i, 1);
                break;
            }
        }
        
        // Verifica limites do mundo
        if (p.x < 0 || p.x > world.width || p.y < 0 || p.y > world.height || p.life-- <= 0) {
            projectiles.splice(i, 1);
        }
    }
}

function shootProjectile() {
    if (!attackMode || 
        projectiles.length >= config.attackMode.maxProjectiles || 
        currentAmmo <= 0 || 
        shotCooldown > 0) {
        return;
    }

    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - canvas.height / 2;
    const angle = Math.atan2(dy, dx);
    
    const projectile = {
        x: player.x,
        y: player.y,
        radius: config.attackMode.projectileRadius,
        color: player.color,
        speed: config.attackMode.projectileSpeed,
        vx: Math.cos(angle) * config.attackMode.projectileSpeed,
        vy: Math.sin(angle) * config.attackMode.projectileSpeed,
        life: 120,
        damage: config.attackMode.damage * player.radius
    };
    
    projectiles.push(projectile);
    createExplosion(player.x, player.y, player.color, player.radius, 20, 1.2);
    
    player.radius -= config.attackMode.energyCost;
    currentAmmo--;
    shotCooldown = config.attackMode.shotCooldown;
    lastShotTime = 0;
    ammoRegenTimer = config.attackMode.ammoRegenDelay;
}

// Add auto-shoot when holding mouse button
canvas.addEventListener("mousedown", () => isMouseDown = true);
canvas.addEventListener("mouseup", () => isMouseDown = false);

function toggleAttackMode() {
    if (attackCooldown > 0) return;
    
    attackMode = !attackMode;
    attackCooldown = config.attackMode.cooldown;
    
    // Efeito visual melhorado ao ativar/desativar
    if (attackMode) {
        // Explosão maior e mais colorida
        createExplosion(player.x, player.y, player.color, player.radius * 2, 100, 2.0);
        
        // Efeito de pulso
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                createExplosion(player.x, player.y, player.color, player.radius * 1.5, 50, 1.5);
            }, i * 200);
        }
        
        // Efeito de partículas circulares
        for (let i = 0; i < 360; i += 10) {
            const angle = (i * Math.PI) / 180;
            const distance = player.radius * 1.5;
            const x = player.x + Math.cos(angle) * distance;
            const y = player.y + Math.sin(angle) * distance;
            createExplosion(x, y, player.color, 5, 1, 0.5);
        }
    }
}

function mergeCells() {
    if (playerCells.length < 2) return;
    
    // Calcula a massa total
    let totalMass = player.radius * player.radius;
    playerCells.forEach(cell => {
        totalMass += cell.radius * cell.radius;
    });
    
    // Cria explosão de fusão
    createExplosion(player.x, player.y, player.color, player.radius, 100, 2.0);
    
    // Atualiza o jogador principal
    player.radius = Math.sqrt(totalMass);
    player.trail = [];
    
    // Limpa as células divididas
    playerCells = [];
}

// Adiciona função para atualizar os rastros
function updateDashTrails() {
    for (let i = dashTrails.length - 1; i >= 0; i--) {
        const trail = dashTrails[i];
        trail.life--;
        trail.alpha *= 0.98; // Diminuído a taxa de desaparecimento
        trail.size *= 0.98; // Diminuído a taxa de redução
        
        if (trail.life <= 0 || trail.alpha <= 0.1) {
            dashTrails.splice(i, 1);
        }
    }
}

// Função para ativar o ataque especial
function activateSpecialAttack() {
    if (specialAttackCooldown <= 0 && !specialAttackActive) {
        specialAttackActive = true;
        specialAttackTimer = config.specialAttack.duration;
        specialAttackCooldown = config.specialAttack.cooldown;
        
        // Cria efeito visual de ativação
        createExplosion(player.x, player.y, config.specialAttack.color, player.radius * 2, 100, 2.0);
        
        // Efeito especial: stun nos inimigos se o personagem for azul
        if (player.canStun) {
            enemies.forEach(enemy => {
                const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                if (dist < config.specialAttack.radius) {
                    enemy.stunTimer = 120; // 2 segundos de stun
                }
            });
        }
    }
}

// Função para atualizar o ataque especial
function updateSpecialAttack() {
    if (specialAttackActive) {
        specialAttackTimer--;
        if (specialAttackTimer <= 0) {
            specialAttackActive = false;
            specialStunApplied = false;
        }

        // Efeitos especiais conforme personagem
        // AZUL: stun só uma vez por ativação
        if (player.canStun && !specialStunApplied) {
            enemies.forEach(enemy => {
                const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                if (dist < config.specialAttack.radius) {
                    enemy.stunTimer = 120;
                }
            });
            specialStunApplied = true;
        }

        // AMARELO: ganha 4 de massa, cooldown de 1 minuto (3600 frames)
        if (player.burnAttack && !specialStunApplied) {
            player.radius += 4;
            specialAttackCooldown = 3600; // 1 minuto de cooldown
            createExplosion(player.x, player.y, '#ffe066', player.radius * 2, 80, 3.0); // efeito visual mais forte
            specialStunApplied = true;
        }

        // VERMELHO: onda de choque (knockback) com alcance ainda maior e empurrão 10x mais forte
        if (player.explosiveAttack && !specialStunApplied) {
            shockwaves.push({
                x: player.x,
                y: player.y,
                radius: config.specialAttack.radius + 300, // alcance ainda maior
                duration: 40 // dura um pouco mais
            });
            specialStunApplied = true;
        }

        // Roxo: efeito padrão (explosão visual)
        if (!player.canStun && !player.burnAttack && !player.explosiveAttack && !specialStunApplied) {
            enemies.forEach(enemy => {
                const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                if (dist < config.specialAttack.radius) {
                    createExplosion(enemy.x, enemy.y, '#a259ff', 20, 10, 1.0);
                }
            });
            specialStunApplied = true;
        }

        // Verde: boost de velocidade temporário
        if (player.effect === '+Velocidade') {
            config.baseSpeed = CHARACTERS['verde'].baseSpeed + 1.5;
            setTimeout(() => { config.baseSpeed = CHARACTERS['verde'].baseSpeed; }, 2000);
        }
    }
    if (specialAttackCooldown > 0) {
        specialAttackCooldown--;
    }
}

// Atualizar fireZones e aplicar burn em inimigos dentro
function updateFireZones() {
    fireZones = fireZones.filter(zone => zone.duration-- > 0);
    fireZones.forEach(zone => {
        // Desenhar área de fogo mais intensa e visível
        ctx.save();
        // Gradiente animado de fogo
        const t = Date.now() / 300;
        const flameGradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
        flameGradient.addColorStop(0, 'rgba(255,255,180,0.95)');
        flameGradient.addColorStop(0.25 + 0.05*Math.sin(t), 'rgba(255,200,0,0.7)');
        flameGradient.addColorStop(0.55 + 0.05*Math.cos(t), 'rgba(255,120,0,0.45)');
        flameGradient.addColorStop(1, 'rgba(255,60,0,0.18)');
        ctx.globalAlpha = 0.7 + 0.2 * Math.sin(Date.now()/120);
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI*2);
        ctx.fillStyle = flameGradient;
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 70;
        ctx.fill();
        // Contorno flamejante
        ctx.lineWidth = 10 + 4*Math.sin(Date.now()/80);
        ctx.strokeStyle = 'rgba(255, 120, 0, 0.85)';
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.restore();
        // Aplicar burn
        enemies.forEach(enemy => {
            const dist = Math.hypot(zone.x - enemy.x, zone.y - enemy.y);
            if (dist < zone.radius) {
                if (!enemy.burnTimer || enemy.burnTimer < 1) enemy.burnTimer = 60;
            }
        });
    });
}

// Atualizar shockwaves e aplicar knockback
function updateShockwaves() {
    shockwaves = shockwaves.filter(wave => wave.duration-- > 0);
    shockwaves.forEach(wave => {
        // Desenhar onda
        ctx.save();
        ctx.globalAlpha = 0.18 + 0.12 * Math.sin(Date.now()/80);
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI*2);
        ctx.strokeStyle = '#ff3b3b';
        ctx.lineWidth = 8;
        ctx.shadowColor = '#ff3b3b';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();
        // Aplicar knockback
        enemies.forEach(enemy => {
            const dist = Math.hypot(wave.x - enemy.x, wave.y - enemy.y);
            if (dist < wave.radius) {
                const angle = Math.atan2(enemy.y - wave.y, enemy.x - wave.x);
                enemy.x += Math.cos(angle) * 600; // empurra 10x mais forte
                enemy.y += Math.sin(angle) * 600;
            }
        });
    });
}

// Chamar updateFireZones e updateShockwaves no draw()
const originalDraw = draw;
draw = function() {
    originalDraw();
    updateFireZones();
    updateShockwaves();
    // Efeito visual de choque elétrico nos inimigos
    enemies.forEach(enemy => {
        if (enemy.electricShock && enemy.electricShock > 0) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI*2);
            ctx.strokeStyle = '#ffe066';
            ctx.lineWidth = 4 + 2*Math.sin(Date.now()/60);
            ctx.setLineDash([4, 4]);
            ctx.shadowColor = '#fffbe6';
            ctx.shadowBlur = 18;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
            enemy.electricShock--;
        }
    });
};

// Função para ativar o escudo
function activateShield() {
    if (shieldCooldown <= 0 && !shieldActive) {
        shieldActive = true;
        shieldTimer = config.shield.duration;
        shieldCooldown = config.shield.cooldown;
        
        // Cria efeito visual de ativação
        createExplosion(player.x, player.y, config.shield.color, player.radius * 2, 100, 2.0);
    }
}

// Função para atualizar o escudo
function updateShield() {
    if (shieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) {
            shieldActive = false;
        }
    }
    
    if (shieldCooldown > 0) {
        shieldCooldown--;
    }
}

// Update game over handling
function handleGameOver() {
    gameOver = true;
    createParticles(player.x, player.y, player.color, 50);
    addHighScore(playerName, score);
    
    // Show game over screen
    gameOverScreen.style.display = 'flex';
    finalScoreSpan.textContent = score;
}

// Add restart button handler
restartButton.addEventListener('click', () => {
    resetGame();
});

// Update UI function
function updateUI() {
    // Update score
    scoreDisplay.textContent = `Score: ${score}`;
    
    // Update bullet info
    bulletCount.textContent = `Bullets: ${currentAmmo}/${config.attackMode.maxAmmo}`;
    
    // Barra de cooldown fluida
    if (shotCooldown > 0) {
        const progress = 1 - (shotCooldown / config.attackMode.shotCooldown);
        bulletCooldown.style.width = `${progress * 100}%`;
        bulletCooldown.style.background = 'linear-gradient(90deg, #ff8800, #ffcc00)';
    } else if (ammoRegenTimer > 0) {
        const progress = 1 - (ammoRegenTimer / config.attackMode.ammoRegenDelay);
        bulletCooldown.style.width = `${progress * 100}%`;
        bulletCooldown.style.background = 'linear-gradient(90deg, #ff8800, #ffcc00)';
    } else if (currentAmmo < config.attackMode.maxAmmo) {
        bulletCooldown.style.width = '0%';
        bulletCooldown.style.background = 'linear-gradient(90deg, #ff8800, #ffcc00)';
    } else {
        bulletCooldown.style.width = '100%';
        bulletCooldown.style.background = 'linear-gradient(90deg, #00ff88, #00ffcc)';
    }

    // Update shield cooldown UI with improved visuals
    if (shieldCooldown > 0) {
        const cooldownPercent = (shieldCooldown / config.shield.cooldown) * 100;
        document.getElementById('shieldCooldown').style.width = `${cooldownPercent}%`;
        document.getElementById('shieldStatus').textContent = `Shield: ${Math.ceil(shieldCooldown)}s`;
    } else {
        document.getElementById('shieldCooldown').style.width = '0%';
        document.getElementById('shieldStatus').textContent = 'Shield: Ready';
    }

    // Update ultimate cooldown UI with improved visuals
    if (specialAttackCooldown > 0) {
        const cooldownPercent = (specialAttackCooldown / config.specialAttack.cooldown) * 100;
        document.getElementById('ultimateCooldown').style.width = `${cooldownPercent}%`;
        document.getElementById('ultimateStatus').textContent = `Ultimate: ${Math.ceil(specialAttackCooldown)}s`;
    } else {
        document.getElementById('ultimateCooldown').style.width = '0%';
        document.getElementById('ultimateStatus').textContent = 'Ultimate: Ready';
    }
}

// Inicia o jogo
gameLoop(); 

// Skin system
let currentSkin = null;
let availableSkins = [];
let selectedSkinId = 'default';
let unlockedSkins = new Set(['default', 'neon']); // Começa com as skins free

// Load skins from configuration
async function loadSkins() {
    try {
        const response = await fetch('skins/skins.json');
        const data = await response.json();
        availableSkins = data.skins;
        
        // Load unlocked skins from localStorage
        const savedUnlocked = localStorage.getItem('unlockedSkins');
        if (savedUnlocked) {
            unlockedSkins = new Set(JSON.parse(savedUnlocked));
        }
        
        updateSkinSelector();
    } catch (error) {
        console.error('Error loading skins:', error);
    }
}

// Update skin selector in the UI
function updateSkinSelector() {
    const skinContainer = document.getElementById('skinSelector');
    if (!skinContainer) return;

    skinContainer.innerHTML = '<h2>Select Your Skin</h2>';
    const skinsGrid = document.createElement('div');
    skinsGrid.className = 'skins-grid';

    availableSkins.forEach(skin => {
        const skinElement = document.createElement('div');
        const isUnlocked = unlockedSkins.has(skin.id);
        skinElement.className = `skin-item ${skin.type} ${selectedSkinId === skin.id ? 'selected' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        // Criar preview com efeitos especiais
        const previewClass = skin.special ? `skin-preview ${skin.special}` : 'skin-preview';
        
        skinElement.innerHTML = `
            <div class="${previewClass}" style="background-color: ${skin.color}; box-shadow: 0 0 10px ${skin.glowColor}"></div>
            <span class="skin-name">${skin.name}</span>
            <span class="skin-status">${isUnlocked ? '' : `${skin.cost} Coins`}</span>
            ${isUnlocked ? 
                `<button class="select-button">Select</button>` : 
                `<button class="buy-button">Buy</button>`
            }
        `;
        
        // Adicionar eventos
        const button = skinElement.querySelector('button');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isUnlocked) {
                selectSkin(skin.id);
            } else if (score >= skin.cost) {
                unlockSkin(skin.id);
            } else {
                alert('Not enough coins!');
            }
        });

        skinsGrid.appendChild(skinElement);
    });

    skinContainer.appendChild(skinsGrid);
}

// Select a skin
function selectSkin(skinId) {
    if (!unlockedSkins.has(skinId)) return;
    
    selectedSkinId = skinId;
    currentSkin = availableSkins.find(skin => skin.id === skinId);
    if (currentSkin) {
        player.color = currentSkin.color;
        localStorage.setItem('selectedSkin', skinId);
        updateSkinSelector();
    }
}

// Unlock a new skin
function unlockSkin(skinId) {
    const skin = availableSkins.find(s => s.id === skinId);
    if (!skin || unlockedSkins.has(skinId)) return;
    
    if (score >= skin.cost) {
        score -= skin.cost;
        unlockedSkins.add(skinId);
        localStorage.setItem('unlockedSkins', JSON.stringify([...unlockedSkins]));
        updateSkinSelector();
        selectSkin(skinId); // Automatically select the new skin
    }
}

// Apply skin effects in game
function applySkinEffects(ctx, x, y, radius) {
    if (!currentSkin) return;

    if (currentSkin.special === 'rainbow') {
        const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
        const time = Date.now() * 0.001;
        gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 100%, 50%)`);
        gradient.addColorStop(0.5, `hsl(${(time * 50 + 120) % 360}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${(time * 50 + 240) % 360}, 100%, 50%)`);
        return gradient;
    }
    
    if (currentSkin.special === 'cosmic') {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const time = Date.now() * 0.001;
        gradient.addColorStop(0, `hsl(${(time * 30) % 360}, 80%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${(time * 30 + 60) % 360}, 80%, 40%)`);
        gradient.addColorStop(1, `hsl(${(time * 30 + 120) % 360}, 80%, 20%)`);
        return gradient;
    }

    return currentSkin.color;
}

// Update player drawing to use skin effects
function drawPlayer() {
    if (!gameOver && !player.isInvisible) {
        // Gradiente animado intenso dentro do player
        const time = Date.now() * 0.003;
        const grad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.1, player.x, player.y, player.radius);
        grad.addColorStop(0, `hsl(${(time * 180) % 360}, 100%, 70%)`);
        grad.addColorStop(0.4, `hsl(${(time * 180 + 90) % 360}, 100%, 60%)`);
        grad.addColorStop(0.8, `hsl(${(time * 180 + 180) % 360}, 100%, 50%)`);
        grad.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        // Brilho pulsante dinâmico
        const pulse = Math.sin(Date.now() / 120) * 0.15 + 1.1;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius * pulse * 1.15, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${(time * 180 + 120) % 360}, 100%, 60%)`;
        ctx.shadowColor = `hsl(${(time * 180 + 120) % 360}, 100%, 60%)`;
        ctx.shadowBlur = 25;
        ctx.fill();
        ctx.restore();

        // Contorno dinâmico
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.lineWidth = 3 + Math.sin(time * 2) * 2;
        ctx.strokeStyle = `hsl(${(time * 180 + 240) % 360}, 100%, 80%)`;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        // Efeito especial durante a ultimate (mantém)
        if (specialAttackActive) {
            const pulseUlt = Math.sin(Date.now() / 150) * 0.3 + 1.2;
            ctx.save();
            ctx.globalAlpha = 0.7;
            const gradUlt = ctx.createRadialGradient(player.x, player.y, player.radius * 1.1, player.x, player.y, player.radius * 2.2 * pulseUlt);
            gradUlt.addColorStop(0, 'rgba(255,0,255,0.5)');
            gradUlt.addColorStop(0.5, 'rgba(0,229,255,0.3)');
            gradUlt.addColorStop(1, 'rgba(255,255,0,0.1)');
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius * 2.2 * pulseUlt, 0, Math.PI * 2);
            ctx.fillStyle = gradUlt;
            ctx.fill();
            ctx.restore();
        }

        // Draw player name above the character
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(player.name || playerName, player.x, player.y - player.radius - 20);
    }
}