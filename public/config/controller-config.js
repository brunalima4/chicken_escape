// Configurações específicas para diferentes modelos de controle SNES USB
const CONTROLLER_CONFIGS = {
    'snes_usb': {
        name: 'Super Nintendo USB Controller',
        buttonMap: {
            0: 'B', 1: 'A', 2: 'Y', 3: 'X',
            4: 'L', 5: 'R', 6: 'SELECT', 7: 'START',
            12: 'UP', 13: 'DOWN', 14: 'LEFT', 15: 'RIGHT'
        }
    },
    
    'generic_usb': {
        name: 'Generic USB Controller',
        buttonMap: {
            0: 'A', 1: 'B', 2: 'X', 3: 'Y',
            4: 'L', 5: 'R', 8: 'SELECT', 9: 'START',
            12: 'UP', 13: 'DOWN', 14: 'LEFT', 15: 'RIGHT'
        }
    }
};

function detectControllerType(gamepadId) {
    const id = gamepadId.toLowerCase();
    if (id.includes('snes') || id.includes('super')) {
        return CONTROLLER_CONFIGS.snes_usb;
    }
    return CONTROLLER_CONFIGS.generic_usb;
}

// Mapeamento de controles para jogadores
const CONTROLLER_ASSIGNMENT = {
    player1: null,  // Índice do gamepad do jogador 1
    player2: null   // Índice do gamepad do jogador 2
};