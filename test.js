// B. P.
// Snake VI, Sequel to Snake IV
// 3/11/2026
(() => {
    // Simple browser-game template
    const canvas = document.getElementById('gameCanvas').appendChild(document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(canvas);

    // Screen Size
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;
    ctx.scale(1,1);
    ctx.imageSmoothingEnabled = false;

    // Parralax Layers
    const parallaxLayers = [
        { speed: 0.1, size: 0.8, content: null }, // Placeholder for water layer
        { speed: 0.5, size: 1, content: null }, // Placeholder for midground layer
        { speed: 0.6, size: 1.1, content: null }, // Layer1
        { speed: 0.7, size: 1.2, content: null }, // Layer2
        { speed: 0.8, size: 1.3, content: null }, // Layer3
        { speed: 0.9, size: 1., content: null }, // Layer4
    ];

    // Game state
    const State = { MENU: 'menu', PLAY: 'play', PAUSED: 'paused' };
    let state = State.MENU;

    // Input
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === 'Escape') {
            state = state === State.PLAY ? State.PAUSED : State.PLAY;
        }
    });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });


    document.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Map client (screen) coordinates to the canvas' logical drawing coordinates
        mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
        mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    });

    let mouseX = 0;
    let mouseY = 0;

    
    // Simple demo player
    const player = {
        x: 1025,
        y: 2000,
        size: 24,
        speed: 220 // px/s
    };

    //===================//
    // MAP & WORLD
    //===================//

    
    const tileAtlas = new Image();
    const waterTexture = new Image();
    const mapVerticalLayers = 12

    const mapTiles = {
        GRASS: {
            name: 'Grass',
            color: '#3d9f34',
            height: 0,
            solid: false,
            texture: [1, 0],
            midLayerTexture: null,
            topLayerTexture: null 
        },

        ROAD: {
            name: 'Road',
            color: '#000000',
            height: 0,
            solid: false,
            texture: [2, 0],
            midLayerTexture: null,
            topLayerTexture: null 
        },

        SIDEWALK: {
            name: 'Sidewalk',
            color: '#d8d8d8',
            height: 0,
            solid: false,
            texture: [0, 0],
            midLayerTexture: null,
            topLayerTexture: null 
        },

        TREE: {
            name: 'Tree',
            color: '#228B22',
            height: 2,
            solid: false,
            texture: [1, 1],
            midLayerTexture: [3, 1],
            topLayerTexture: [2, 1], 
        },

        
        HOUSE1: {
            name: 'House1',
            color: '#e1c914',
            height: 1,
            solid: true,
            texture: [0, 3],
            midLayerTexture: [0, 3],
            topLayerTexture: [1, 3], 
        },


        SKYSCRAPER1: {
            name: 'Skyscraper1',
            color: '#e1c914',
            height: 8,
            solid: true,
            texture: [3, 0],
            midLayerTexture: null,
            topLayerTexture: [0, 1], 
        },
        
        SKYSCRAPER2: {
            name: 'Skyscraper2',
            color: '#e1c914',
            height: 4,
            solid: true,
            texture: [0, 2],
            midLayerTexture: null,
            topLayerTexture: [0, 1], 
        },

        SKYSCRAPER3: {
            name: 'Skyscraper3',
            color: '#e1c914',
            height: 5,
            solid: true,
            texture: [1, 2],
            midLayerTexture: null,
            topLayerTexture: [3, 2], 
        },

        SKYSCRAPER4: {
            name: 'Skyscraper4',
            color: '#e1c914',
            height: 6,
            solid: true,
            texture: [2, 2],
            midLayerTexture: null,
            topLayerTexture: [3, 2], 
        },


    };

    const mapTileSize = 256;

    // Map Layout

    const map = [];
    const tileSize = 256;
    const mapWidth = 128;
    const mapHeight = 128;
    for (let y = 0; y < mapHeight; y++) {
        map[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            const rand = Math.random();
            if (rand < 0.7) map[y][x] = "GRASS"; // Grass
            else if (rand < 0.8) map[y][x] = "TREE"; // Tree
            else if (rand < 0.85) map[y][x] = "ROAD"; // Road
            else if (rand < 0.95) map[y][x] = "SIDEWALK"; // Sidewalk
            else if (Math.random() < 0.5) map[y][x] = "HOUSE1"; // Skyscraper1
            else map[y][x] = "HOUSE1"; // Skyscraper2
        }
    }
    


    // Screen Position Functions

    function screenToWorld(x, y) {
        return {
            x: x + player.x - width / 2,
            y: y + player.y - height / 2
        };
    }

    //===================//
    // RENDERING
    //===================//

    function drawTile(tileID, layer, x, y, tileInfo) {

    // Get TileCoords
    // First check if the tile is bottom, middle or top
    if (tileInfo.midLayerTexture && layer < tileInfo.height && layer > 0) {
        tileCoords = tileInfo.midLayerTexture;
    } else if (tileInfo.topLayerTexture && layer == tileInfo.height) {
        tileCoords = tileInfo.topLayerTexture;
    } else { tileCoords = tileInfo.texture; }
x
    // Get Base Position
    const localPos = worldToScreen(x, y);
    let screenX = localPos.x;
    let screenY = localPos.y;

    const sx = tileCoords[0] * tileSize;
    const sy = tileCoords[1] * tileSize;

    // Perspective Math
    const z0 = 500; 
    const z = layer * 60; 
    const perspectiveScale = (z + z0) / z0;

    // Shift the position relative to screen center
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate the center of the tile to scale from the middle
    let tileCenterX = screenX + tileSize / 2;
    let tileCenterY = screenY + tileSize / 2;

    // Apply the parallax shift to the CENTER point
    tileCenterX = (tileCenterX - centerX) * perspectiveScale + centerX;
    tileCenterY = (tileCenterY - centerY) * perspectiveScale + centerY;

    // Match the tile size to the perspective
    const pTileSize = tileSize * perspectiveScale;

    // Subtract half the new size to keep the tile centered on the shifted point
    ctx.drawImage(
        tileAtlas,
        sx, sy,
        mapTileSize, mapTileSize,
        tileCenterX - pTileSize / 2, 
        tileCenterY - pTileSize / 2,
        pTileSize, pTileSize
    );
}


    function drawMap(layer) {
        // First Determine visible tiles based on player position and screen size
        const startX = Math.max(0, Math.floor((player.x - width / 2) / tileSize));
        const endX = Math.min(map[0].length, Math.ceil((player.x + width / 2) / tileSize));
        const startY = Math.max(0, Math.floor((player.y - height / 2) / tileSize));
        const endY = Math.min(map.length, Math.ceil((player.y + height / 2) / tileSize));

        // Then draw only those tiles
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                // If tile doesn't exist, skip
                if (!map[y] || map[y][x] === undefined) continue;

                
                // Use tile rendering function to draw tile based on its ID

                const tileID = map[y][x];
                const tileInfo = mapTiles[tileID];

                if (tileInfo.height < layer) continue; // Skip if tile is above current layer
                
                if (!tileInfo) continue; // Skip if tile ID is invalid

                drawTile(tileID, layer, x * tileSize, y * tileSize, tileInfo);

            }
        }
    };

    // Groups of Objects so I can Track them and not be annoyed by the fact that I can't track them you understand right?

    const bullets = [];

    const vehicles = [];

    const characters = [];




    // Worldspace to screenspace conversion
    function worldToScreen(x, y) {
        return {
            x: x - player.x + width / 2,
            y: y - player.y + height / 2
        };
    }

    // Fixed timestep loop
    let lastTime = performance.now();
    const timestep = 1 / 60;
    let accumulator = 0;

    // FPS meter (simple)
    let fps = 0;
    let frames = 0;
    let fpsTimer = 0;

    function update(dt) {
        if (state !== State.PLAY) return;
        let vx = 0, vy = 0;
        if (keys.ArrowLeft || keys.a) vx -= 1;
        if (keys.ArrowRight || keys.d) vx += 1;
        if (keys.ArrowUp || keys.w) vy -= 1;
        if (keys.ArrowDown || keys.s) vy += 1;
        const len = Math.hypot(vx, vy) || 1;

        // Map Collision
        const checkCollision = (x, y) => {
            const tileX = Math.floor(x / tileSize);
            const tileY = Math.floor(y / tileSize);
            
            if (tileY < 0 || tileY >= map.length || tileX < 0 || tileX >= map[0].length) {
                return true; // Out of bounds is solid
            }
            
            const tile = mapTiles[map[tileY][tileX]];
            return tile && tile.solid;
        };

        const newX = player.x + (vx / len) * player.speed * dt;
        const newY = player.y + (vy / len) * player.speed * dt;

        if (!checkCollision(newX, player.y)) {
            player.x = newX;
        }
        if (!checkCollision(player.x, newY)) {
            player.y = newY;
        }
        
        /*
        player.x += (vx / len) * player.speed * dt;
        player.y += (vy / len) * player.speed * dt;
        */
    }

    function render() {
        // Clear
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(0, 0, width, height);
        
        // Draw Water
        ctx.drawImage(waterTexture, 0, 0, width, height);


        // UI / state screens
        if (state === State.MENU) {
            ctx.fillStyle = '#fff';
            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Demo Game Template', width / 2, height / 2 - 24);
            ctx.font = '16px sans-serif';
            ctx.fillText('Press Enter to Start', width / 2, height / 2 + 8);
            return;
        }

        // Draw Map layer 1
        drawMap(0); // Ground layer


        // Draw player
        ctx.fillStyle = '#4ee';
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, player.size / 2, 0, Math.PI * 2);
        ctx.fill();



        // Draw Bullets
        bullets.forEach(bullet => {
            // Check if bullet should be on screen
            const screenPos = worldToScreen(bullet.x, bullet.y);
            if (screenPos.x < -bullet.size || screenPos.x > width + bullet.size || screenPos.y < -bullet.size || screenPos.y > height + bullet.size) {
                return; // Skip drawing off-screen bullets
            }

            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, bullet.size / 2, 0, Math.PI * 2);
            ctx.fill();
        });


        // Draw map layers above
        for (let layer = 1; layer < mapVerticalLayers; layer++) {
            drawMap(layer);
        }

        // Simple HUD
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`State: ${state}`, 10, 20);
        ctx.fillText(`FPS: ${Math.round(fps)}`, 10, 40);
        ctx.fillText(`Position: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 60);
        ctx.fillText('Arrows / WASD to move, Esc to pause', 10, height - 10);
    }



    // Start game on Enter
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && state === State.MENU) {
            state = State.PLAY;
        }
    });

    window.addEventListener('mousemove', (event) => {
        let mouseX = event.clientX;
        let mouseY = event.clientY;
        
        // convert mouse position to world coordinates
        const rect = canvas.getBoundingClientRect();
    });



    window.addEventListener('click', (e) => {
        if (state === State.PLAY) {
            // get mouse position and rotation from character's position

            // convert mouse position to world coordinates
            const worldMouse = screenToWorld(mouseX, mouseY);

            // calculate angle from player to mouse
            const angle = Math.atan2(worldMouse.y - player.y, worldMouse.x - player.x);

            // Temporary hardcoded bullet properties
            const bulletspeed = 800;
            const bulletspread = 0.1;

            // Add bullet with random spread
            bullets.push({
                x: (Math.cos(angle) * player.size) + player.x,
                y: (Math.sin(angle) * player.size) + player.y,
                velocityX: Math.cos(angle + (Math.random() * bulletspread - bulletspread / 2)) * bulletspeed,
                velocityY: Math.sin(angle + (Math.random() * bulletspread - bulletspread / 2)) * bulletspeed,
                size: 8,
                color: '#f00',
                damage: 10,
            });
        }
    });

    function loop(now) {
        // Calculate delta time
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        accumulator += delta;

        // Update in fixed steps
        while (accumulator >= timestep) {
            update(timestep);
            accumulator -= timestep;
        }

        // Render
        render();

        if (state === State.PLAY) {
            // Update bullets
            bullets.forEach(bullet => {
                bullet.x += bullet.velocityX * timestep;
                bullet.y += bullet.velocityY * timestep;
            });
        }


        // FPS calculation
        frames++;
        fpsTimer += delta;
        if (fpsTimer >= 0.5) {
            fps = (frames / fpsTimer);
            frames = 0;
            fpsTimer = 0;
        }

        requestAnimationFrame(loop);
    }

    // Minimal asset loader stub
    function loadAssets(list = []) {
        tileAtlas.src = "Assets/Textures/TileAtlas.png";
        waterTexture.src = "Assets/Textures/Water.gif";

        return Promise.resolve();
    }

    // Init
    loadAssets().then(() => {
        lastTime = performance.now();
        requestAnimationFrame(loop);
    });

})();
