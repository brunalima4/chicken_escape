// Funções Utilitárias

// Verifica colisão entre dois objetos
function checkCollision(obj1, obj2, radius = 0.8) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius;
}

// Gera número aleatório entre min e max
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Gera inteiro aleatório entre min e max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Clamp de valores
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Mostra mensagem temporária
function showMessage(text, duration = 2000) {
    const msgDiv = document.getElementById('gameMessages');
    if (!msgDiv) return;
    
    msgDiv.textContent = text;
    msgDiv.classList.remove('hidden');
    
    setTimeout(() => {
        msgDiv.classList.add('hidden');
    }, duration);
}

// Efeito de animação em elemento
function animateElement(element, animation) {
    if (!element) return;
    element.classList.add(animation);
    setTimeout(() => {
        element.classList.remove(animation);
    }, 500);
}

// Salva progresso no localStorage
function saveProgress(level, score) {
    const progress = {
        level: level,
        score: score,
        date: new Date().toISOString()
    };
    localStorage.setItem('chickenEscape_progress', JSON.stringify(progress));
}

// Carrega progresso do localStorage
function loadProgress() {
    const saved = localStorage.getItem('chickenEscape_progress');
    if (saved) {
        return JSON.parse(saved);
    }
    return null;
}

// Verifica se é Raspberry Pi (para otimizações)
function isRaspberryPi() {
    const platform = navigator.platform.toLowerCase();
    return platform.includes('arm') || platform.includes('linux');
}

// Otimizações para Chrome
function optimizeForChrome() {
    // Chrome já é otimizado, mas podemos ajustar algumas coisas
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        // Usa aceleração de hardware
        canvas.style.transform = 'translateZ(0)';
        canvas.style.willChange = 'transform';
    }
}

// Exporta funções para uso global
window.Utils = {
    checkCollision,
    randomRange,
    randomInt,
    clamp,
    showMessage,
    animateElement,
    saveProgress,
    loadProgress,
    isRaspberryPi,
    optimizeForChrome
};