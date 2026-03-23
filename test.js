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
    ctx.scale(1, 1);
    ctx.imageSmoothingEnabled = false;


    // Game state
    const State = { MENU: 'menu', PLAY: 'play', PAUSED: 'paused' };
    let state = State.MENU;



    // Groups of Objects so I can Track them and not be annoyed by the fact that I can't track them you understand right?

    const bullets = [];

    const vehicles = [];

    const characters = [];

    const decoration = [];

    const particles = [];




    // Input
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === 'Escape') {
            state = state === State.PLAY ? State.PAUSED : State.PLAY;
        }

        // Zoom controls via keyboard
        if (e.key === '+' || e.key === '=') {
            camera.zoom = Math.min(5, camera.zoom * 1.1);
        } else if (e.key === '-' || e.key === '_') {
            camera.zoom = Math.max(0.01, camera.zoom / 1.1);
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

    // Establish Camera
    const camera = {
        x: 0,
        y: 0,
        zoom: 1, // default zoom (1 = 100%)
    };


    // Simple demo player
    const player = {

        x: 21025,
        y: 20000,
        size: 20,
        visualsize: 48, // For rendering, can be different from hitbox size
        speed: 220, // px/s
        velocityX: 0,
        velocityY: 0,


        // Inventory
        health: 100,
        cash: 0,
        weapons: [['PISTOL', 12], ['BBGUN', 30]], // Value 1: weapon, Value 2: Loaded Ammo
        equippedWeapon: 1,

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
        { x: 0, y: 0, time: 0.2, flipped: false },
        { x: 2, y: 0, time: 0.05, flipped: false },
        { x: 1, y: 0, time: 0.1, flipped: false },

        { x: 0, y: 0, time: 0.2, flipped: false },
        { x: 4, y: 0, time: 0.05, flipped: true },
        { x: 3, y: 0, time: 0.1, flipped: true },


    ];

    //===================//
    // SOUND
    //===================//

    const soundCache = {};
    const soundList = ["wood-break", "wood-hit1", "wood-hit2", "trash-break", "metal-hit1", "metal-hit2",];

    function playSound(name, x, y) {
        if (!soundCache[name]) return; // Sound wasn't loaded

        // Use cloneNode(true) so the same sound can overlap with itself
        const audio = soundCache[name].cloneNode(true);

        const dx = x - player.x;
        const dy = y - player.y;
        const dist = Math.hypot(dx, dy);

        audio.volume = Math.max(0, 1 - dist / 1000);
        audio.play();
    }

    //===================//
    // PARTICLES
    //===================//

    const particleAtlas = new Image();

    const particleVariants = {
        BLOOD: {
            texture: [0, 0], // atlas tile (x, y)

            quantity: [5, 12],
            height: [0, 2],

            lifetime: [1, 3],

            sizeStart: [12, 26],
            sizeEnd: [12, 60],

            transparencyStart: [0, 0.2],
            transparencyEnd: [1, 1],

            speedStart: [3, 20],
            speedEnd: [0, 2],

            randomRotation: true,
        },


        TRASH: {
            texture: [1, 0], // atlas tile (x, y)

            quantity: [3, 4],
            height: [0, 5],

            lifetime: [4, 8],

            sizeStart: [50, 50],
            sizeEnd: [40, 60],

            transparencyStart: [0, 0],
            transparencyEnd: [1, 1],

            speedStart: [10, 20],
            speedEnd: [0, 1],

            randomRotation: true,
        },

        DUST: {
            texture: [2, 0], // atlas tile (x, y)

            quantity: 8,
            height: [0, 2],

            lifetime: [1, 1],

            sizeStart: [1, 1],
            sizeEnd: [400, 400],

            transparencyStart: [0, 0],
            transparencyEnd: [1, 1],

            speedStart: [40, 120],
            speedEnd: [0, 0],

            randomRotation: true,
        },

        EXPLOSION: {
            texture: [3, 0], // atlas tile (x, y)

            quantity: 4,
            height: 3,

            lifetime: [.3, .5],

            sizeStart: 60,
            sizeEnd: 200,

            transparencyStart: [0, 0],
            transparencyEnd: [1, 1],

            speedStart: [20, 50],
            speedEnd: [80, 100],

            randomRotation: true,
        },

        EXPLOSIONDEBRIS: {
            texture: [4, 0], // atlas tile (x, y)

            quantity: 6,
            height: 2,

            lifetime: [.6, 2],

            sizeStart: 99,
            sizeEnd: [900, 700],

            transparencyStart: [0, 0],
            transparencyEnd: [1, 1],

            speedStart: [20, 60],
            speedEnd: [0, 0],

            randomRotation: true,
        },

        WOODDEBRIS: {
            texture: [5, 0], // atlas tile (x, y)

            quantity: 10,
            height: 0,

            lifetime: [12, 15],

            sizeStart: 50,
            sizeEnd: 50,

            transparencyStart: -10,
            transparencyEnd: 1,

            speedStart: [100, 220],
            speedEnd: -6250,

            randomRotation: true,
        },

    };

    function sampleParticleVal(value) {
        if (Array.isArray(value)) {
            return Math.random() * (value[1] - value[0]) + value[0];
        }
        return value;
    }

    function createParticle(variant, x, y) {

        // Get quantity of particles
        const particleCount = Math.floor(sampleParticleVal(variant.quantity || [1, 1]));

        for (let i = 0; i < particleCount; i++) {

            const speedStart = sampleParticleVal(variant.speedStart || [0, 0]);
            const angle = Math.random() * Math.PI * 2;

            particles.push({
                x: x,
                y: y,

                texture: variant.texture,
                lifetime: sampleParticleVal(variant.lifetime),
                age: 0,

                sizeStart: sampleParticleVal(variant.sizeStart || [2, 2]),
                sizeEnd: sampleParticleVal(variant.sizeEnd || [2, 2]),
                size: 0,

                height: sampleParticleVal(variant.height),

                transparencyStart: sampleParticleVal(variant.transparencyStart),
                transparencyEnd: sampleParticleVal(variant.transparencyEnd),

                speedStart: speedStart,
                speedEnd: sampleParticleVal(variant.speedEnd || [0, 0]),

                velocityX: Math.cos(angle) * speedStart,
                velocityY: Math.sin(angle) * speedStart,

                rotation: variant.randomRotation ? Math.random() * Math.PI * 2 : 0
            });
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            p.age += dt;

            // Remove dead particles
            if (p.age >= p.lifetime) {
                particles.splice(i, 1);
                continue;
            }

            const t = p.age / p.lifetime;


            // Size interpolation
            p.size = p.sizeStart + (p.sizeEnd - p.sizeStart) * t;


            // Interpolate speed
            let speed = p.speedStart + (p.speedEnd - p.speedStart) * t;

            // Ensure speed isn't negative
            if (speed < 0) { speed = 0.05 };

            // Normalize velocity direction
            const dirLen = Math.hypot(p.velocityX, p.velocityY) || 1;
            const dirX = p.velocityX / dirLen;
            const dirY = p.velocityY / dirLen;

            p.velocityX = dirX * speed;
            p.velocityY = dirY * speed;

            // Move particle
            p.x += p.velocityX * dt;
            p.y += p.velocityY * dt;

            // Interpolate transparency
            p.transparency =
                p.transparencyStart +
                (p.transparencyEnd - p.transparencyStart) * t;
        }
    }

    function drawParticles(start) {
        // pre-calc world extents for culling
        const halfWorldW = (width / 2) / camera.zoom;
        const halfWorldH = (height / 2) / camera.zoom;
        const marginWorld = 100 / camera.zoom;

        particles.forEach(p => {
            // quick world-space cull
            if (p.x < player.x - halfWorldW - marginWorld || p.x > player.x + halfWorldW + marginWorld ||
                p.y < player.y - halfWorldH - marginWorld || p.y > player.y + halfWorldH + marginWorld) {
                return;
            }

            if ((start === false && p.height === 0) || (start == true && p.height > 0)) return;

            const localPos = worldToScreen(p.x, p.y);
            let screenX = localPos.x;
            let screenY = localPos.y;

            const tileSize = 48;
            const atlasX = p.texture[0] * tileSize;
            const atlasY = p.texture[1] * tileSize;

            // ===== PERSPECTIVE (same idea as tiles) =====
            const z0 = 600;

            // Use particle height (or default to 0)
            const z = (p.height * 20 || 0) * camera.zoom;

            const perspectiveScale = (z + z0) / z0;

            const centerX = width / 2;
            const centerY = height / 2;

            // Center of particle BEFORE scaling
            let centerPX = screenX;
            let centerPY = screenY;

            // Apply perspective shift
            centerPX = (centerPX - centerX) * perspectiveScale + centerX;
            centerPY = (centerPY - centerY) * perspectiveScale + centerY;

            // Scale size with perspective and camera zoom
            const pSize = p.size * perspectiveScale * camera.zoom;

            ctx.save();

            ctx.globalAlpha = 1 - p.transparency;

            ctx.translate(centerPX, centerPY);
            ctx.rotate(p.rotation);

            ctx.drawImage(
                particleAtlas,
                atlasX, atlasY, tileSize, tileSize,
                -pSize / 2,
                -pSize / 2,
                pSize,
                pSize
            );

            ctx.restore();
        });

        ctx.globalAlpha = 1;
    }


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

    weaponAtlas = new Image()

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
            texture: [1, 0],
            bodyFrame: bodyFrames.RIFLE2,
            speed: 1500, // 0 Speed for Hitscan
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
            texture: [2, 0],
            bodyFrame: bodyFrames.PISTOL1, // Pose for holding pistol
            speed: 1500,
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
        // Convert screen (canvas) coords to world coords considering zoom and player center
        return {
            x: (x - width / 2) / camera.zoom + player.x,
            y: (y - height / 2) / camera.zoom + player.y
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
            size: [30, 110], // for hitbox
            hitboxOffset: [5, 0], // Offset from tile center for hitbox
            height: 2, // For rendering layer
            texture: [3, 0],
            midLayerTexture: [2, 0],
            topLayerTexture: [1, 0],

            health: 12,
            destruction: {
                particle: particleVariants.WOODDEBRIS,
                impactSounds: ["wood-hit1", "wood-hit2"],
                sound: "wood-break",
            },

            spawnTiles: ["SIDEWALK"], // Tiles that it can spawn on
            spawnChance: .1, // Chance
            placement: "EDGE", // Placement, can be EDGE, CORNER, 

            neighborMin: 1, // Fewest identical neighbors allowed
            neighborMax: 3, // Most identical neighbors allowed

        },

        TRASHCAN: {
            type: 'TRASHCAN',
            solid: true, // Whether it blocks movement
            size: [26, 26], // for hitbox
            hitboxOffset: [0, 0], // Offset from tile center for hitbox
            height: 1, // For rendering layer
            texture: [5, 0],
            midLayerTexture: [5, 0],
            topLayerTexture: [4, 0],

            health: 10,
            destruction: {
                particle: particleVariants.TRASH,
                impactSounds: ["metal-hit1", "metal-hit2"],
                sound: "trash-break",
            },

            spawnTiles: ["SIDEWALK"], // Tiles that it can spawn on
            spawnChance: .2, // Chance
            placement: "CORNER", // Placement, can be EDGE, CORNER, RANDOM, CENTER 

            neighborMin: 1, // Fewest identical neighbors allowed
            neighborMax: 4, // Most identical neighbors allowed

        },
    };



    function decorate(tileX, tileY) {

        const tileID = map[tileY][tileX];
        const tileInfo = mapTiles[tileID];
        if (!tileInfo) return;

        const tileType = tileID;
        const rand = tileRandom(tileX, tileY);

        // Neighbor checks
        const left = map[tileY][tileX - 1] === tileID;
        const right = map[tileY][tileX + 1] === tileID;
        const up = map[tileY - 1] && map[tileY - 1][tileX] === tileID;
        const down = map[tileY + 1] && map[tileY + 1][tileX] === tileID;

        const neighborCount =
            (left ? 1 : 0) +
            (right ? 1 : 0) +
            (up ? 1 : 0) +
            (down ? 1 : 0);


        // Find valid decorations for this tile
        const validDecor = [];



        for (const key in decorTemplates) {

            const decor = decorTemplates[key];

            if (!decor.spawnTiles.includes(tileType)) continue;
            if (rand >= decor.spawnChance) continue;

            const min = decor.neighborMin ?? 0;
            const max = decor.neighborMax ?? 4;

            if (neighborCount < min || neighborCount > max) continue;

            validDecor.push(decor);
        }

        if (validDecor.length === 0) return;

        // Pick a decoration
        const decor = validDecor[Math.floor(rand * validDecor.length)];

        const openEdges = [];
        if (!left) openEdges.push("left");
        if (!right) openEdges.push("right");
        if (!up) openEdges.push("up");
        if (!down) openEdges.push("down");

        let x = tileX * tileSize + tileSize / 2;
        let y = tileY * tileSize + tileSize / 2;
        let rotation = 0;

        const edgeOffset = tileSize * 0.35;
        const cornerOffset = tileSize * 0.35;

        switch (decor.placement) {

            case "EDGE":
                if (openEdges.length === 0) return;

                const edge = openEdges[Math.floor(rand * openEdges.length)];

                if (edge === "left") {
                    x -= edgeOffset;
                    rotation = Math.PI;
                } else if (edge === "right") {
                    x += edgeOffset;
                } else if (edge === "up") {
                    y -= edgeOffset;
                    rotation = -Math.PI / 2;
                } else if (edge === "down") {
                    y += edgeOffset;
                    rotation = Math.PI / 2;
                }
                break;


            case "CORNER":
                const corners = [
                    [-cornerOffset, -cornerOffset],
                    [cornerOffset, -cornerOffset],
                    [-cornerOffset, cornerOffset],
                    [cornerOffset, cornerOffset]
                ];

                const c = corners[Math.floor(rand * corners.length)];
                x += c[0];
                y += c[1];
                break;


            case "CENTER":
                // already centered
                break;


            case "RANDOM":
                x += (tileRandom(tileX + 11, tileY) - 0.5) * tileSize * 0.8;
                y += (tileRandom(tileX, tileY + 11) - 0.5) * tileSize * 0.8;
                break;
        }

        const decorID = `${tileX},${tileY},${decor.type}`;
        const mod = worldModifications.get(decorID);

        let health = decor.health || 100;
        if (mod?.destroyed) return;

        if (mod?.health !== undefined) {
            health = mod.health;
        };

        decoration.push({

            id: decorID,
            ...decor,
            x,
            y,
            rotation,
            health,

        });
    }

    function generateDecorations() {

        decoration.length = 0;

        const halfWorldW = (width / 2) / camera.zoom;
        const halfWorldH = (height / 2) / camera.zoom;

        const startX = Math.max(0, Math.floor((player.x - halfWorldW) / tileSize));
        const endX = Math.min(map[0].length, Math.ceil((player.x + halfWorldW) / tileSize));
        const startY = Math.max(0, Math.floor((player.y - halfWorldH) / tileSize));
        const endY = Math.min(map.length, Math.ceil((player.y + halfWorldH) / tileSize));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                decorate(x, y);
            }
        }
    }


    function destroyDecor(decor, cause) {
        const def = decorTemplates[decor.type];

        // Save destroyed state
        worldModifications.set(decor.id, {
            destroyed: true
        });

        // Spawn particles
        if (def.destruction?.particle) {
            createParticle(def.destruction.particle, decor.x, decor.y);
        }

        // Play sound (stub for now)
        if (def.destruction?.sound) {
            playSound(def.destruction.sound, decor.x, decor.y);
        }

        // Remove from active list
        const index = decoration.indexOf(decor);
        if (index !== -1) {
            decoration.splice(index, 1);
        }
    }

    function damageDecor(decor, amount, cause = "bullet") {
        decor.health -= amount;

        if (decor.health <= 0) {
            destroyDecor(decor, cause);
        } else {
            // Save partial damage
            worldModifications.set(decor.id, {
                health: decor.health
            });
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

        const sx = (tileCoords[0] * 256);
        const sy = (tileCoords[1] * 256);

        // Perspective Math
        const z0 = 500;
        const z = layer * 60 * camera.zoom;
        const perspectiveScale = (z + z0) / z0;

        // Shift the position relative to screen center
        const centerX = (width / 2);
        const centerY = (height / 2);

        // Calculate the center of the tile to scale from the middle
        let tileCenterX = screenX + 256 / 2 * camera.zoom;
        let tileCenterY = screenY + 256 / 2 * camera.zoom;

        // Apply the parallax shift to the CENTER point
        tileCenterX = (tileCenterX - centerX) * perspectiveScale + centerX;
        tileCenterY = (tileCenterY - centerY) * perspectiveScale + centerY;

        // Match the tile size to the perspective and camera zoom
        const pTileSize = (256 * perspectiveScale) * camera.zoom;

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
        // First Determine visible tiles based on player position and screen size (account for zoom)
        const halfWorldW = (width / 2) / camera.zoom;
        const halfWorldH = (height / 2) / camera.zoom;

        const startX = Math.max(0, Math.floor((player.x - halfWorldW) / tileSize));
        const endX = Math.min(map[0].length, Math.ceil((player.x + halfWorldW) / tileSize));
        const startY = Math.max(0, Math.floor((player.y - halfWorldH) / tileSize));
        const endY = Math.min(map.length, Math.ceil((player.y + halfWorldH) / tileSize));

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
            };
        };
    };

    function drawDecorationHitboxes() {

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2 * camera.zoom;

        decoration.forEach(decor => {

            const decorInfo = decorTemplates[decor.type];
            if (!decorInfo || !decorInfo.solid) return;

            const screenPos = worldToScreen(
                decor.x + decorInfo.hitboxOffset[0],
                decor.y + decorInfo.hitboxOffset[1]
            );

            const w = decorInfo.size[0] * camera.zoom;
            const h = decorInfo.size[1] * camera.zoom;

            ctx.save();

            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(decor.rotation || 0);

            ctx.strokeRect(
                -w / 2,
                -h / 2,
                w,
                h
            );

            ctx.restore();
        });
    }

    function drawDecorations() {
        decoration.forEach(decor => {
            // world-space culling for decorations
            const halfWorldW = (width / 2) / camera.zoom;
            const halfWorldH = (height / 2) / camera.zoom;
            if (decor.x < player.x - halfWorldW - 200 || decor.x > player.x + halfWorldW + 200 ||
                decor.y < player.y - halfWorldH - 200 || decor.y > player.y + halfWorldH + 200) return;

            const screenPos = worldToScreen(decor.x, decor.y);
            const decorInfo = decorTemplates[decor.type];
            if (!decorInfo) return;

            for (let layer = 0; layer <= decorInfo.height; layer++) {

                let tileCoords;
                if (layer === 0) {
                    tileCoords = decorInfo.texture;
                } else if (layer < decorInfo.height && decorInfo.midLayerTexture) {
                    tileCoords = decorInfo.midLayerTexture;
                } else if (layer === decorInfo.height && decorInfo.topLayerTexture) {
                    tileCoords = decorInfo.topLayerTexture;
                } else {
                    continue;
                }

                const sx = tileCoords[0] * decorationRes;
                const sy = tileCoords[1] * decorationRes;

                // Perspective math
                const z0 = 800;
                const z = layer * 20 * camera.zoom;
                const perspectiveScale = (z + z0) / z0;

                const centerX = width / 2;
                const centerY = height / 2;

                let decorCenterX = screenPos.x;
                let decorCenterY = screenPos.y;

                decorCenterX = (decorCenterX - centerX) * perspectiveScale + centerX;
                decorCenterY = (decorCenterY - centerY) * perspectiveScale + centerY;

                const pTileSize = decorationRes * perspectiveScale * camera.zoom;

                ctx.save();

                // Move origin to the decoration center
                ctx.translate(decorCenterX, decorCenterY);

                // Apply rotation if it exists
                ctx.rotate(decor.rotation || 0);

                // Draw centered
                ctx.drawImage(
                    decorAtlas,
                    sx, sy,
                    decorationRes, decorationRes,
                    -pTileSize / 2,
                    -pTileSize / 2,
                    pTileSize,
                    pTileSize
                );

                ctx.restore();
            }
        });
    }

    // Worldspace to screenspace conversion
    function worldToScreen(x, y) {
        return {
            x: Math.floor((x - player.x) * camera.zoom + width / 2),
            y: Math.floor((y - player.y) * camera.zoom + height / 2)
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

    // Functions for world destruction
    function createExplosion(x, y, destructive) {
        createParticle(particleVariants.DUST, x, y);
        createParticle(particleVariants.EXPLOSION, x, y);
        createParticle(particleVariants.EXPLOSIONDEBRIS, x, y);
    };

    // Decoration check
    function checkDecorationCollision(decor, x, y, radius) {
        if (!decor.solid) return false;

        const halfW = decor.size[0] / 2;
        const halfH = decor.size[1] / 2;

        const dx = x - (decor.x + decor.hitboxOffset[0]);
        const dy = y - (decor.y + decor.hitboxOffset[1]);

        const rot = decor.rotation || 0;

        const cos = Math.cos(-rot);
        const sin = Math.sin(-rot);

        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        return (
            localX > -halfW - radius &&
            localX < halfW + radius &&
            localY > -halfH - radius &&
            localY < halfH + radius
        );
    }

    function update(dt) {
        if (state !== State.PLAY) return;
        let vx = 0, vy = 0;
        if (keys.ArrowLeft || keys.a) vx -= 1;
        if (keys.ArrowRight || keys.d) vx += 1;
        if (keys.ArrowUp || keys.w) vy -= 1;
        if (keys.ArrowDown || keys.s) vy += 1;
        const len = Math.hypot(vx, vy) || 1;


        updateParticles(dt);


        const checkCollision = (x, y) => {
            const tileX = Math.floor(x / tileSize);
            const tileY = Math.floor(y / tileSize);

            // 1. Map Boundary & Solid Tile Check
            if (tileY < 0 || tileY >= map.length || tileX < 0 || tileX >= map[0].length) {
                return true;
            }

            const tile = mapTiles[map[tileY][tileX]];
            if (tile && tile.solid) return true;

            // 2. Decoration collision - Loop through active decorations
            for (let i = 0; i < decoration.length; i++) {
                const decor = decoration[i];

                // Only check if the decoration is solid
                if (decor.solid) {
                    // Pass the decor object, the coordinates to check, and player radius
                    if (checkDecorationCollision(decor, x, y, player.size / 2)) {
                        return true;
                    }
                }
            }

            return false;
        };


        // Update Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];

            bullet.x += bullet.velocityX * timestep;
            bullet.y += bullet.velocityY * timestep;

            for (const decor of decoration) {

                if (!decor.solid) continue;

                if (checkDecorationCollision(decor, bullet.x, bullet.y, bullet.size)) {
                    damageDecor(decor, bullet.damage, "bullet");
                    // Play random damage sound
                    playSound(decor.destruction.impactSounds[Math.floor(Math.random() * decor.destruction.impactSounds.length)], decor.x, decor.y)

                    bullets.splice(i, 1);
                    break;
                }
            }
        }


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


        // Lower Particles
        drawParticles(true);


        // Add decoration or NPCs on drawn tiles
        drawDecorations();

        // Test Rendering
        // drawDecorationHitboxes();



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

        const vs = player.visualsize * camera.zoom;

        ctx.drawImage(
            characterAtlas,
            legFrame.x * player.visualsize, legFrame.y * player.visualsize,
            player.visualsize, player.visualsize,
            -vs / 2, -vs / 2,
            vs, vs
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
            -vs / 2, -vs / 2,
            vs, vs
        );


        // Draw weapon
        if (equippedWeapon) {

            const weaponX = equippedWeapon.texture[0] * player.visualsize;
            const weaponY = equippedWeapon.texture[1] * player.visualsize;

            ctx.drawImage(
                weaponAtlas,
                weaponX, weaponY,
                player.visualsize, player.visualsize,
                -vs / 2, -vs / 2,
                vs, vs
            );

        }

        // Draw torso
        ctx.drawImage(
            characterAtlas,
            torsoX, torsoY,
            player.visualsize, player.visualsize,
            -vs / 2, -vs / 2,
            vs, vs
        );

        // Draw head
        ctx.drawImage(
            characterAtlas,
            0, 3 * player.visualsize, // Head is in the tile below the arms
            player.visualsize, player.visualsize,
            -vs / 2, -vs / 2,
            vs, vs
        );

        ctx.restore();

        // Draw Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];

            // Check bullet lifetime
            bullet.lifetime -= timestep;
            if (bullet.lifetime <= 0) {
                bullets.splice(i, 1);
                continue;
            }

            // world-space cull
            const halfWorldW = (width / 2) / camera.zoom;
            const halfWorldH = (height / 2) / camera.zoom;
            if (bullet.x < player.x - halfWorldW - 50 || bullet.x > player.x + halfWorldW + 50 ||
                bullet.y < player.y - halfWorldH - 50 || bullet.y > player.y + halfWorldH + 50) {
                continue; // Skip drawing off-screen bullets
            }

            // Check if bullet should be on screen
            const screenPos = worldToScreen(bullet.x, bullet.y);
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, (bullet.size / 2) * camera.zoom, 0, Math.PI * 2);
            ctx.fill();
        }


        // Upper Particles
        drawParticles(false);





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
            // Test Particles
            const testPose = screenToWorld(Math.random() * width, Math.random() * height)
            createExplosion(testPose.x, testPose.y)


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

    // Mouse wheel zoom
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        const zoomFactor = Math.pow(1.2, -delta);
        camera.zoom = Math.max(0.06, Math.min(2
            , camera.zoom * zoomFactor));
    }, { passive: false });


    function loop(now) {
        // Calculate delta time
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        accumulator += delta;



        // Update in fixed steps
        while (accumulator >= timestep) {
            generateDecorations();

            update(timestep);
            accumulator -= timestep;
        }

        // Render
        render();


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

    // Load sound & images
    function loadAssets() {
        const loadImage = (img, src) => {
            return new Promise((resolve) => {
                img.onload = () => resolve();
                img.src = src;
            });
        };

        const loadSound = (name) => {
            return new Promise((resolve) => {
                const audio = new Audio(`Assets/Sounds/${name}.wav`);
                audio.oncanplaythrough = () => {
                    soundCache[name] = audio;
                    resolve();
                };
                audio.load(); // Force the browser to start downloading
            });
        };

        // Create a list of all loading promises
        const assetPromises = [
            loadImage(tileAtlas, "Assets/Textures/TileAtlas.png"),
            loadImage(decorAtlas, "Assets/Textures/DecorAtlas.png"),
            loadImage(waterTexture, "Assets/Textures/Water.gif"),
            loadImage(characterAtlas, "Assets/Textures/characterTest.png"),
            loadImage(weaponAtlas, "Assets/Textures/WeaponAtlas.png"),
            loadImage(particleAtlas, "Assets/Textures/ParticleAtlas.png"),
            ...soundList.map(name => loadSound(name))
        ];

        return Promise.all(assetPromises);
    }

    // Init
    loadAssets().then(() => {
        lastTime = performance.now();
        requestAnimationFrame(loop);
    });

})();
