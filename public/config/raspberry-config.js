// Configurações específicas para Raspberry Pi
const RPI_CONFIG = {
    enabled: (function() {
        const platform = navigator.platform.toLowerCase();
        return platform.includes('arm') || platform.includes('linux');
    })(),
    
    FPS: 30,
    TILE_SIZE: 24,
    MAP_WIDTH: 20,
    MAP_HEIGHT: 12,
    QUALITY: 'low',
    SHADOWS: false,
    PARTICLES: false,
    SMOOTHING: false
};

// Aplica configurações se for Raspberry Pi
if (RPI_CONFIG.enabled && typeof CONFIG !== 'undefined') {
    CONFIG.FPS = RPI_CONFIG.FPS;
    CONFIG.TILE_SIZE = RPI_CONFIG.TILE_SIZE;
    CONFIG.MAP_WIDTH = RPI_CONFIG.MAP_WIDTH;
    CONFIG.MAP_HEIGHT = RPI_CONFIG.MAP_HEIGHT;
    console.log("Modo Raspberry Pi ativado - Configurações aplicadas");
}