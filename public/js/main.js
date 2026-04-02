let game;
let canvas;
let ctx;
let animationId;
let snesController;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Carregado - Iniciando jogo...");
    init();
    setupWindowEvents();
});

function init() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas não encontrado!");
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Inicializa o jogo primeiro
    game = new Game();
    
    // Depois inicializa o controle
    try {
        snesController = new SNESController();
        window.snesController = snesController;
        console.log("SNESController inicializado com sucesso!");
    } catch (error) {
        console.error("Erro ao inicializar SNESController:", error);
    }
    
    setupKeyboardControls();
    setupButtonControls();
    startGameLoop();
    showMainMenu();
    
    window.addEventListener('resize', () => {
        if (game) game.resizeCanvas();
    });
    
    // Mostra instruções após 1 segundo
    setTimeout(() => {
        if (snesController && snesController.getInfo) {
            const info = snesController.getInfo();
            if (info && info !== "Nenhum controle conectado") {
                Utils.showMessage(`🎮 ${info}`, 3000);
            } else {
                Utils.showMessage("🎮 Conecte controles USB e pressione START!", 4000);
            }
        }
    }, 1000);
}

function setupWindowEvents() {
    document.addEventListener('fullscreenchange', () => {
        if (game) game.resizeCanvas();
    });
    document.addEventListener('webkitfullscreenchange', () => {
        if (game) game.resizeCanvas();
    });
}

function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        if (!game) return;
        
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
    if (!container) return;
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.log(`Erro ao entrar em tela cheia: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

function startGameLoop() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    function loop(now) {
        frameCount++;
        
        // Limita FPS no Raspberry Pi
        if (window.isLowEndDevice) {
            const delta = now - lastTime;
            if (delta < 33) { // ~30 FPS
                animationId = requestAnimationFrame(loop);
                return;
            }
            lastTime = now;
        }
        
        if (!game) {
            animationId = requestAnimationFrame(loop);
            return;
        }
        
        try {
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
        } catch (error) {
            console.error("Erro no loop do jogo:", error);
        }
        
        animationId = requestAnimationFrame(loop);
    }
    
    animationId = requestAnimationFrame(loop);
}

function startGame() {
    if (!game) return;
    game.gameState = 'playing';
    game.restart();
    Utils.showMessage("🐔 Vamos fugir! Liberte todas as galinhas! 🐔", 3000);
    
    if (snesController && snesController.getInfo) {
        setTimeout(() => {
            const info = snesController.getInfo();
            Utils.showMessage(`🎮 ${info}`, 3000);
        }, 1000);
    }
}

function restartGame() {
    if (!game) return;
    game.restart();
    game.gameState = 'playing';
}

function pauseGame() {
    if (!game) return;
    game.gameState = 'paused';
    Utils.showMessage("⏸ Jogo Pausado - Pressione ESC para continuar", 2000);
}

function resumeGame() {
    if (!game) return;
    game.gameState = 'playing';
    Utils.showMessage("▶ Jogo Retomado!", 1000);
}

function showMainMenu() {
    if (!game) return;
    game.gameState = 'menu';
}

function drawMenu() {
    if (!ctx || !canvas) return;
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
    ctx.fillText("Controle USB: Conecte e aperte START", canvasWidth/2, canvasHeight/2 + 140);
    
    ctx.font = `${Math.floor(canvasWidth / 50)}px "Courier New", monospace`;
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText("🐔 Galinha Ninja - Rápida e ágil", canvasWidth/2 - 200, canvasHeight/2 + 200);
    ctx.fillStyle = '#4ECDC4';
    ctx.fillText("💪 Galinha Forte - Quebra obstáculos", canvasWidth/2 + 50, canvasHeight/2 + 200);
    
    // Mostra status dos controles
    if (snesController && snesController.getInfo) {
        const info = snesController.getInfo();
        ctx.font = `${Math.floor(canvasWidth / 60)}px monospace`;
        ctx.fillStyle = '#00FF00';
        ctx.fillText(info, canvasWidth/2, canvasHeight - 50);
    }
    
    ctx.textAlign = 'left';
}

function drawPaused() {
    if (!ctx || !canvas) return;
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
    if (!ctx || !canvas) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF4444';
    ctx.font = `bold ${Math.floor(canvas.width / 20)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText("💀 GAME OVER 💀", canvas.width/2, canvas.height/2 - 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(canvas.width / 30)}px "Courier New", monospace`;
    ctx.fillText(`Pontuação Final: ${game ? game.score : 0}`, canvas.width/2, canvas.height/2 + 20);
    ctx.font = `${Math.floor(canvas.width / 40)}px monospace`;
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText("Pressione R para reiniciar", canvas.width/2, canvas.height/2 + 100);
    ctx.textAlign = 'left';
}

function drawVictory() {
    if (!ctx || !canvas) return;
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
    ctx.fillText(`Pontuação Final: ${game ? game.score : 0}`, canvas.width/2, canvas.height/2 + 80);
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

window.startGame = startGame;
window.restartGame = restartGame;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.toggleFullscreen = toggleFullscreen;

// Função de debug para controles
function debugControllers() {
    if (!snesController) {
        console.log("❌ SNESController não inicializado");
        Utils.showMessage("❌ Controle não inicializado. Recarregue a página.", 2000);
        return;
    }
    
    if (typeof snesController.getInfo === 'function') {
        const info = snesController.getInfo();
        console.log("=== INFORMAÇÃO DOS CONTROLES ===");
        console.log(info);
        Utils.showMessage(`🎮 ${info}`, 3000);
    } else {
        console.log("❌ Método getInfo não disponível");
    }
    
    // Testa movimento de cada jogador
    if (typeof snesController.getPlayerMovement === 'function') {
        for (let i = 1; i <= 2; i++) {
            const movement = snesController.getPlayerMovement(i);
            console.log(`Jogador ${i} - Movimento: x=${movement.x.toFixed(2)}, y=${movement.y.toFixed(2)}`);
        }
    }
    
    // Lista todos os gamepads detectados pelo navegador
    console.log("=== GAMEPADS DETECTADOS PELO NAVEGADOR ===");
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            console.log(`Porta ${i}: ${gamepads[i].id}`);
        }
    }
}

window.debugControllers = debugControllers;

console.log("main.js carregado com sucesso!");