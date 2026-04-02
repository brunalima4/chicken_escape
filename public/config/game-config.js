// Configurações Globais do Jogo
const CONFIG = {
    TILE_SIZE: 32,
    MAP_WIDTH: 25,
    MAP_HEIGHT: 15,
    FPS: 60,
    
    // Configurações de dificuldade por fase
    DIFFICULTY: {
        1: { enemySpeed: 1.2, enemyCount: 2 },
        2: { enemySpeed: 0.8, enemyCount: 2 },
        3: { enemySpeed: 1.5, enemyCount: 3 },
        4: { enemySpeed: 1.8, enemyCount: 2 },
        5: { enemySpeed: 2.0, enemyCount: 1 }
    },
    
    // Sistema de vidas
    LIVES: {
        STARTING_LIVES: 1,
        RESPAWN_DELAY: 2000,
        INVINCIBILITY_DURATION: 3000
    },
    
    CANVAS: {
        calculateSize: function() {
            const container = document.querySelector('.game-area');
            if (container) {
                const maxWidth = container.clientWidth - 40;
                const maxHeight = container.clientHeight - 40;
                
                if (window.isRaspberryPi && window.isRaspberryPi()) {
                    return {
                        width: 800,
                        height: 480,
                        scale: 1
                    };
                }
                
                const tileBasedWidth = this.MAP_WIDTH * this.TILE_SIZE;
                const tileBasedHeight = this.MAP_HEIGHT * this.TILE_SIZE;
                
                const scaleX = maxWidth / tileBasedWidth;
                const scaleY = maxHeight / tileBasedHeight;
                const scale = Math.min(scaleX, scaleY, 1);
                
                return {
                    width: tileBasedWidth * scale,
                    height: tileBasedHeight * scale,
                    scale: scale
                };
            }
            return { width: 800, height: 480, scale: 1 };
        }
    },
    
    COLORS: {
        BACKGROUND: '#2c3e50',
        FENCE: '#8B4513',
        HAY: '#F4A460',
        GATE: '#A0522D',
        HOLE: '#000000',
        GRASS: '#90EE90'
    },
    
    CHARACTERS: {
        NINJA: {
            name: 'Galinha Ninja',
            color: '#FF6B6B',
            speed: 5,
            ability: 'passThroughSmall',
            description: 'Rápida, passa por espaços pequenos',
            icon: '🐔',
            respawnPosition: { x: 2, y: 2 }
        },
        STRONG: {
            name: 'Galinha Forte',
            color: '#4ECDC4',
            speed: 3,
            ability: 'breakObstacles',
            description: 'Quebra obstáculos',
            icon: '💪',
            respawnPosition: { x: -1, y: -1 }
        }
    },
    
    ENEMIES: {
        REX: { 
            name: 'Rex', 
            color: '#8B4513', 
            speed: 1.2, 
            behavior: 'patrol', 
            difficulty: 'basic',
            icon: '🐕',
            description: 'Patrulha o mapa e late ao ver galinhas'
        },
        SOMBRA: { 
            name: 'Sombra', 
            color: '#2F4F4F', 
            speed: 2.5, 
            behavior: 'fly', 
            difficulty: 'medium',
            icon: '🦅',
            description: 'Voa por cima de tudo e ataca em mergulho'
        },
        BIGODES: { 
            name: 'Bigodes', 
            color: '#696969', 
            speed: 1.8, 
            behavior: 'invisible', 
            difficulty: 'medium',
            icon: '🐱',
            description: 'Fica invisível e ataca de surpresa'
        },
        SIBILO: { 
            name: 'Sibilo', 
            color: '#228B22', 
            speed: 2.0, 
            behavior: 'corner', 
            difficulty: 'high',
            icon: '🐍',
            description: 'Anda pelos cantos e bloqueia caminhos'
        }
    },
    
    LEVELS: {
        1: { 
            name: 'Rex, o Vigia', 
            enemies: 2, 
            chickens: 6, 
            gates: 2, 
            holes: 3, 
            powerUps: 2, 
            difficulty: 'basic',
            enemyType: 'rex',
            enemySpeedMultiplier: 1.0,
            description: '🐕 Rex patrulha a fazenda.'
        },
        2: { 
            name: 'Sombra, o Caçador (Mais Devagar)', 
            enemies: 2, 
            chickens: 8, 
            gates: 3, 
            holes: 4, 
            powerUps: 3, 
            difficulty: 'medium',
            enemyType: 'sombra',
            enemySpeedMultiplier: 0.6,
            description: '🦅 Sombra está mais lenta nesta fase!'
        },
        3: { 
            name: 'Bigodes, o Silencioso', 
            enemies: 3, 
            chickens: 10, 
            gates: 4, 
            holes: 5, 
            powerUps: 4, 
            difficulty: 'medium',
            enemyType: 'bigodes',
            enemySpeedMultiplier: 1.0,
            description: '🐱 Bigodes some e aparece!'
        },
        4: { 
            name: 'Sibilo, a Cobra', 
            enemies: 2, 
            chickens: 12, 
            gates: 4, 
            holes: 6, 
            powerUps: 4, 
            difficulty: 'high',
            enemyType: 'sibilo',
            enemySpeedMultiplier: 1.0,
            description: '🐍 Sibilo bloqueia os caminhos.'
        },
        5: { 
            name: 'Sr. Almeida - O Final', 
            enemies: 1, 
            chickens: 15, 
            gates: 5, 
            holes: 8, 
            powerUps: 5, 
            difficulty: 'boss',
            enemyType: 'rex',
            enemySpeedMultiplier: 1.2,
            description: '👨‍🌾 O dono da fazenda está furioso!'
        }
    },
    
    SCORES: {
        RESCUE_CHICKEN: 100,
        BONUS_FAST_RESCUE: 50,
        COMPLETE_LEVEL: 500,
        DEFEAT_ENEMY: 200
    }
};