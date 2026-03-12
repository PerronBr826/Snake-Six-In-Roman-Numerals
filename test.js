// Bryce Perron
// Snake VI, Sequel to Snake IV
// 3/11/2026
(() => {
    // Simple browser-game template
    const canvas = document.getElementById('gameCanvas').appendChild(document.createElement('canvas'));
    const ctx = canvas.getContext('2d');
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(canvas);

    // Screen Size'
    const width = 640;
    const height = 480;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    ctx.imageSmoothingEnabled = false;


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
        mouseX = ((event.clientX - rect.left) * (canvas.width / rect.width)) / dpr;
        mouseY = ((event.clientY - rect.top) * (canvas.height / rect.height)) / dpr;
    });

    let mouseX = 0;
    let mouseY = 0;

    // Simple demo player
    const player = {
        x: 100,
        y: 100,
        size: 24,
        speed: 220 // px/s
    };

    // Groups of Objects so I can Track them and not be annoyed by the fact that I can't track them you understand right?

    const bullets = [];

    const vehicles = [];

    const characters = [];


    // Map Layout

    const map = [];
    const tileSize = 64;
    const mapWidth = Math.floor(width / tileSize);
    const mapHeight = Math.floor(height / tileSize);
    for (let y = 0; y < mapHeight; y++) {
        map[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            map[y][x] = Math.random() < 0.1 ? 1 : 0; // Random walls
        }
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
        player.x += (vx / len) * player.speed * dt;
        player.y += (vy / len) * player.speed * dt;

    }

    function render() {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        // Clear
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(0, 0, w, h);

        // UI / state screens
        if (state === State.MENU) {
            ctx.fillStyle = '#fff';
            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Demo Game Template', w / 2, h / 2 - 24);
            ctx.font = '16px sans-serif';
            ctx.fillText('Press Enter to Start', w / 2, h / 2 + 8);
            return;
        }

        // Draw Map
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                ctx.fillStyle = map[y][x] === 1 ? '#555' : '#222';
                ctx.fillRect((-player.x + (x * tileSize) + width/2), (-player.y + (y * tileSize) + height/2), tileSize, tileSize);
            }
        }

        // Draw player
        ctx.fillStyle = '#4ee';
        ctx.beginPath();
        ctx.arc(width/2, height/2, player.size / 2, 0, Math.PI * 2);
        ctx.fill();

        

        // Draw Bullets
        bullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.size / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Player's Weapon
        ctx.fillStyle = '#4ee';


        // Simple HUD
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`State: ${state}`, 10, 20);
        ctx.fillText(`FPS: ${Math.round(fps)}`, 10, 40);
        ctx.fillText('Arrows / WASD to move, Esc to pause', 10, h - 10);
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
        console.log(`Mouse position: X = ${mouseX}, Y = ${mouseY}`);
    });

        

    window.addEventListener('click', (e) => {
        if (state === State.PLAY) {
            // get mouse position and rotation from character's position
            const angle = Math.atan2(mouseY - player.y, mouseX - player.x);

            const bulletspeed = 800;
            const bulletspread = 0.1;

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
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        accumulator += delta;

        // Update in fixed steps
        while (accumulator >= timestep) {
            update(timestep);
            accumulator -= timestep;
        }

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
        // returns promise that resolves when all assets loaded
        // placeholder for images/sounds
        return Promise.resolve();
    }

    // Init
    loadAssets().then(() => {
        lastTime = performance.now();
        requestAnimationFrame(loop);
    });

})();
