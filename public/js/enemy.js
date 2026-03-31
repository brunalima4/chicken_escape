
class Enemy {
    constructor(x, y, type, game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        
        // Carrega configurações do inimigo
        const enemyConfig = CONFIG.ENEMIES[type.toUpperCase()];
        if (!enemyConfig) {
            console.error(`Inimigo não encontrado: ${type}`);
            return;
        }
        
        this.name = enemyConfig.name;
        this.color = enemyConfig.color;
        this.baseSpeed = enemyConfig.speed;
        this.behavior = enemyConfig.behavior;
        this.icon = enemyConfig.icon || '🐕';
        
        // Estado do inimigo
        this.direction = { x: 0, y: 0 };
        this.invisible = false;
        this.invisibleTimer = 0;
        this.attackCooldown = 0;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.lastX = x;
        this.lastY = y;
        
        this.initPatrol();
        
        console.log(`Inimigo criado: ${this.name} na posição (${x}, ${y})`);
    }
    
    initPatrol() {
        if (this.behavior === 'patrol') {
            for (let i = 0; i < 4; i++) {
                this.patrolPoints.push({ 
                    x: randomRange(3, CONFIG.MAP_WIDTH - 3), 
                    y: randomRange(3, CONFIG.MAP_HEIGHT - 3) 
                });
            }
        } else if (this.behavior === 'corner') {
            this.patrolPoints = [
                { x: 3, y: 3 },
                { x: CONFIG.MAP_WIDTH - 3, y: 3 },
                { x: CONFIG.MAP_WIDTH - 3, y: CONFIG.MAP_HEIGHT - 3 },
                { x: 3, y: CONFIG.MAP_HEIGHT - 3 }
            ];
        }
    }
    
    update() {
        if (!this.game || !this.game.players || this.game.players.length === 0) return;
        
        // Salva posição anterior
        this.lastX = this.x;
        this.lastY = this.y;
        
        const target = this.getTarget();
        
        if (target && this.canSeeTarget(target)) {
            this.moveTowards(target);
        } else {
            this.patrol();
        }
        
        this.updateSpecialBehaviors();
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        this.checkAttack();
        
        // Limita ao mapa
        this.x = clamp(this.x, 0.8, CONFIG.MAP_WIDTH - 0.8);
        this.y = clamp(this.y, 0.8, CONFIG.MAP_HEIGHT - 0.8);
    }
    
    getTarget() {
        let closest = null;
        let minDistance = Infinity;
        
        for (let player of this.game.players) {
            if (!player) continue;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closest = player;
            }
        }
        
        return closest;
    }
    
    canSeeTarget(target) {
        if (!target) return false;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        // Distância de visão
        const visionRange = 10;
        return distance < visionRange;
    }
    
    moveTowards(target) {
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > 0.1) {
            let speed = this.baseSpeed;
            
            // Aumenta velocidade quando próximo (para Sombra)
            if (this.behavior === 'fly' && distance < 5) {
                speed = this.baseSpeed * 1.5;
            }
            
            const moveX = (dx / distance) * speed / CONFIG.FPS;
            const moveY = (dy / distance) * speed / CONFIG.FPS;
            
            let newX = this.x + moveX;
            let newY = this.y + moveY;
            
            if (this.canMoveTo(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        }
    }
    
    patrol() {
        if (this.patrolPoints.length === 0) {
            // Patrulha aleatória se não houver pontos
            if (Math.random() < 0.02) {
                this.direction.x = (Math.random() - 0.5) * 2;
                this.direction.y = (Math.random() - 0.5) * 2;
            }
            
            let newX = this.x + this.direction.x * this.baseSpeed / CONFIG.FPS;
            let newY = this.y + this.direction.y * this.baseSpeed / CONFIG.FPS;
            
            if (this.canMoveTo(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
            return;
        }
        
        const target = this.patrolPoints[this.currentPatrolIndex];
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < 0.8) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            const moveX = (dx / distance) * this.baseSpeed / CONFIG.FPS;
            const moveY = (dy / distance) * this.baseSpeed / CONFIG.FPS;
            
            let newX = this.x + moveX;
            let newY = this.y + moveY;
            
            if (this.canMoveTo(newX, newY)) {
                this.x = newX;
                this.y = newY;
            }
        }
    }
    
    canMoveTo(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        
        if (tileX < 1 || tileX >= CONFIG.MAP_WIDTH - 1 || 
            tileY < 1 || tileY >= CONFIG.MAP_HEIGHT - 1) {
            return false;
        }
        
        const tile = this.game.map[tileY][tileX];
        
        // Inimigos voadores podem passar por cima de obstáculos
        if (this.behavior === 'fly') {
            return true;
        }
        
        // Bloqueia caminhos (Sibilo)
        if (this.behavior === 'corner' && (tile === 1 || tile === 3)) {
            return false;
        }
        
        // Não pode passar por cercas e portões fechados
        return tile !== 1 && tile !== 3;
    }
    
    updateSpecialBehaviors() {
        switch(this.type) {
            case 'sombra':
                // Sombra ataca em mergulho
                if (this.attackCooldown === 0 && this.game.players[0]) {
                    const player = this.game.players[0];
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < 4) {
                        this.diveAttack(player);
                    }
                }
                break;
                
            case 'bigodes':
                // Bigodes fica invisível
                this.invisibleTimer++;
                if (this.invisibleTimer > 120) {
                    this.invisible = !this.invisible;
                    this.invisibleTimer = 0;
                }
                break;
                
            case 'rex':
                // Rex late quando vê jogador
                if (this.game.players[0] && Math.random() < 0.01) {
                    const player = this.game.players[0];
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < 6) {
                        Utils.showMessage("🐕 REX: WOOF WOOF!", 500);
                    }
                }
                break;
        }
    }
    
    diveAttack(player) {
        this.attackCooldown = 60; // 1 segundo
        // Move rapidamente em direção ao jogador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * 1.5;
            this.y += (dy / distance) * 1.5;
        }
        
        Utils.showMessage("🦅 ATAQUE EM MERGULHO!", 500);
    }
    
    checkAttack() {
        for (let player of this.game.players) {
            if (!player) continue;
            if (Utils.checkCollision(this, player, 0.7)) {
                if (!player.invincible) {
                    if (this.type === 'bigodes' && this.invisible) {
                        Utils.showMessage("😾 ATAQUE SURPRESA!", 500);
                    }
                    this.game.gameOver();
                }
                return;
            }
        }
    }
    
    draw(ctx, tileSize) {
        // Aplica transparência se invisível
        if (this.invisible && this.type === 'bigodes') {
            ctx.globalAlpha = 0.4;
        } else {
            ctx.globalAlpha = 1;
        }
        
        const x = this.x * tileSize - tileSize/2;
        const y = this.y * tileSize - tileSize/2;
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + tileSize/2, y + tileSize - 3, tileSize/3, tileSize/8, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Corpo principal
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(x + tileSize/2, y + tileSize/2, tileSize/3, tileSize/2.5, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Olhos (vermelhos)
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(x + tileSize/2.5, y + tileSize/2.5, 3, 0, Math.PI*2);
        ctx.arc(x + tileSize/1.5, y + tileSize/2.5, 3, 0, Math.PI*2);
        ctx.fill();
        
        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + tileSize/2.5, y + tileSize/2.5, 1.5, 0, Math.PI*2);
        ctx.arc(x + tileSize/1.5, y + tileSize/2.5, 1.5, 0, Math.PI*2);
        ctx.fill();
        
        // Características especiais por tipo
        switch(this.type) {
            case 'rex':
                // Cachorro - orelhas e coleira
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.moveTo(x + tileSize/3, y + tileSize/4);
                ctx.lineTo(x + tileSize/3 - 5, y + tileSize/4 - 8);
                ctx.lineTo(x + tileSize/3 + 5, y + tileSize/4 - 5);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x + tileSize/1.5, y + tileSize/4);
                ctx.lineTo(x + tileSize/1.5 + 5, y + tileSize/4 - 8);
                ctx.lineTo(x + tileSize/1.5 - 5, y + tileSize/4 - 5);
                ctx.fill();
                // Coleira
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(x + tileSize/2.5, y + tileSize/1.5, tileSize/3, 4);
                // Focinho
                ctx.fillStyle = '#5D3A1A';
                ctx.beginPath();
                ctx.ellipse(x + tileSize/2, y + tileSize/1.6, 4, 3, 0, 0, Math.PI*2);
                ctx.fill();
                break;
                
            case 'sombra':
                // Águia - asas
                ctx.fillStyle = '#4A4A4A';
                ctx.beginPath();
                ctx.moveTo(x + tileSize/4, y + tileSize/2);
                ctx.lineTo(x, y + tileSize/3);
                ctx.lineTo(x + tileSize/4, y + tileSize/3);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x + tileSize*0.75, y + tileSize/2);
                ctx.lineTo(x + tileSize, y + tileSize/3);
                ctx.lineTo(x + tileSize*0.75, y + tileSize/3);
                ctx.fill();
                // Bico
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.moveTo(x + tileSize/2, y + tileSize/1.8);
                ctx.lineTo(x + tileSize/2 + 6, y + tileSize/1.8);
                ctx.lineTo(x + tileSize/2, y + tileSize/1.5);
                ctx.fill();
                break;
                
            case 'bigodes':
                // Gato - bigodes
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.moveTo(x + tileSize/2.2, y + tileSize/1.8);
                ctx.lineTo(x + tileSize/2.2 - 8, y + tileSize/1.8);
                ctx.lineTo(x + tileSize/2.2, y + tileSize/1.7);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x + tileSize/1.8, y + tileSize/1.8);
                ctx.lineTo(x + tileSize/1.8 + 8, y + tileSize/1.8);
                ctx.lineTo(x + tileSize/1.8, y + tileSize/1.7);
                ctx.fill();
                // Orelhas
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(x + tileSize/3, y + tileSize/4);
                ctx.lineTo(x + tileSize/3 - 4, y + tileSize/4 - 6);
                ctx.lineTo(x + tileSize/3 + 4, y + tileSize/4);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x + tileSize/1.5, y + tileSize/4);
                ctx.lineTo(x + tileSize/1.5 + 4, y + tileSize/4 - 6);
                ctx.lineTo(x + tileSize/1.5 - 4, y + tileSize/4);
                ctx.fill();
                break;
                
            case 'sibilo':
                // Cobra - língua e padrão
                ctx.fillStyle = '#FF69B4';
                ctx.beginPath();
                ctx.moveTo(x + tileSize/2, y + tileSize/1.5);
                ctx.lineTo(x + tileSize/2.5, y + tileSize/1.2);
                ctx.lineTo(x + tileSize/1.5, y + tileSize/1.2);
                ctx.fill();
                // Escamas
                ctx.fillStyle = '#2E8B57';
                for(let i = 0; i < 3; i++) {
                    ctx.fillRect(x + tileSize/3 + i*8, y + tileSize/1.3, 4, 2);
                }
                break;
        }
        
        // Nome do inimigo (apenas para Rex)
        if (this.type === 'rex') {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.floor(tileSize / 3)}px Arial`;
            ctx.shadowBlur = 2;
            ctx.fillText(this.name, x + tileSize/2 - 12, y - 5);
            ctx.shadowBlur = 0;
        }
        
        ctx.globalAlpha = 1;
    }
}

window.Enemy = Enemy;
