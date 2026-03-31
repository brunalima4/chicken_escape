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
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
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
        for (let i = 0; i < CONFIG.MAP_HEIGHT; i++) {
            this.map[i] = [];
            for (let j = 0; j < CONFIG.MAP_WIDTH; j++) {
                if (i === 0 || i === CONFIG.MAP_HEIGHT-1 || j === 0 || j === CONFIG.MAP_WIDTH-1) {
                    this.map[i][j] = 1;
                } else if (Math.random() < 0.08) {
                    this.map[i][j] = 2;
                } else {
                    this.map[i][j] = 0;
                }
            }
        }
        
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        if (levelConfig) {
            // Adiciona portões
            for (let i = 0; i < (levelConfig.gates || 3); i++) {
                let x, y; 
                do { 
                    x = randomInt(2, CONFIG.MAP_WIDTH-3); 
                    y = randomInt(2, CONFIG.MAP_HEIGHT-3); 
                } while (this.map[y][x] !== 0);
                this.map[y][x] = 3;
            }
            
            // Adiciona buracos
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
        this.players.push(new Player(2, 2, 'ninja', '1', { 
            up: 'w', down: 's', left: 'a', right: 'd', ability: 'e' 
        }));
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
        
        console.log(`Criando ${enemyCount} inimigos do tipo ${enemyType}`);
        
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            let attempts = 0;
            do {
                x = randomInt(3, CONFIG.MAP_WIDTH-4);
                y = randomInt(3, CONFIG.MAP_HEIGHT-4);
                attempts++;
                if (attempts > 100) break;
            } while (this.map[y][x] !== 0 || this.isPositionNearPlayer(x, y));
            
            const enemy = new Enemy(x, y, enemyType, this);
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
            } while (this.map[y][x] !== 0 || this.isPositionOccupied(x, y) || this.isPositionNearPlayer(x, y, 4));
            
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
        
        this.players.forEach(player => {
            if (player) player.update(this);
        });
        
        this.enemies.forEach(enemy => {
            if (enemy) enemy.update(this);
        });
        
        this.updatePowerUps();
        this.checkVictory();
        this.updateUI();
    }
    
    updatePowerUps() {
        for (let i = 0; i < this.powerUps.length; i++) {
            const powerUp = this.powerUps[i];
            if (powerUp.collected) continue;
            
            for (let player of this.players) {
                if (player && Utils.checkCollision(player, powerUp)) {
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
                player.invincible = true;
                setTimeout(() => { if(player) player.invincible = false; }, 3000);
                break;
            case 'slowEnemies':
                this.enemies.forEach(enemy => { if(enemy) enemy.baseSpeed /= 2; });
                setTimeout(() => { 
                    this.enemies.forEach(enemy => { if(enemy) enemy.baseSpeed *= 2; }); 
                }, 5000);
                break;
        }
    }
    
    checkVictory() {
        if (!this.cagedChickens.length) return;
        
        const allRescued = this.cagedChickens.every(chicken => chicken.rescued);
        
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
        Utils.showMessage("💀 GAME OVER! Pressione R para reiniciar 💀", 3000);
    }
    
    updateUI() {
        const rescuedCount = this.cagedChickens.filter(c => c.rescued).length;
        const totalChickens = this.cagedChickens.length;
        
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const rescuedEl = document.getElementById('rescued');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (levelEl) levelEl.textContent = this.currentLevel;
        if (rescuedEl) rescuedEl.textContent = rescuedCount;
    }
    
    updateLevelInfo() {
        const levelConfig = CONFIG.LEVELS[this.currentLevel];
        if (!levelConfig) return;
        
        const enemyType = levelConfig.enemyType || this.getEnemyTypeForLevel();
        const enemyConfig = CONFIG.ENEMIES[enemyType.toUpperCase()];
        
        const enemyDisplay = document.getElementById('enemyDisplay');
        const levelDescription = document.getElementById('levelDescription');
        
        if (enemyDisplay && enemyConfig) {
            enemyDisplay.innerHTML = `
                <div class="level-badge">
                    ${enemyConfig.icon || '🐕'} Fase ${this.currentLevel}: ${levelConfig.name}
                </div>
                <div class="enemy-list">
                    <div class="enemy-badge">${enemyConfig.icon} ${enemyConfig.name}</div>
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
        
        // Aplica escala se necessário
        if (this.scale && this.scale !== 1) {
            ctx.scale(this.scale, this.scale);
        }
        
        this.drawMap(ctx);
        this.drawPowerUps(ctx);
        this.drawCagedChickens(ctx);
        this.drawPortals(ctx);
        
        // Desenha inimigos
        this.enemies.forEach(enemy => {
            if (enemy) enemy.draw(ctx, CONFIG.TILE_SIZE);
        });
        
        // Desenha jogadores
        this.players.forEach(player => {
            if (player) player.draw(ctx, CONFIG.TILE_SIZE);
        });
        
        ctx.restore();
    }
    
    drawMap(ctx) {
        for (let i = 0; i < CONFIG.MAP_HEIGHT; i++) {
            for (let j = 0; j < CONFIG.MAP_WIDTH; j++) {
                const x = j * CONFIG.TILE_SIZE;
                const y = i * CONFIG.TILE_SIZE;
                
                switch(this.map[i][j]) {
                    case 1: // Cerca
                        ctx.fillStyle = CONFIG.COLORS.FENCE;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        ctx.fillStyle = '#5D3A1A';
                        for(let k = 0; k < 3; k++) {
                            ctx.fillRect(x+5, y+5+k*10, CONFIG.TILE_SIZE-10, 2);
                        }
                        break;
                    case 2: // Feno
                        ctx.fillStyle = CONFIG.COLORS.HAY;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        ctx.fillStyle = '#DEB887';
                        for(let k = 0; k < 3; k++) {
                            ctx.fillRect(x+5, y+5+k*10, CONFIG.TILE_SIZE-10, 3);
                        }
                        break;
                    case 3: // Portão
                        ctx.fillStyle = CONFIG.COLORS.GATE;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        ctx.fillStyle = '#CD853F';
                        ctx.fillRect(x+10, y+8, CONFIG.TILE_SIZE-20, CONFIG.TILE_SIZE-16);
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(x+CONFIG.TILE_SIZE/2-2, y+5, 4, CONFIG.TILE_SIZE-10);
                        break;
                    case 4: // Buraco
                        ctx.fillStyle = CONFIG.COLORS.HOLE;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        ctx.fillStyle = '#654321';
                        ctx.beginPath();
                        ctx.arc(x+CONFIG.TILE_SIZE/2, y+CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE/3, 0, Math.PI*2);
                        ctx.fill();
                        ctx.fillStyle = '#000000';
                        ctx.beginPath();
                        ctx.arc(x+CONFIG.TILE_SIZE/2, y+CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE/4, 0, Math.PI*2);
                        ctx.fill();
                        break;
                    default:
                        ctx.fillStyle = CONFIG.COLORS.GRASS;
                        ctx.fillRect(x, y, CONFIG.TILE_SIZE-1, CONFIG.TILE_SIZE-1);
                        ctx.fillStyle = '#7CB518';
                        for(let k = 0; k < 3; k++) {
                            ctx.fillRect(x+5+k*8, y+CONFIG.TILE_SIZE-5, 2, 3);
                        }
                }
            }
        }
    }
    
    drawCagedChickens(ctx) {
        this.cagedChickens.forEach(chicken => {
            if (!chicken.rescued) {
                const x = chicken.x * CONFIG.TILE_SIZE;
                const y = chicken.y * CONFIG.TILE_SIZE;
                
                // Gaiola
                ctx.fillStyle = '#AAAAAA';
                ctx.strokeStyle = '#666666';
                ctx.lineWidth = 2;
                ctx.strokeRect(x+4, y+4, CONFIG.TILE_SIZE-8, CONFIG.TILE_SIZE-8);
                
                // Galinha dentro
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.ellipse(x+CONFIG.TILE_SIZE/2, y+CONFIG.TILE_SIZE/2, 8, 10, 0, 0, Math.PI*2);
                ctx.fill();
                
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.moveTo(x+CONFIG.TILE_SIZE/2, y+10);
                ctx.lineTo(x+CONFIG.TILE_SIZE/2+4, y+16);
                ctx.lineTo(x+CONFIG.TILE_SIZE/2-4, y+16);
                ctx.fill();
            }
        });
    }
    
    drawPowerUps(ctx) {
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                const x = powerUp.x * CONFIG.TILE_SIZE;
                const y = powerUp.y * CONFIG.TILE_SIZE;
                
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.ellipse(x+CONFIG.TILE_SIZE/2, y+CONFIG.TILE_SIZE/2, 10, 12, 0, 0, Math.PI*2);
                ctx.fill();
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 16px Arial';
                ctx.fillText("⭐", x+12, y+22);
            }
        });
    }
    
    drawPortals(ctx) {
        this.portals.forEach(portal => {
            const x = portal.x * CONFIG.TILE_SIZE;
            const y = portal.y * CONFIG.TILE_SIZE;
            
            if (portal.type === 'exit') {
                const allRescued = this.cagedChickens.every(c => c.rescued);
                portal.active = allRescued;
                
                ctx.fillStyle = portal.active ? '#00FF00' : '#FF0000';
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x+5, y+5, CONFIG.TILE_SIZE-10, CONFIG.TILE_SIZE-10);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 20px Arial';
                ctx.fillText("🚪", x+12, y+24);
                ctx.globalAlpha = 1;
            }
        });
    }
    
    restart() {
        this.currentLevel = 1;
        this.score = 0;
        this.gameState = 'playing';
        this.init();
    }
}

window.Game = Game;
