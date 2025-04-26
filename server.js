const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO com CORS e transporte WebSocket
const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Configuração básica
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Tratamento de erros 404
app.use((req, res, next) => {
    res.status(404).send('Página não encontrada');
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    
    // Entra na sala padrão
    socket.join('defaultRoom');
    console.log('Jogador entrou na sala defaultRoom');
    
    // Recebe o nickname do jogador
    socket.on('setNickname', (nickname) => {
        console.log('Nickname recebido:', nickname);
        // Salva o nickname no socket
        socket.nickname = nickname.toUpperCase();
        
        // Envia mensagem para todos na sala com o nickname
        io.to('defaultRoom').emit('playerJoined', { 
            id: socket.id,
            nickname: nickname.toUpperCase()
        });
        
        // Envia a lista atual de jogadores para todos
        const players = Array.from(io.sockets.sockets.values())
            .filter(s => s.nickname) // Apenas jogadores com nickname
            .map(s => ({
                id: s.id,
                nickname: s.nickname
            }));
        
        io.to('defaultRoom').emit('currentPlayers', players);
    });
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        io.to('defaultRoom').emit('playerLeft', { id: socket.id });
    });
});

// Função para obter todos os jogadores na sala
function getPlayersInRoom(room) {
    const players = [];
    const roomSockets = io.sockets.adapter.rooms.get(room);
    
    if (roomSockets) {
        for (const socketId of roomSockets) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket && socket.nickname) {
                players.push({
                    id: socket.id,
                    nickname: socket.nickname
                });
            }
        }
    }
    
    return players;
}

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
