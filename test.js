// B. P.
// Snake VI, Sequel to Snake IV
// 3/11/2026

const gameCanvas = document.getElementById("gameCanvas"); 
const canvas = document.createElement('canvas');
gameCanvas.appendChild(canvas);


function toggleFullScreen() {
    if (!document.fullscreenElement) {
        // If the document is not in fullscreen mode, request fullscreen for the container
        canvas.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });

        gameCanvas.width = window.screen.width;
        gameCanvas.height = window.screen.height;
    } else {
        // If the document is in fullscreen mode, exit fullscreen
        document.exitFullscreen();
        gameCanvas.width = 640; // Reset to default width
        gameCanvas.height = 480; // Reset to default height
    }
}

(() => {
    // Simple browser-game template
    const ctx = canvas.getContext('2d');
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(canvas);

    canvas.setAttribute("draggable", "false");

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
        size: 20,
        visualsize: 48, // For rendering, can be different from hitbox size
        speed: 220, // px/s
        velocityX: 0,
        velocityY: 0,
        

        // Inventory
        health: 100,
        cash: 0,
        weapons: [['PISTOL', 12], ['BBGUN', 30]], // Value 1: weapon, Value 2: Loaded Ammo
        equippedWeapon: 0,
        
        // Animation
        legAngle: 0,
    };

    // Animation Setup
    const characterAtlas = new Image();

    // Body Positions for different weapons/stances. The tile below each is for the arms.
    const bodyFrames = {
        DEFAULT: { x: 0, y: 1 },
        PISTOL1: { x: 3, y: 1 },
        PISTOL2: { x: 1, y: 1 },
        RIFLE2: { x: 2, y: 1 },
    };

    // Leg animation frames for running
    const legRunFrames = [
        { x: 0, y: 0, time: 0.2, flipped: false},
        { x: 2, y: 0, time: 0.05, flipped: false},
        { x: 1, y: 0, time: 0.1, flipped: false},
        
        { x: 0, y: 0, time: 0.2, flipped: false},
        { x: 4, y: 0, time: 0.05, flipped: true},
        { x: 3, y: 0, time: 0.1, flipped: true},


    ];

    //===================//
    // NPC & ENEMIES
    //===================//

    const npcs = {
        CIVILIAN: {
            name: 'Civilian',
            color: '#4ee',
            size: 16,
            speed: 100,
            health: 50,
            aiType: 'wander'
        },
        
        POLICE: {
            name: 'Police',
            color: '#44a',
            size: 20,
            speed: 150,
            health: 100,
            aiType: 'armed'
        },

        GANGSTER: {
            name: 'Gangster',
            color: '#a44',
            size: 20,
            speed: 130,
            health: 80,
            aiType: 'chase',
        },
    };

    //===================//
    // WEAPONS
    //===================//

    const ammoList = {
        BB: {
            name: "BB",
            price: 8,
            quantity: 100,
        },
        NINEMM: {
            name: "9mm",
            price: 12,
            quantity: 50,
        },
    };

    const weaponList = {
        BBGUN: {
            name: "BB Gun",
            bodyFrame: bodyFrames.PISTOL1,
            speed: 500, // 0 Speed for Hitscan
            automatic: false,
            damage: 5,
            spread: 0.3,
            fireRate: 0.2,
            ammoType: "BB",
            ammo: 30,
            maxAmmo: 30,
            reloadTime: 2,

            bulletSize: 4,
            bulletColor: 'rgb(200, 200, 255)',
            bulletLifetime: 3,
        },

        PISTOL: {
            name: "Pistol",
            bodyFrame: bodyFrames.PISTOL1, // Pose for holding pistol
            speed: 900,
            automatic: false,
            damage: 20,
            spread: 0.1,
            fireRate: 0.5,
            ammoType: "NINEMM",
            ammo: 12,
            maxAmmo: 12,
            reloadTime: 1,

            bulletSize: 6,
            bulletColor: 'rgb(255, 255, 100)',
            bulletLifetime: 3,
        },
    };

    //===================//
    // MAP & WORLD
    //===================//

    
    const tileAtlas = new Image();
    const waterTexture = new Image();
    const mapVerticalLayers = 12

    const drawnTiles = {}; // Storage for tiles drawn in current frame, to allow for spawning of decoration and NPCs

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

        
        HOUSE2: {
            name: 'House',
            color: '#e1c914',
            height: 1,
            solid: true,
            texture: [2, 3],
            midLayerTexture: [0, 3],
            topLayerTexture: [3, 3], 
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
            // Define weighted tile types for random selection
            const tileWeights = [
                { type: "GRASS", weight: 30 },
                { type: "SIDEWALK", weight: 25 },
                { type: "ROAD", weight: 20 },
                { type: "TREE", weight: 8 },
                { type: "HOUSE1", weight: 5 },
                { type: "HOUSE2", weight: 5 },
                { type: "SKYSCRAPER1", weight: 2 },
                { type: "SKYSCRAPER2", weight: 2 },
                { type: "SKYSCRAPER3", weight: 2 },
                { type: "SKYSCRAPER4", weight: 1 }
            ];

            // Precompute total weight
            const totalWeight = tileWeights.reduce((sum, t) => sum + t.weight, 0);

            function getRandomTileType() {
                let r = Math.random() * totalWeight;
                for (const t of tileWeights) {
                    if (r < t.weight) return t.type;
                    r -= t.weight;
                }
                return "GRASS"; // fallback
            }

            map[y][x] = getRandomTileType();
        }
    }
    


    // Screen Position Functions

    function screenToWorld(x, y) {
        return {
            x: x + player.x - width / 2,
            y: y + player.y - height / 2
        };
    }
    
    // function 

    function tileRandom(x, y) {
        let n = x * 374761393 + y * 668265263; // large primes
        n = (n ^ (n >> 13)) * 1274126177;
        return ((n ^ (n >> 16)) >>> 0) / 4294967295;
    }

    //===================//
    // DECORATION & NPC SPAWNING
    //===================//

    const decorationRes = 128; // Resolution of decorations in atlas
    const worldModifications = new Map(); // To track changes to the world like destroyed objects or spawned NPCs
    const decorAtlas = new Image();

    // List of decorations and NPCs to spawn on drawn tiles, with distance-based deletion to prevent overcrowding and performance issues.

    const decorTemplates = {
        BENCH: {
            type: 'BENCH',
            solid: true, // Whether it blocks movement
            size: [10, 20], // for hitbox
            hitboxOffset: [0, 0], // Offset from tile center for hitbox
            height: 2, // For rendering layer
            texture: [3, 0],
            midLayerTexture: [2, 0],
            topLayerTexture: [1, 0],
        },
    };


    
    function decorate(tileX, tileY) {
        // Use tileRandom with tile coordinates to get a consistent random value for each tile
        // If the tile is suitable for decoration and the random value is below a threshold, spawn a decoration
        const tileID = map[tileY][tileX];
        const tileInfo = mapTiles[tileID];
        const rand = tileRandom(tileX, tileY);

        // Example: 10% chance to spawn a bench on sidewalks
        // (only on sides not meeting other sidewalks to avoid blocking them)
        if (tileInfo && tileInfo.name === 'Sidewalk' && rand < 1) {
            

            // Check surrounding tiles to avoid blocking paths
            const hasSidewalkLeft = map[tileY][tileX - 1] === 'SIDEWALK';
            const hasSidewalkRight = map[tileY][tileX + 1] === 'SIDEWALK';
            const hasSidewalkUp = map[tileY - 1] && map[tileY - 1][tileX] === 'SIDEWALK';
            const hasSidewalkDown = map[tileY + 1] && map[tileY + 1][tileX] === 'SIDEWALK';

            if ((hasSidewalkLeft && !hasSidewalkRight) || (hasSidewalkRight && !hasSidewalkLeft) ||
                (hasSidewalkUp && !hasSidewalkDown) || (hasSidewalkDown && !hasSidewalkUp)) {
                
                // Spawn bench
                decoration.push({
                    ...decorTemplates.BENCH,
                    x: tileX * tileSize + tileSize / 2,
                    y: tileY * tileSize + tileSize / 2,
                });
            }
        }
    }

    //===================//
    // RENDERING
    //===================//

function drawTile(tileID, layer, x, y, tileInfo) {
    // Get TileCoords
    // First check if the tile is bottom, middle or top
    let tileCoords;
    if (tileInfo.midLayerTexture && layer < tileInfo.height && layer > 0) {
        tileCoords = tileInfo.midLayerTexture;
    } else if (tileInfo.topLayerTexture && layer == tileInfo.height) {
        tileCoords = tileInfo.topLayerTexture;
    } else {
        tileCoords = tileInfo.texture;
    }

    // Get Base Position
    const localPos = worldToScreen(x, y);
    let screenX = localPos.x;
    let screenY = localPos.y;

    const sx = tileCoords[0] * 256;
    const sy = tileCoords[1] * 256;

    // Perspective Math
    const z0 = 500; 
    const z = layer * 60; 
    const perspectiveScale = (z + z0) / z0;

    // Shift the position relative to screen center
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate the center of the tile to scale from the middle
    let tileCenterX = screenX + 256 / 2;
    let tileCenterY = screenY + 256 / 2;

    // Apply the parallax shift to the CENTER point
    tileCenterX = (tileCenterX - centerX) * perspectiveScale + centerX;
    tileCenterY = (tileCenterY - centerY) * perspectiveScale + centerY;

    // Match the tile size to the perspective
    const pTileSize = 256 * perspectiveScale;

    // Subtract half the new size to keep the tile centered on the shifted point
    ctx.drawImage(
        tileAtlas,
        sx, sy,
        256, 256,
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

                // Decorate the tile
                if (layer === 0) {
                    decorate(x, y);
                }

            };
        };
    };

    function drawDecorations()  {
        decoration.forEach(decor => {
            const screenPos = worldToScreen(decor.x, decor.y);
            const decorInfo = decorTemplates[decor.type];
            if (!decorInfo) return;

            for (let layer = 0; layer <= decorInfo.height; layer++) {
                // Get texture coordinates for the layer (base, mid, top)
                let tileCoords;
                if (layer === 0) {
                    tileCoords = decorInfo.texture;
                } else if (layer < decorInfo.height && decorInfo.midLayerTexture) {
                    tileCoords = decorInfo.midLayerTexture;
                } else if (layer === decorInfo.height && decorInfo.topLayerTexture) {
                    tileCoords = decorInfo.topLayerTexture;
                } else {
                    continue; // No texture for this layer
                }

                const sx = tileCoords[0] * decorationRes;
                const sy = tileCoords[1] * decorationRes;
                console.log(tileCoords)

                // Perspective Math
                const z0 = 800; 
                const z = layer * 20; // Shorter, so less distance
                const perspectiveScale = (z + z0) / z0;

                // Shift the position relative to screen center
                const centerX = width / 2;
                const centerY = height / 2;

                // Calculate the center of the decoration to scale from the middle
                let decorCenterX = screenPos.x;
                let decorCenterY = screenPos.y;

                // Apply the parallax shift to the CENTER point
                decorCenterX = (decorCenterX - centerX) * perspectiveScale + centerX;
                decorCenterY = (decorCenterY - centerY) * perspectiveScale + centerY;

                // Match the tile size to the perspective
                const pTileSize = decorationRes * perspectiveScale;
                // Subtract half the new size to keep the decoration centered on the shifted point

                
                ctx.drawImage(
                    decorAtlas,
                    sx, sy,
                    decorationRes, decorationRes,
                    decorCenterX - pTileSize / 2, 
                    decorCenterY - pTileSize / 2,
                    pTileSize, pTileSize,
                );
            }
        });
    }
    // Groups of Objects so I can Track them and not be annoyed by the fact that I can't track them you understand right?

    const bullets = [];

    const vehicles = [];

    const characters = [];

    const decoration = [];




    // Worldspace to screenspace conversion
    function worldToScreen(x, y) {
        return {
            x: Math.floor(x - player.x + width / 2),
            y: Math.floor(y - player.y + height / 2)
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

        

        player.velocityX = (vx / len) * player.speed;
        player.velocityY = (vy / len) * player.speed;

        const newX = player.x + player.velocityX * dt;
        const newY = player.y + player.velocityY * dt;

        if (!checkCollision(newX, player.y)) {
            player.x = newX;
        }
        if (!checkCollision(player.x, newY)) {
            player.y = newY;
        }
        
    }

    function render() {

        if (state === State.PAUSED) {
            return;
        }

        // Clear
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(0, 0, width, height);
        
        // ====== Layer 0 ====== //

        // Draw Water
        ctx.drawImage(waterTexture, 0, 0, width, height);


        // UI / state screens
        if (state === State.MENU) {
            ctx.fillStyle = '#fff';
            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Snake VI Test', width / 2, height / 2 - 24);
            ctx.font = '16px sans-serif';
            ctx.fillText('Press Enter to Start', width / 2, height / 2 + 8);
            return;
        }

        
        // ====== Layer 1 ====== //

        // Draw Map layer 1
        drawMap(0); // Ground layer

        // Add decoration or NPCs on drawn tiles
        drawDecorations();

        // Clear decoration array
        decoration.length = 0;
        

        
        // ====== Playable Layer ====== //

        // Draw player
        const playerScreenPos = worldToScreen(player.x, player.y);

        // Determine movement direction based on VelocityX and VelocityY
        const moveSpeed = Math.hypot(player.velocityX, player.velocityY);
        let legFrame = legRunFrames[0]; // Default to first frame when idle

        if (moveSpeed > 0.01) {
            // Determine movement direction for leg/step angle
            player.legAngle = Math.atan2(player.velocityY, player.velocityX) - Math.PI / 2;

            legFrame = legRunFrames[Math.floor((performance.now() / 100) % legRunFrames.length)];
        } else {
            // Keep last known direction when stopped
            player.legAngle = player.legAngle ?? 0;
        }

        // Draw legs at player position
        ctx.save();
        ctx.translate(playerScreenPos.x, playerScreenPos.y);
        ctx.rotate(player.legAngle);
        
        ctx.drawImage(
            characterAtlas,
            legFrame.x * player.visualsize, legFrame.y * player.visualsize,
            player.visualsize, player.visualsize,
            -player.visualsize / 2, -player.visualsize / 2,
            player.visualsize, player.visualsize
        );
        ctx.restore();

        // Render arm & torso sprite rotated towards cursor
        const angle = Math.atan2(mouseY - playerScreenPos.y, mouseX - playerScreenPos.x) - Math.PI / 2;
        ctx.save();
        ctx.translate(playerScreenPos.x, playerScreenPos.y);
        ctx.rotate(angle);

        // Get body frame based on equipped weapon
        const equippedWeapon = weaponList[player.weapons[player.equippedWeapon][0]];
        let frame = bodyFrames.DEFAULT;

        if (equippedWeapon) {
            frame = equippedWeapon.bodyFrame || bodyFrames.DEFAULT;
        }

        const torsoX = frame.x * player.visualsize;
        const torsoY = frame.y * player.visualsize;

        // Draw arms
        ctx.drawImage(
            characterAtlas,
            torsoX, torsoY + player.visualsize, // Arms are in the tile below the torso
            player.visualsize, player.visualsize,
            -player.visualsize / 2, -player.visualsize / 2,
            player.visualsize, player.visualsize
        );

        // Draw torso
        ctx.drawImage(
            characterAtlas,
            torsoX, torsoY,
            player.visualsize, player.visualsize,
            -player.visualsize / 2, -player.visualsize / 2,
            player.visualsize, player.visualsize
        );

         // Draw head
        ctx.drawImage(
            characterAtlas,
            0, 3 * player.visualsize, // Head is in the tile below the arms
            player.visualsize, player.visualsize,
            -player.visualsize / 2, -player.visualsize / 2,
            player.visualsize, player.visualsize
        );

        ctx.restore();

        // Draw Bullets
        bullets.forEach(bullet => {
            // Check bullet lifetime
            bullet.lifetime -= timestep;
            if (bullet.lifetime <= 0) {
                bullets.splice(bullets.indexOf(bullet), 1);
                return;
            }
            
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

        // ====== Layer 2+ ====== //

        // Draw map layers above
        for (let layer = 1; layer < mapVerticalLayers; layer++) {
            drawMap(layer);
        }

        // ====== UI Layer ====== //


        // Simple HUD
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`State: ${state}`, 10, 20);
        ctx.fillText(`FPS: ${Math.round(fps)}`, 10, 40);
        ctx.fillText(`Position: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 60);
        ctx.fillText(`Health: ${Math.round(player.health)}, Weapon: ${player.weapons[player.equippedWeapon][0]}`, 10, 80);
        ctx.fillText('Arrows / WASD to move, Esc to pause', 10, height - 10);
    }



    // Start game on Enter
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && state === State.MENU) {
            state = State.PLAY;
        }
    });

    // Remove duplicate and unused mousemove handler



    window.addEventListener('click', () => {
        // Only shoot if in play state
        if (state === State.PLAY) {
            // Get equipped weapon
            const equippedWeapon = weaponList[player.weapons[player.equippedWeapon][0]]; // Check if weapon exists and has ammo
            if (!equippedWeapon) return; // No weapon equipped

            // convert mouse position to world coordinates
            const worldMouse = screenToWorld(mouseX, mouseY);

            // calculate angle from player to mouse
            const angle = Math.atan2(worldMouse.y - player.y, worldMouse.x - player.x);

            // Calculate spread
            const spread = (Math.random() * equippedWeapon.spread - equippedWeapon.spread / 2);

            // Add bullet with weapon settings
            bullets.push({
                x: (Math.cos(angle) * player.size) + player.x,
                y: (Math.sin(angle) * player.size) + player.y,
                velocityX: Math.cos(angle + spread) * equippedWeapon.speed,
                velocityY: Math.sin(angle + spread) * equippedWeapon.speed,
                size: equippedWeapon.bulletSize || 8,
                color: equippedWeapon.bulletColor || 'rgb(255, 255, 0)',
                damage: equippedWeapon.damage,
                lifetime: equippedWeapon.bulletLifetime || 3 // seconds
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
    function loadAssets() {
        tileAtlas.src = "Assets/Textures/TileAtlas.png";
        decorAtlas.src = "Assets/Textures/DecorAtlas.png";
        waterTexture.src = "Assets/Textures/Water.gif";
        characterAtlas.src = "Assets/Textures/characterTest.png";

        return Promise.resolve();
    }

    // Init
    loadAssets().then(() => {
        lastTime = performance.now();
        requestAnimationFrame(loop);
    });

})();
