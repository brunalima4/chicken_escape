
let game;
let canvas;
let ctx;
let animationId;

document.addEventListener('DOMContentLoaded', () => {
    init();
    setupWindowEvents();
});

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    game = new Game();
    
    setupKeyboardControls();
    setupButtonControls();
    startGameLoop();
    showMainMenu();
    
    // Ajusta o canvas quando a janela for redimensionada
    window.addEventListener('resize', () => {
        if (game) game.resizeCanvas();
    });
}

function setupWindowEvents() {
    // Detectar quando entrar/sair de tela cheia
    document.addEventListener('fullscreenchange', () => {
        if (game) game.resizeCanvas();
    });
    document.addEventListener('webkitfullscreenchange', () => {
        if (game) game.resizeCanvas();
    });
    document.addEventListener('mozfullscreenchange', () => {
        if (game) game.resizeCanvas();
    });
}

function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'Enter':
                if (game.gameState === 'menu') startGame();
                break;
            case 'r':
            case 'R':
                if (game.gameState === 'gameOver') restartGame();
                break;
            case 'Escape':
                if (game.gameState === 'playing') pauseGame();
                else if (game.gameState === 'paused') resumeGame();
                break;
        }
    });
}

function setupButtonControls() {
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            restartGame();
        });
    }
    
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
}

function toggleFullscreen() {
    const container = document.querySelector('.game-container');
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.log(`Erro ao entrar em tela cheia: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function startGameLoop() {
    function loop() {
        if (game.gameState === 'playing') {
            game.update();
            game.draw(ctx);
        } else if (game.gameState === 'paused') {
            game.draw(ctx);
            drawPaused();
        } else if (game.gameState === 'menu') {
            drawMenu();
        } else if (game.gameState === 'gameOver') {
            drawGameOver();
        } else if (game.gameState === 'victory') {
            drawVictory();
        }
        
        animationId = requestAnimationFrame(loop);
    }
    
    loop();
}

function startGame() {
    game.gameState = 'playing';
    game.restart();
    Utils.showMessage("🐔 Vamos fugir! Liberte todas as galinhas! 🐔", 3000);
}

function restartGame() {
    game.restart();
    game.gameState = 'playing';
}

function pauseGame() {
    game.gameState = 'paused';
    Utils.showMessage("⏸ Jogo Pausado - Pressione ESC para continuar", 2000);
}

function resumeGame() {
    game.gameState = 'playing';
    Utils.showMessage("▶ Jogo Retomado!", 1000);
}

function showMainMenu() {
    game.gameState = 'menu';
}

function drawMenu() {
    if (!ctx) return;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(canvasWidth / 20)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText("🐔 CHICKEN ESCAPE", canvasWidth/2, canvasHeight/2 - 80);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(canvasWidth / 30)}px "Courier New", monospace`;
    ctx.fillText("Fuga do Galinheiro", canvasWidth/2, canvasHeight/2 - 30);
    
    ctx.font = `${Math.floor(canvasWidth / 40)}px "Courier New", monospace`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText("Pressione ENTER para começar", canvasWidth/2, canvasHeight/2 + 40);
    ctx.fillText("Jogador 1: WASD | Jogador 2: SETAS", canvasWidth/2, canvasHeight/2 + 90);
    ctx.fillText("Habilidade Especial: E (J1) | Espaço (J2)", canvasWidth/2, canvasHeight/2 + 120);
    
    ctx.font = `${Math.floor(canvasWidth / 50)}px "Courier New", monospace`;
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText("🐔 Galinha Ninja - Rápida e ágil", canvasWidth/2 - 200, canvasHeight/2 + 180);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillText("💪 Galinha Forte - Quebra obstáculos", canvasWidth/2 + 50, canvasHeight/2 + 180);
    
    ctx.font = `${Math.floor(canvasWidth / 60)}px monospace`;
    ctx.fillStyle = '#666666';
    ctx.fillText("Clique no botão TELA CHEIA para melhor experiência", canvasWidth/2, canvasHeight - 30);
    
    ctx.textAlign = 'left';
}

function drawPaused() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(canvas.width / 20)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText("⏸ PAUSADO", canvas.width/2, canvas.height/2);
    ctx.font = `${Math.floor(canvas.width / 30)}px monospace`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("Pressione ESC para continuar", canvas.width/2, canvas.height/2 + 50);
    ctx.textAlign = 'left';
}

function drawGameOver() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF4444';
    ctx.font = `bold ${Math.floor(canvas.width / 20)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText("💀 GAME OVER 💀", canvas.width/2, canvas.height/2 - 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(canvas.width / 30)}px "Courier New", monospace`;
    ctx.fillText(`Pontuação Final: ${game.score}`, canvas.width/2, canvas.height/2 + 20);
    ctx.font = `${Math.floor(canvas.width / 40)}px monospace`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText("Pressione R para reiniciar", canvas.width/2, canvas.height/2 + 100);
    ctx.textAlign = 'left';
}

function drawVictory() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 3, 0, Math.PI*2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(canvas.width / 20)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText("🏆 VITÓRIA! 🏆", canvas.width/2, canvas.height/2 - 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(canvas.width / 25)}px "Courier New", monospace`;
    ctx.fillText("TODAS AS GALINHAS FORAM LIBERTADAS!", canvas.width/2, canvas.height/2);
    ctx.font = `${Math.floor(canvas.width / 30)}px monospace`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Pontuação Final: ${game.score}`, canvas.width/2, canvas.height/2 + 80);
    ctx.font = `${Math.floor(canvas.width / 40)}px monospace`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText("Pressione ENTER para jogar novamente", canvas.width/2, canvas.height/2 + 150);
    ctx.textAlign = 'left';
}

window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
});

window.debugGame = {
    getGame: () => game,
    restart: () => restartGame(),
    addScore: (points) => { if(game) game.score += points; }
};
