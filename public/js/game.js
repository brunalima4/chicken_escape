class Game {
    constructor() {
        this.map = [];
        this.players = [];
        this.enemies = [];
        this.cagedChickens = [];
        this.powerUps = [];
        this.portals = [];
        this.currentLevel = 1;
        this.score = 0;
        this.gameState = 'menu';
        this.canvas = null;
        this.ctx = null;
        this.lastUpdateTime = 0;
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error("Canvas não encontrado!");
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.generateMap();
        this.initPlayers();
        this.initEnemies();
        this.initCagedChickens();
        this.initPowerUps();
        this.initPortals();
        this.resizeCanvas();
        this.updateUI();
        this.updateLevelInfo();
        
        console.log(`Jogo inicializado - Fase ${this.currentLevel}`);
        console.log(`Inimigos criados: ${this.enemies.length}`);
    }
    
    resizeCanvas() {
        const size = CONFIG.CANVAS.calculateSize();
        this.canvas.width = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE;
        this.canvas.height = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE;
        this.canvas.style.width = `${size.width}px`;
        this.canvas.style.height = `${size.height}px`;
        this.scale = size.scale;
    }
    
    generateMap() {
        const density = window.isLowEndDevice ? 0.04 : 0.08;
        
        for (let i = 0; i < CONFIG.MAP_HEIGHT; i++) {
            this.map[i] = [];
            for (let j = 0; j < CONFIG.MAP_WIDTH; j++) {
                if (i === 0 || i === CONFIG.MAP_HEIGHT-1 || j === 0 || j === CONFIG.MAP_WIDTH-1) {
                    this.map[i][j] = 1;
                } else if (Math.random() < density) {
                    this.map[i][j] = 2;
                } else {
                    this.map[i][j] = 0;
                }
            }
        }
        
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        if (levelConfig) {
            for (let i = 0; i < (levelConfig.gates || 3); i++) {
                let x, y; 
                do { 
                    x = randomInt(2, CONFIG.MAP_WIDTH-3); 
                    y = randomInt(2, CONFIG.MAP_HEIGHT-3); 
                } while (this.map[y][x] !== 0);
                this.map[y][x] = 3;
            }
            
            for (let i = 0; i < (levelConfig.holes || 5); i++) {
                let x, y; 
                do { 
                    x = randomInt(2, CONFIG.MAP_WIDTH-3); 
                    y = randomInt(2, CONFIG.MAP_HEIGHT-3); 
                } while (this.map[y][x] !== 0);
                this.map[y][x] = 4;
            }
        }
    }
    
    initPlayers() {
        this.players = [];
        // Jogador 1 - Galinha Ninja
        this.players.push(new Player(2, 2, 'ninja', '1', { 
            up: 'w', down: 's', left: 'a', right: 'd', ability: 'e' 
        }));
        // Jogador 2 - Galinha Forte
        this.players.push(new Player(CONFIG.MAP_WIDTH-3, CONFIG.MAP_HEIGHT-3, 'strong', '2', { 
            up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', ability: ' ' 
        }));
    }
    
    initEnemies() {
        this.enemies = [];
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        
        if (!levelConfig) {
            console.error(`Configuração da fase ${this.currentLevel} não encontrada`);
            return;
        }
        
        const enemyCount = levelConfig.enemies;
        const enemyType = levelConfig.enemyType || this.getEnemyTypeForLevel();
        const speedMultiplier = levelConfig.enemySpeedMultiplier || 1.0;
        
        console.log(`Criando ${enemyCount} inimigos do tipo ${enemyType} com velocidade ${speedMultiplier}x`);
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            let attempts = 0;
            do {
                x = randomInt(3, CONFIG.MAP_WIDTH-4);
                y = randomInt(3, CONFIG.MAP_HEIGHT-4);
                attempts++;
                if (attempts > 100) break;
            } while (this.map[y][x] !== 0 || this.isPositionNearPlayer(x, y));
            
            const enemy = new Enemy(x, y, enemyType, this, speedMultiplier);
            this.enemies.push(enemy);
        }
        
        console.log(`Inimigos criados: ${this.enemies.length}`);
    }
    
    getEnemyTypeForLevel() {
        const types = ['rex', 'sombra', 'bigodes', 'sibilo'];
        return types[Math.min(this.currentLevel - 1, types.length - 1)];
    }
    
    isPositionNearPlayer(x, y, distance = 5) {
        for (let player of this.players) {
            if (!player) continue;
            if (player.isDead && player.lives <= 0) continue;
            const dx = Math.abs(player.x - x);
            const dy = Math.abs(player.y - y);
            if (dx < distance && dy < distance) return true;
        }
        return false;
    }
    
    initCagedChickens() {
        this.cagedChickens = [];
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        const chickenCount = levelConfig?.chickens || 8;
        
        for (let i = 0; i < chickenCount; i++) {
            let x, y;
            let attempts = 0;
            do {
                x = randomInt(2, CONFIG.MAP_WIDTH-3);
                y = randomInt(2, CONFIG.MAP_HEIGHT-3);
                attempts++;
                if (attempts > 200) break;
            } while (this.map[y][x] !== 0 || this.isPositionOccupied(x, y));
            
            this.cagedChickens.push({ x, y, rescued: false });
        }
        
        const totalElement = document.getElementById('total');
        if (totalElement) totalElement.textContent = chickenCount;
    }
    
    initPowerUps() {
        this.powerUps = [];
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        const powerUpCount = levelConfig?.powerUps || 3;
        const types = ['speed', 'invincibility', 'slowEnemies'];
        
        for (let i = 0; i < powerUpCount; i++) {
            let x, y;
            let attempts = 0;
            do {
                x = randomInt(2, CONFIG.MAP_WIDTH-3);
                y = randomInt(2, CONFIG.MAP_HEIGHT-3);
                attempts++;
                if (attempts > 100) break;
            } while (this.map[y][x] !== 0);
            
            this.powerUps.push({ 
                x, y, 
                type: types[Math.floor(Math.random() * types.length)], 
                collected: false 
            });
        }
    }
    
    initPortals() {
        this.portals = [{ 
            x: CONFIG.MAP_WIDTH-3, 
            y: CONFIG.MAP_HEIGHT-3, 
            type: 'exit', 
            active: false 
        }];
    }
    
    isPositionOccupied(x, y) {
        return this.cagedChickens.some(chicken => chicken.x === x && chicken.y === y);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        if (!this.players || this.players.length === 0) return;
        
        if (window.isLowEndDevice) {
            const now = performance.now();
            if (this.lastUpdateTime && (now - this.lastUpdateTime) < (1000 / 30)) {
                return;
            }
            this.lastUpdateTime = now;
        }
        
        // Atualiza TODOS os jogadores
        let activePlayers = 0;
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player) {
                player.update(this);
                if (!player.isDead) activePlayers++;
            }
        }
        
        // Só dá Game Over se TODOS os jogadores morrerem permanentemente
        let allPermanentlyDead = true;
        for (let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            if (p && !(p.isDead && p.lives <= 0)) {
                allPermanentlyDead = false;
                break;
            }
        }
        
        if (allPermanentlyDead && this.players.length > 0) {
            this.gameOver();
            return;
        }
        
        // Atualiza inimigos
        if (!window.isLowEndDevice || Math.random() < 0.8) {
            for (let i = 0; i < this.enemies.length; i++) {
                if (this.enemies[i]) this.enemies[i].update(this);
            }
        } else {
            const index = Math.floor(Math.random() * this.enemies.length);
            if (this.enemies[index]) this.enemies[index].update(this);
        }
        
        this.updatePowerUps();
        this.checkVictory();
        this.updateUI();
    }
    
    updatePowerUps() {
        for (let i = 0; i < this.powerUps.length; i++) {
            const powerUp = this.powerUps[i];
            if (powerUp.collected) continue;
            
            for (let player of this.players) {
                if (player && !player.isDead && Utils.checkCollision(player, powerUp)) {
                    powerUp.collected = true;
                    this.applyPowerUp(powerUp.type, player);
                    Utils.showMessage(`✨ Power-up: ${powerUp.type}!`, 1000);
                }
            }
        }
    }
    
    applyPowerUp(type, player) {
        switch(type) {
            case 'speed':
                player.speed *= 1.5;
                setTimeout(() => { if(player) player.speed /= 1.5; }, 5000);
                break;
            case 'invincibility':
                player.invincibleTimer = 3000 / (1000 / 60);
                break;
            case 'slowEnemies':
                for (let i = 0; i < this.enemies.length; i++) {
                    if (this.enemies[i]) this.enemies[i].baseSpeed /= 2;
                }
                setTimeout(() => { 
                    for (let i = 0; i < this.enemies.length; i++) {
                        if (this.enemies[i]) this.enemies[i].baseSpeed *= 2;
                    }
                }, 5000);
                break;
        }
    }
    
    checkVictory() {
        if (!this.cagedChickens.length) return;
        
        let allRescued = true;
        for (let i = 0; i < this.cagedChickens.length; i++) {
            if (!this.cagedChickens[i].rescued) {
                allRescued = false;
                break;
            }
        }
        
        if (allRescued) {
            this.score += CONFIG.SCORES.COMPLETE_LEVEL;
            if (this.currentLevel >= 5) {
                this.victory();
            } else {
                this.nextLevel();
            }
        }
    }
    
    nextLevel() {
        Utils.showMessage(`🎉 Fase ${this.currentLevel} completa! +${CONFIG.SCORES.COMPLETE_LEVEL} pontos! 🎉`, 2000);
        this.currentLevel++;
        this.init();
    }
    
    victory() {
        this.gameState = 'victory';
        Utils.showMessage("🏆 PARABÉNS! VOCÊ LIBERTOU TODAS AS GALINHAS! 🏆", 5000);
        Utils.saveProgress(this.currentLevel, this.score);
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        Utils.showMessage("💀 GAME OVER! Todas as galinhas foram derrotadas! 💀", 3000);
    }
    
    updateUI() {
        let rescuedCount = 0;
        for (let i = 0; i < this.cagedChickens.length; i++) {
            if (this.cagedChickens[i].rescued) rescuedCount++;
        }
        const totalChickens = this.cagedChickens.length;
        
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const rescuedEl = document.getElementById('rescued');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (levelEl) levelEl.textContent = this.currentLevel;
        if (rescuedEl) rescuedEl.textContent = rescuedCount;
        
        // Atualiza vidas dos jogadores na UI
        const lives1El = document.getElementById('lives1');
        const lives2El = document.getElementById('lives2');
        const status1El = document.getElementById('status1');
        const status2El = document.getElementById('status2');
        
        if (lives1El && this.players[0]) {
            if (this.players[0].isDead && this.players[0].lives <= 0) {
                lives1El.textContent = '💀';
                if (status1El) status1El.textContent = 'DERROTADO';
            } else {
                let hearts = '';
                for (let i = 0; i < this.players[0].lives; i++) hearts += '❤️';
                lives1El.textContent = hearts || '❤️';
                if (status1El) status1El.textContent = this.players[0].isDead ? 'REVIVENDO...' : 'VIVO';
            }
        }
        
        if (lives2El && this.players[1]) {
            if (this.players[1].isDead && this.players[1].lives <= 0) {
                lives2El.textContent = '💀';
                if (status2El) status2El.textContent = 'DERROTADO';
            } else {
                let hearts = '';
                for (let i = 0; i < this.players[1].lives; i++) hearts += '❤️';
                lives2El.textContent = hearts || '❤️';
                if (status2El) status2El.textContent = this.players[1].isDead ? 'REVIVENDO...' : 'VIVO';
            }
        }
    }
    
    updateLevelInfo() {
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        if (!levelConfig) return;
        
        const enemyType = levelConfig.enemyType || this.getEnemyTypeForLevel();
        const enemyConfig = CONFIG.ENEMIES[enemyType.toUpperCase()];
        
        const enemyDisplay = document.getElementById('enemyDisplay');
        const levelDescription = document.getElementById('levelDescription');
        
        if (enemyDisplay && enemyConfig) {
            let slowBadge = '';
            if (this.currentLevel === 2) {
                slowBadge = '<div class="enemy-badge" style="background:#00FF00; color:#000;">🐢 Velocidade REDUZIDA nesta fase!</div>';
            }
            enemyDisplay.innerHTML = `
                <div class="level-badge">
                    ${enemyConfig.icon || '🐕'} Fase ${this.currentLevel}: ${levelConfig.name}
                </div>
                <div class="enemy-list">
                    <div class="enemy-badge">${enemyConfig.icon} ${enemyConfig.name}</div>
                    ${slowBadge}
                </div>
            `;
        }
        
        if (levelDescription && levelConfig) {
            levelDescription.textContent = levelConfig.description;
        }
    }
    
    draw(ctx) {
        if (!ctx) return;
        
        ctx.save();
        
        if (this.scale && this.scale !== 1) {
            ctx.scale(this.scale, this.scale);
        }
        
        this.drawMap(ctx);
        this.drawPowerUps(ctx);
        this.drawCagedChickens(ctx);
        this.drawPortals(ctx);
        
        for (let i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i]) this.enemies[i].draw(ctx, CONFIG.TILE_SIZE);
        }
        
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i]) this.players[i].draw(ctx, CONFIG.TILE_SIZE);
        }
        
        ctx.restore();
    }
    
    drawMap(ctx) {
        const isRPI = window.isLowEndDevice;
        
        for (let i = 0; i < CONFIG.MAP_HEIGHT; i++) {
            for (let j = 0; j < CONFIG.MAP_WIDTH; j++) {
                const x = j * CONFIG.TILE_SIZE;
                const y = i * CONFIG.TILE_SIZE;
                
                switch(this.map[i][j]) {
                    case 1:
                        ctx.fillStyle = CONFIG.COLORS.FENCE;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        if (!isRPI) {
                            ctx.fillStyle = '#5D3A1A';
                            for(let k = 0; k < 3; k++) {
                                ctx.fillRect(x+5, y+5+k*10, CONFIG.TILE_SIZE-10, 2);
                            }
                        }
                        break;
                    case 2:
                        ctx.fillStyle = CONFIG.COLORS.HAY;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        break;
                    case 3:
                        ctx.fillStyle = CONFIG.COLORS.GATE;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        break;
                    case 4:
                        ctx.fillStyle = CONFIG.COLORS.HOLE;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        break;
                    default:
                        ctx.fillStyle = CONFIG.COLORS.GRASS;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                }
            }
        }
    }
    
    drawCagedChickens(ctx) {
        for (let i = 0; i < this.cagedChickens.length; i++) {
            const chicken = this.cagedChickens[i];
            if (!chicken.rescued) {
                const x = chicken.x * CONFIG.TILE_SIZE;
                const y = chicken.y * CONFIG.TILE_SIZE;
                
                ctx.fillStyle = '#AAAAAA';
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 2;
                ctx.strokeRect(x+4, y+4, CONFIG.TILE_SIZE-8, CONFIG.TILE_SIZE-8);
                
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(x+CONFIG.TILE_SIZE/2-6, y+CONFIG.TILE_SIZE/2-6, 12, 12);
            }
        }
    }
    
    drawPowerUps(ctx) {
        for (let i = 0; i < this.powerUps.length; i++) {
            const powerUp = this.powerUps[i];
            if (!powerUp.collected) {
                const x = powerUp.x * CONFIG.TILE_SIZE;
                const y = powerUp.y * CONFIG.TILE_SIZE;
                
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(x+8, y+8, CONFIG.TILE_SIZE-16, CONFIG.TILE_SIZE-16);
            }
        }
    }
    
    drawPortals(ctx) {
        for (let i = 0; i < this.portals.length; i++) {
            const portal = this.portals[i];
            const x = portal.x * CONFIG.TILE_SIZE;
            const y = portal.y * CONFIG.TILE_SIZE;
            
            if (portal.type === 'exit') {
                let allRescued = true;
                for (let j = 0; j < this.cagedChickens.length; j++) {
                    if (!this.cagedChickens[j].rescued) {
                        allRescued = false;
                        break;
                    }
                }
                portal.active = allRescued;
                
                ctx.fillStyle = portal.active ? '#00FF00' : '#FF0000';
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x+5, y+5, CONFIG.TILE_SIZE-10, CONFIG.TILE_SIZE-10);
                ctx.globalAlpha = 1;
            }
        }
    }
    
    restart() {
        this.currentLevel = 1;
        this.score = 0;
        this.gameState = 'playing';
        this.init();
    }
}

window.Game = Game;
console.log("game.js carregado com sucesso!");