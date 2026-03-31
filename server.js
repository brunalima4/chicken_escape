const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { updateEnemies } = require('./engine/enemyAI');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Define a pasta 'public' para arquivos estáticos (HTML e Imagens)
app.use(express.static('public'));

let players = {};
let gameState = {
    map: [], 
    enemies: [
        { id: 1, type: 'REX', x: 300, y: 300 }, 
        { id: 2, type: 'SIBILO', x: 100, y: 400 } 
    ]
};

io.on('connection', (socket) => {
    if (Object.keys(players).length >= 2) return socket.disconnect();
    players[socket.id] = { x: 50, y: 50, type: 'NINJA' };

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x += data.x;
            players[socket.id].y += data.y;
        }
    });

    socket.on('disconnect', () => delete players[socket.id]);
});

setInterval(() => {
    gameState.enemies = updateEnemies(gameState.enemies, players, gameState.map);
    io.emit('state', { players, map: gameState.map, enemies: gameState.enemies });
}, 1000 / 60);

server.listen(3000, () => console.log('Galinheiro online na porta 3000'));