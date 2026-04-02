class Player {
    constructor(x, y, type, playerId, controls) {
        this.id = playerId;
        this.type = type;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.playerId = playerId;
        this.controls = controls;
        this.useController = false;
        
        // Sistema de vidas
        this.lives = CONFIG.LIVES.STARTING_LIVES;
        this.isDead = false;
        this.respawnTimer = 0;
        this.invincibleTimer = 0;
        this.deathAnimation = 0;
        this.respawnTime = 0;
        
        const charConfig = CONFIG.CHARACTERS[type.toUpperCase()];
        this.speed = charConfig.speed;
        this.ability = charConfig.ability;
        this.color = charConfig.color;
        this.name = charConfig.name;
        
        this.keys = {
            up: false, down: false, left: false, right: false, ability: false
        };
        
        this.specialCooldown = 0;
        this.rescueProgress = 0;
        this.isUsingAbility = false;
        this.invincible = false;
        
        this.initControls();
        this.initControllerSupport();
    }
    
    initControllerSupport() {
        this.useController = true;
        
        // Eventos de botão do controle
        window.addEventListener('snesbutton', (e) => {
            if (!this.useController) return;
            if (e.detail.player === `player${this.playerId}`) {
                if (e.detail.pressed) {
                    // Habilidade especial (A para J1, B para J2)
                    if ((this.playerId === '1' && e.detail.button === 'A') ||
                        (this.playerId === '2' && e.detail.button === 'B')) {
                        this.useAbility();
                    }
                    // START e SELECT já são tratados no controller.js
                }
            }
        });
    }
    
    // Método para atualizar movimento via polling (chamado a cada frame)
    updateControllerMovement(snesController) {
        if (!this.useController) return;
        if (!snesController) return;
        
        const movement = snesController.getPlayerMovement(this.playerId);
        
        // Converte movimento analógico para teclas
        this.keys.left = movement.x < -0.2;
        this.keys.right = movement.x > 0.2;
        this.keys.up = movement.y < -0.2;
        this.keys.down = movement.y > 0.2;
    }
    
    initControls() {
        const keyHandler = (e, value) => {
            if (Object.values(this.controls).includes(e.key)) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case this.controls.up: this.keys.up = value; break;
                case this.controls.down: this.keys.down = value; break;
                case this.controls.left: this.keys.left = value; break;
                case this.controls.right: this.keys.right = value; break;
                case this.controls.ability:
                    if (value) this.useAbility();
                    break;
            }
        };
        
        window.addEventListener('keydown', (e) => keyHandler(e, true));
        window.addEventListener('keyup', (e) => keyHandler(e, false));
    }
    
    update(game) {
        // Atualiza movimento do controle (polling)
        if (window.snesController) {
            this.updateControllerMovement(window.snesController);
        }
        
        // Se estiver morto, só processa respawn
        if (this.isDead) {
            this.deathAnimation++;
            if (this.respawnTime > 0 && Date.now() >= this.respawnTime) {
                this.respawn();
            }
            return;
        }
        
        // Atualiza invencibilidade
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            this.invincible = true;
        } else {
            this.invincible = false;
        }
        
        // Movimento
        let newX = this.x;
        let newY = this.y;
        
        if (this.keys.up) newY -= this.speed / CONFIG.FPS;
        if (this.keys.down) newY += this.speed / CONFIG.FPS;
        if (this.keys.left) newX -= this.speed / CONFIG.FPS;
        if (this.keys.right) newX += this.speed / CONFIG.FPS;
        
        if (this.canMoveTo(newX, newY, game)) {
            this.x = newX;
            this.y = newY;
        }
        
        this.x = clamp(this.x, 0.5, CONFIG.MAP_WIDTH - 0.5);
        this.y = clamp(this.y, 0.5, CONFIG.MAP_HEIGHT - 0.5);
        
        if (this.specialCooldown > 0) this.specialCooldown--;
        
        this.interactWithChickens(game);
    }
    
    die() {
        if (this.invincible) return;
        if (this.isDead) return;
        
        this.lives--;
        this.isDead = true;
        this.deathAnimation = 0;
        this.respawnTime = Date.now() + CONFIG.LIVES.RESPAWN_DELAY;
        
        Utils.showMessage(`💀 ${this.name} morreu! Vidas restantes: ${this.lives}`, 2000);
        
        if (this.lives <= 0) {
            Utils.showMessage(`😢 ${this.name} foi derrotado permanentemente!`, 3000);
            this.respawnTime = 0;
        }
    }
    
    respawn() {
        if (this.lives <= 0) return;
        
        this.isDead = false;
        this.x = this.startX;
        this.y = this.startY;
        this.invincibleTimer = CONFIG.LIVES.INVINCIBILITY_DURATION / (1000 / 60);
        this.invincible = true;
        this.deathAnimation = 0;
        this.respawnTime = 0;
        
        Utils.showMessage(`✨ ${this.name} reviveu! Invencível por 3 segundos!`, 2000);
    }
    
    canMoveTo(x, y, game) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        
        if (tileX < 0 || tileX >= CONFIG.MAP_WIDTH || tileY < 0 || tileY >= CONFIG.MAP_HEIGHT) {
            return false;
        }
        
        const tile = game.map[tileY][tileX];
        
        if (this.ability === 'breakObstacles' && (tile === 1 || tile === 2)) {
            game.map[tileY][tileX] = 0;
            return true;
        }
        
        if (this.ability === 'passThroughSmall' && (tile === 1 || tile === 2)) {
            return true;
        }
        
        const blockingTiles = [1, 3];
        return !blockingTiles.includes(tile);
    }
    
    useAbility() {
        if (this.specialCooldown > 0 || this.isDead) return;
        
        this.isUsingAbility = true;
        this.specialCooldown = 120;
        
        setTimeout(() => {
            this.isUsingAbility = false;
        }, 500);
        
        Utils.showMessage(`✨ ${this.name} usou habilidade especial!`, 1000);
    }
    
    interactWithChickens(game) {
        if (this.isDead) return;
        
        for (let chicken of game.cagedChickens) {
            if (!chicken.rescued && Utils.checkCollision(this, chicken)) {
                this.rescueProgress += 1;
                
                if (this.rescueProgress >= 100) {
                    chicken.rescued = true;
                    game.score += CONFIG.SCORES.RESCUE_CHICKEN;
                    this.rescueProgress = 0;
                    Utils.showMessage(`🐔 Galinha libertada! +${CONFIG.SCORES.RESCUE_CHICKEN} pontos`, 1500);
                }
                break;
            }
        }
    }
    
    draw(ctx, tileSize) {
        if (this.isDead) {
            if (this.deathAnimation < 30 && this.lives > 0) {
                ctx.globalAlpha = 0.5;
                const x = this.x * tileSize - tileSize/2;
                const y = this.y * tileSize - tileSize/2;
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `${tileSize}px monospace`;
                ctx.fillText("💀", x + tileSize/2 - 8, y + tileSize/2 + 8);
            } else if (this.lives <= 0) {
                ctx.globalAlpha = 0.3;
                const x = this.x * tileSize - tileSize/2;
                const y = this.y * tileSize - tileSize/2;
                ctx.fillStyle = '#666666';
                ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `${tileSize}px monospace`;
                ctx.fillText("👻", x + tileSize/2 - 8, y + tileSize/2 + 8);
            }
            ctx.globalAlpha = 1;
            return;
        }
        
        const x = this.x * tileSize - tileSize/2;
        const y = this.y * tileSize - tileSize/2;
        const isRPI = window.isRaspberryPi && window.isRaspberryPi();
        
        if (this.invincible && (Date.now() % 200 < 100)) {
            ctx.globalAlpha = 0.5;
        }
        
        if (isRPI) {
            ctx.fillStyle = this.color;
            ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(x + tileSize - 8, y + tileSize/2 - 3, 6, 6);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + tileSize - 12, y + tileSize/2 - 2, 3, 3);
        } else {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(x + tileSize/2, y + tileSize - 5, tileSize/3, tileSize/6, 0, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(x + tileSize/2, y + tileSize/2, tileSize/3, tileSize/2.5, 0, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.moveTo(x + tileSize/1.5, y + tileSize/2);
            ctx.lineTo(x + tileSize/1.2, y + tileSize/2);
            ctx.lineTo(x + tileSize/1.5, y + tileSize/1.8);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x + tileSize/1.8, y + tileSize/2.5, 3, 0, Math.PI*2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
        
        if (this.rescueProgress > 0) {
            const barWidth = tileSize - 10;
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(x + 5, y - 5, barWidth * (this.rescueProgress / 100), 3);
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.floor(tileSize / 3)}px monospace`;
        ctx.fillText(`❤️ ${this.lives}`, x + 2, y - 8);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${Math.floor(tileSize / 4)}px monospace`;
        ctx.fillText(`P${this.playerId}`, x + tileSize - 15, y - 5);
    }
}

window.Player = Player;