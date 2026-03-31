class Player {
    constructor(x, y, type, playerId, controls) {
        this.id = playerId;
        this.type = type;
        this.x = x;
        this.y = y;
        this.playerId = playerId;
        this.controls = controls;
        
        // Carrega configurações do personagem
        const charConfig = CONFIG.CHARACTERS[type.toUpperCase()];
        this.speed = charConfig.speed;
        this.ability = charConfig.ability;
        this.color = charConfig.color;
        this.name = charConfig.name;
        
        // Estado do jogador
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            ability: false
        };
        
        this.specialCooldown = 0;
        this.rescueProgress = 0;
        this.isUsingAbility = false;
        this.invincible = false;
        
        this.initControls();
    }
    
    initControls() {
        const keyHandler = (e, value) => {
            // Previne scroll da página
            if (Object.values(this.controls).includes(e.key)) {
                e.preventDefault();
            }
            
            switch(e.key) {
                case this.controls.up:
                    this.keys.up = value;
                    break;
                case this.controls.down:
                    this.keys.down = value;
                    break;
                case this.controls.left:
                    this.keys.left = value;
                    break;
                case this.controls.right:
                    this.keys.right = value;
                    break;
                case this.controls.ability:
                    if (value) this.useAbility();
                    break;
            }
        };
        
        window.addEventListener('keydown', (e) => keyHandler(e, true));
        window.addEventListener('keyup', (e) => keyHandler(e, false));
    }
    
    update(game) {
        // Movimento
        let newX = this.x;
        let newY = this.y;
        
        if (this.keys.up) newY -= this.speed / CONFIG.FPS;
        if (this.keys.down) newY += this.speed / CONFIG.FPS;
        if (this.keys.left) newX -= this.speed / CONFIG.FPS;
        if (this.keys.right) newX += this.speed / CONFIG.FPS;
        
        // Aplica movimento se possível
        if (this.canMoveTo(newX, newY, game)) {
            this.x = newX;
            this.y = newY;
        }
        
        // Limita ao mapa
        this.x = clamp(this.x, 0.5, CONFIG.MAP_WIDTH - 0.5);
        this.y = clamp(this.y, 0.5, CONFIG.MAP_HEIGHT - 0.5);
        
        // Atualiza cooldowns
        if (this.specialCooldown > 0) {
            this.specialCooldown--;
        }
        
        // Verifica interação com galinhas presas
        this.interactWithChickens(game);
    }
    
    canMoveTo(x, y, game) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        
        if (tileX < 0 || tileX >= CONFIG.MAP_WIDTH || 
            tileY < 0 || tileY >= CONFIG.MAP_HEIGHT) {
            return false;
        }
        
        const tile = game.map[tileY][tileX];
        
        // Habilidades especiais
        if (this.ability === 'breakObstacles' && (tile === 1 || tile === 2)) {
            game.map[tileY][tileX] = 0;
            return true;
        }
        
        if (this.ability === 'passThroughSmall' && (tile === 1 || tile === 2)) {
            return true;
        }
        
        // Obstáculos bloqueantes
        const blockingTiles = [1, 3];
        return !blockingTiles.includes(tile);
    }
    
    useAbility() {
        if (this.specialCooldown > 0) return;
        
        this.isUsingAbility = true;
        this.specialCooldown = 120; // 2 segundos de cooldown
        
        // Efeitos especiais baseados na habilidade
        if (this.ability === 'fastRescue') {
            this.rescueProgress += 50;
        } else if (this.ability === 'fly') {
            this.y -= 1.5;
        }
        
        setTimeout(() => {
            this.isUsingAbility = false;
        }, 500);
        
        // Mostra efeito visual
        Utils.showMessage(`✨ ${this.name} usou habilidade especial!`, 1000);
    }
    
    interactWithChickens(game) {
        for (let chicken of game.cagedChickens) {
            if (!chicken.rescued && Utils.checkCollision(this, chicken)) {
                if (this.ability === 'fastRescue') {
                    this.rescueProgress += 2;
                } else {
                    this.rescueProgress += 1;
                }
                
                if (this.rescueProgress >= 100) {
                    chicken.rescued = true;
                    game.score += CONFIG.SCORES.RESCUE_CHICKEN;
                    if (this.ability === 'fastRescue') {
                        game.score += CONFIG.SCORES.BONUS_FAST_RESCUE;
                    }
                    this.rescueProgress = 0;
                    Utils.showMessage(`🐔 Galinha libertada! +${CONFIG.SCORES.RESCUE_CHICKEN} pontos`);
                }
            }
        }
    }
    
    draw(ctx, tileSize) {
        const x = this.x * tileSize - tileSize/2;
        const y = this.y * tileSize - tileSize/2;
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + tileSize/2, y + tileSize - 5, tileSize/3, tileSize/6, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Efeito de invencibilidade
        if (this.invincible) {
            ctx.globalAlpha = 0.7;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
        }
        
        // Corpo
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(x + tileSize/2, y + tileSize/2, tileSize/3, tileSize/2.5, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Bico
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x + tileSize/1.5, y + tileSize/2);
        ctx.lineTo(x + tileSize/1.2, y + tileSize/2);
        ctx.lineTo(x + tileSize/1.5, y + tileSize/1.8);
        ctx.fill();
        
        // Olho
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + tileSize/1.8, y + tileSize/2.5, 3, 0, Math.PI*2);
        ctx.fill();
        
        // Brilho no olho
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x + tileSize/1.7, y + tileSize/2.3, 1, 0, Math.PI*2);
        ctx.fill();
        
        // Crista
        ctx.fillStyle = '#FF0000';
        if (this.type === 'ninja') {
            ctx.fillRect(x + tileSize/3, y + tileSize/4, 5, 10);
            // Bandana ninja
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + tileSize/2.5, y + tileSize/2.8, 12, 3);
        } else if (this.type === 'strong') {
            ctx.fillRect(x + tileSize/3, y + tileSize/4, 8, 5);
            ctx.fillRect(x + tileSize/3, y + tileSize/4, 5, 8);
            // Sobrancelhas fortes
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + tileSize/2.2, y + tileSize/2.2, 8, 2);
        }
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        // Barra de progresso de resgate
        if (this.rescueProgress > 0) {
            const barWidth = tileSize - 10;
            const barHeight = 4;
            const progress = this.rescueProgress / 100;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x + 5, y - 5, barWidth, barHeight);
            
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(x + 5, y - 5, barWidth * progress, barHeight);
        }
    }
}

window.Player = Player;