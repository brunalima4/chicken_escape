// Suporte a DOIS Controles USB - VERSÃO DEFINITIVA
class SNESController {
    constructor() {
        this.controllers = {};
        this.controllersState = {};
        this.playerToPort = { player1: null, player2: null };
        this.portToPlayer = {};
        
        this.buttonMap = {
            0: 'B', 1: 'A', 2: 'Y', 3: 'X',
            4: 'L', 5: 'R', 6: 'SELECT', 7: 'START',
            8: 'L2', 9: 'R2',
            12: 'UP', 13: 'DOWN', 14: 'LEFT', 15: 'RIGHT'
        };
        
        this.axisMap = {
            0: 'LEFT_RIGHT', 1: 'UP_DOWN'
        };
        
        // Cache do último movimento para evitar spam de eventos
        this.lastMovement = {
            player1: { x: 0, y: 0 },
            player2: { x: 0, y: 0 }
        };
        
        this.init();
    }
    
    init() {
        console.log("SNESController: Inicializando...");
        
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
        
        // Verifica controles já conectados
        this.scanForGamepads();
        
        // Inicia loop de atualização
        this.updateLoop();
    }
    
    scanForGamepads() {
        if (!navigator.getGamepads) {
            console.log("Gamepad API não suportada");
            return;
        }
        
        const gamepads = navigator.getGamepads();
        console.log("Procurando gamepads existentes...");
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                console.log(`Gamepad encontrado na porta ${i}: ${gamepads[i].id}`);
                this.onGamepadConnected({ gamepad: gamepads[i] });
            }
        }
    }
    
    onGamepadConnected(e) {
        const gamepad = e.gamepad;
        const port = gamepad.index;
        
        console.log(`[CONTROLLER] Conectado na porta ${port}: ${gamepad.id}`);
        console.log(`[CONTROLLER] Botões: ${gamepad.buttons.length}, Eixos: ${gamepad.axes.length}`);
        
        this.controllers[port] = gamepad;
        this.controllersState[port] = {
            connected: true,
            buttons: {},
            axes: {},
            port: port,
            id: gamepad.id,
            playerAssigned: null
        };
        
        this.assignPlayerToPort(port);
        
        const playerNum = this.controllersState[port].playerAssigned === 'player1' ? '1' : '2';
        const playerName = playerNum === '1' ? 'Galinha Ninja' : 'Galinha Forte';
        
        if (window.Utils && window.Utils.showMessage) {
            window.Utils.showMessage(`🎮 Controle ${playerNum} (${playerName}) conectado na USB ${port + 1}!`, 3000);
        }
        
        console.log(`[CONTROLLER] ✅ Porta ${port} -> Jogador ${playerNum} (${playerName})`);
        
        // Dispara evento de conexão
        window.dispatchEvent(new CustomEvent('controllerconnected', {
            detail: { player: `player${playerNum}`, port: port }
        }));
    }
    
    assignPlayerToPort(port) {
        let hasPlayer1 = false;
        let hasPlayer2 = false;
        
        for (let p in this.controllersState) {
            if (this.controllersState[p].playerAssigned === 'player1') hasPlayer1 = true;
            if (this.controllersState[p].playerAssigned === 'player2') hasPlayer2 = true;
        }
        
        console.log(`Atribuindo porta ${port} - Jogador1: ${hasPlayer1}, Jogador2: ${hasPlayer2}`);
        
        if (!hasPlayer1) {
            this.controllersState[port].playerAssigned = 'player1';
            this.playerToPort.player1 = parseInt(port);
            this.portToPlayer[port] = 'player1';
        } else if (!hasPlayer2) {
            this.controllersState[port].playerAssigned = 'player2';
            this.playerToPort.player2 = parseInt(port);
            this.portToPlayer[port] = 'player2';
        } else {
            // Substitui jogador 2
            const oldPort2 = this.playerToPort.player2;
            if (oldPort2 !== null && this.controllersState[oldPort2]) {
                this.controllersState[oldPort2].playerAssigned = null;
                delete this.portToPlayer[oldPort2];
            }
            this.controllersState[port].playerAssigned = 'player2';
            this.playerToPort.player2 = parseInt(port);
            this.portToPlayer[port] = 'player2';
            console.log(`Substituindo jogador 2 - nova porta: ${port}`);
        }
    }
    
    onGamepadDisconnected(e) {
        const gamepad = e.gamepad;
        const port = gamepad.index;
        
        console.log(`[CONTROLLER] Desconectado na porta ${port}`);
        
        const player = this.controllersState[port]?.playerAssigned;
        delete this.controllers[port];
        delete this.controllersState[port];
        
        if (player === 'player1') {
            this.playerToPort.player1 = null;
            this.lastMovement.player1 = { x: 0, y: 0 };
        }
        if (player === 'player2') {
            this.playerToPort.player2 = null;
            this.lastMovement.player2 = { x: 0, y: 0 };
        }
        delete this.portToPlayer[port];
        
        if (player && window.Utils && window.Utils.showMessage) {
            const playerNum = player === 'player1' ? '1' : '2';
            window.Utils.showMessage(`⚠️ Controle do Jogador ${playerNum} desconectado!`, 2000);
        }
    }
    
    update() {
        const gamepads = navigator.getGamepads();
        
        // Atualiza estado de todos os controles
        for (let port in this.controllers) {
            const gamepad = gamepads[port];
            if (!gamepad) continue;
            
            const state = this.controllersState[port];
            if (!state || !state.playerAssigned) continue;
            
            const player = state.playerAssigned;
            const playerId = player === 'player1' ? 1 : 2;
            
            // Atualiza botões
            for (let i = 0; i < gamepad.buttons.length; i++) {
                const button = gamepad.buttons[i];
                const buttonName = this.buttonMap[i];
                
                if (buttonName) {
                    const pressed = button.pressed;
                    const oldPressed = state.buttons[buttonName] || false;
                    
                    if (pressed !== oldPressed) {
                        state.buttons[buttonName] = pressed;
                        
                        // Dispara evento apenas para botões importantes
                        if (pressed && (buttonName === 'START' || buttonName === 'A' || buttonName === 'B')) {
                            console.log(`[CONTROLLER] Jogador ${playerId} apertou: ${buttonName}`);
                        }
                        
                        const event = new CustomEvent('snesbutton', {
                            detail: {
                                player: player,
                                playerId: playerId,
                                button: buttonName,
                                pressed: pressed,
                                port: parseInt(port)
                            }
                        });
                        window.dispatchEvent(event);
                    }
                }
            }
            
            // Atualiza eixos (analógicos) para movimento
            let moveX = 0, moveY = 0;
            const deadzone = 0.2;
            
            // D-Pad (prioridade)
            if (state.buttons['LEFT']) moveX = -1;
            if (state.buttons['RIGHT']) moveX = 1;
            if (state.buttons['UP']) moveY = -1;
            if (state.buttons['DOWN']) moveY = 1;
            
            // Analog sticks (fallback)
            if (moveX === 0 && gamepad.axes[0] && Math.abs(gamepad.axes[0]) > deadzone) {
                moveX = gamepad.axes[0];
            }
            if (moveY === 0 && gamepad.axes[1] && Math.abs(gamepad.axes[1]) > deadzone) {
                moveY = gamepad.axes[1];
            }
            
            // Armazena movimento no estado
            state.currentMoveX = moveX;
            state.currentMoveY = moveY;
            
            // Dispara evento de movimento se mudou significativamente
            const lastMove = this.lastMovement[player];
            if (Math.abs(moveX - lastMove.x) > 0.1 || Math.abs(moveY - lastMove.y) > 0.1) {
                this.lastMovement[player] = { x: moveX, y: moveY };
                
                const event = new CustomEvent('snesaxis', {
                    detail: {
                        player: player,
                        playerId: playerId,
                        axis: 'MOVEMENT',
                        x: moveX,
                        y: moveY,
                        port: parseInt(port)
                    }
                });
                window.dispatchEvent(event);
            }
        }
    }
    
    // Método principal para obter movimento - CHAMADO A CADA FRAME pelo Player
    getPlayerMovement(playerId) {
        const playerKey = `player${playerId}`;
        const port = this.playerToPort[playerKey];
        
        if (port === null || !this.controllersState[port]) {
            return { x: 0, y: 0 };
        }
        
        const state = this.controllersState[port];
        return { 
            x: state.currentMoveX || 0, 
            y: state.currentMoveY || 0 
        };
    }
    
    isButtonPressed(playerId, buttonName) {
        const playerKey = `player${playerId}`;
        const port = this.playerToPort[playerKey];
        
        if (port === null || !this.controllersState[port]) {
            return false;
        }
        
        return this.controllersState[port].buttons[buttonName] === true;
    }
    
    getInfo() {
        let info = "";
        for (let port in this.controllersState) {
            const state = this.controllersState[port];
            if (state && state.playerAssigned) {
                const playerNum = state.playerAssigned === 'player1' ? '1' : '2';
                info += `Jogador ${playerNum}: USB ${parseInt(port) + 1} | `;
            }
        }
        return info || "Nenhum controle conectado";
    }
    
    getDetailedInfo() {
        let info = [];
        for (let port in this.controllersState) {
            const state = this.controllersState[port];
            if (state && state.playerAssigned) {
                const playerNum = state.playerAssigned === 'player1' ? '1' : '2';
                info.push({
                    player: playerNum,
                    port: parseInt(port) + 1,
                    id: state.id,
                    moveX: state.currentMoveX || 0,
                    moveY: state.currentMoveY || 0
                });
            }
        }
        return info;
    }
    
    updateLoop() {
        const update = () => {
            this.update();
            requestAnimationFrame(update);
        };
        update();
    }
}

window.SNESController = SNESController;
console.log("controller.js carregado com sucesso!");