const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuração do jogo
const gameConfig = {
  worldSize: { width: 10000, height: 10000 },
  maxPlayers: 100,
  playerConfig: {
    minRadius: 15,
    maxRadius: 120,
    baseSpeed: 1.5
  }
};

// Estado do jogo
const gameState = {
  players: {},
  energyBalls: {},
  enemies: {},
  zones: {}
};

// Gera objetos do jogo (energia, inimigos, zonas)
function generateGameObjects() {
  // Implemente similar ao que você tem no cliente
}

// Inicia o servidor
server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
  generateGameObjects();
});

// Lógica de conexão Socket.io
io.on('connection', (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`);

  // Quando um jogador se junta ao jogo
  socket.on('joinGame', (playerData) => {
    const newPlayer = {
      id: socket.id,
      name: playerData.name || `Player${Math.floor(Math.random() * 1000)}`,
      x: Math.random() * gameConfig.worldSize.width,
      y: Math.random() * gameConfig.worldSize.height,
      radius: 25,
      color: getRandomColor(),
      score: 0,
      lastUpdate: Date.now()
    };

    gameState.players[socket.id] = newPlayer;
    
    // Envia o estado inicial para o novo jogador
    socket.emit('initGame', {
      player: newPlayer,
      world: gameConfig.worldSize,
      gameState: gameState
    });

    // Notifica outros jogadores sobre o novo jogador
    socket.broadcast.emit('newPlayer', newPlayer);
  });

  // Quando um jogador se move
  socket.on('playerMove', (movementData) => {
    if (!gameState.players[socket.id]) return;

    const player = gameState.players[socket.id];
    
    // Atualiza posição do jogador
    player.x = movementData.x;
    player.y = movementData.y;
    player.radius = movementData.radius;
    player.score = movementData.score;
    player.lastUpdate = Date.now();

    // Envia atualização para todos os jogadores
    socket.broadcast.emit('playerMoved', {
      id: socket.id,
      ...movementData
    });
  });

  // Quando um jogador atira
  socket.on('playerShoot', (projectileData) => {
    const projectile = {
      ...projectileData,
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id
    };
    
    // Adiciona projétil ao estado do jogo
    gameState.projectiles[projectile.id] = projectile;
    
    // Envia para todos os jogadores
    io.emit('projectileCreated', projectile);
  });

  // Quando um jogador desconecta
  socket.on('disconnect', () => {
    if (!gameState.players[socket.id]) return;
    
    // Remove jogador do estado do jogo
    delete gameState.players[socket.id];
    
    // Notifica outros jogadores
    io.emit('playerDisconnected', socket.id);
  });
});

// Atualiza o estado do jogo em um intervalo fixo
setInterval(() => {
  // Verifica colisões e atualiza estado
  updateGameState();
  
  // Envia estado atualizado para todos os jogadores
  io.emit('gameStateUpdate', gameState);
}, 1000 / 30); // 30 updates por segundo

function updateGameState() {
  // Implemente a lógica de colisão e atualização do jogo aqui
}

function getRandomColor() {
  const colors = ['#00FFCC', '#FF00CC', '#CC00FF', '#00CCFF', '#FFCC00'];
  return colors[Math.floor(Math.random() * colors.length)];
}