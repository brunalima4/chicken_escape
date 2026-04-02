class Enemy {
    constructor(x, y, type, game, speedMultiplier = 1.0) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        
        const enemyConfig = CONFIG.ENEMIES[type.toUpperCase()];
        if (!enemyConfig) {
            console.error(`Inimigo não encontrado: ${type}`);
            return;
        }
        
        this.name = enemyConfig.name;
        this.color = enemyConfig.color;
        this.baseSpeed = enemyConfig.speed * speedMultiplier;
        this.behavior = enemyConfig.behavior;
        this.icon = enemyConfig.icon || '🐕';
        this.speedMultiplier = speedMultiplier;
        
        this.direction = { x: 0, y: 0 };
        this.invisible = false;
        this.invisibleTimer = 0;
        this.attackCooldown = 0;
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.lastX = x;
        this.lastY = y;
        
        this.initPatrol();
        
        console.log(`Inimigo criado: ${this.name} (velocidade: ${this.baseSpeed}) na posição (${x}, ${y})`);
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
        
        this.x = clamp(this.x, 0.8, CONFIG.MAP_WIDTH - 0.8);
        this.y = clamp(this.y, 0.8, CONFIG.MAP_HEIGHT - 0.8);
    }
    
    getTarget() {
        let closest = null;
        let minDistance = Infinity;
        
        for (let player of this.game.players) {
            if (!player || player.isDead) continue;
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
        
        if (this.behavior === 'fly') {
            return true;
        }
        
        if (this.behavior === 'corner' && (tile === 1 || tile === 3)) {
            return false;
        }
        
        return tile !== 1 && tile !== 3;
    }
    
    updateSpecialBehaviors() {
        switch(this.type) {
            case 'sombra':
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
                this.invisibleTimer++;
                if (this.invisibleTimer > 120) {
                    this.invisible = !this.invisible;
                    this.invisibleTimer = 0;
                }
                break;
                
            case 'rex':
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
        this.attackCooldown = 60;
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
            if (!player || player.isDead) continue;
            if (Utils.checkCollision(this, player, 0.7)) {
                if (!player.invincible) {
                    if (this.type === 'bigodes' && this.invisible) {
                        Utils.showMessage("😾 ATAQUE SURPRESA!", 500);
                    }
                    player.die();
                }
                return;
            }
        }
    }
    
    draw(ctx, tileSize) {
        if (this.invisible && this.type === 'bigodes') {
            ctx.globalAlpha = 0.4;
        }
        
        const x = this.x * tileSize - tileSize/2;
        const y = this.y * tileSize - tileSize/2;
        const isRPI = window.isLowEndDevice;
        
        if (!isRPI) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(x + tileSize/2, y + tileSize - 3, tileSize/3, tileSize/8, 0, 0, Math.PI*2);
            ctx.fill();
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
        
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(x + tileSize/3, y + tileSize/3, 4, 4);
        ctx.fillRect(x + tileSize*2/3 - 4, y + tileSize/3, 4, 4);
        
        // Mostra que é a fase 2 (mais devagar)
        if (this.speedMultiplier < 1) {
            ctx.fillStyle = '#00FF00';
            ctx.font = `bold ${Math.floor(tileSize / 4)}px monospace`;
            ctx.fillText("🐢", x + tileSize/2 - 4, y + tileSize - 5);
        }
        
        ctx.globalAlpha = 1;

        window.Enemy = Enemy;
console.log("enemy.js carregado com sucesso!");
    }
}

window.Enemy = Enemy;