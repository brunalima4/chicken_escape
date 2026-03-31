const updateEnemies = (enemies, players, map) => {
    return enemies.map(enemy => {
        let newX = enemy.x;
        let newY = enemy.y;

        if (enemy.type === 'REX') {
            const target = Object.values(players)[0];
            if (target) {
                newX += (target.x > enemy.x) ? 1 : -1;
                newY += (target.y > enemy.y) ? 1 : -1;
            }
        }

        if (enemy.type === 'SIBILO') {
            const holes = map.filter(obj => obj.type === 'HOLE');
            if (holes.length > 0) {
                newX += (holes[0].x > enemy.x) ? 1 : -1;
            }
        }

        return { ...enemy, x: newX, y: newY };
    });
};

module.exports = { updateEnemies };