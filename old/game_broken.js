// Define colors based on a more colorful retro palette
const COLORS = {
    black: '#0f0f0f',
    darkBlue: '#0f3b5f',
    blue: '#306baf',
    lightBlue: '#70a4cc',
    red: '#e53b44',
    yellow: '#ffe762',
    orange: '#ff9b44',
    purple: '#8e478c',
    gray: '#3a4466',
    white: '#f2f1f0',
    lightGreen: '#78dc52',
    bg: '#4c6885'
};

// Constants
const GRAVITY = 800;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Game state variables
let keys = {};
let gameState = 'start_screen';
let stage = 1;
let canvas, ctx;
let player, platforms, enemies, projectiles, particles;
let lastTime = 0;
let stageBonuses = { time: 0, health: 0 };

// Initialize the game
function initGame() {
    // Setup canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize keys object
    window.keys = keys = {};
    
    // Set up event listeners for keyboard
    window.addEventListener('keydown', function(e) {
        keys[e.key] = true;
    });
    
    window.addEventListener('keyup', function(e) {
        keys[e.key] = false;
    });
    
    // Initialize game objects
    resetGame();
    
    // Start game loop
    lastTime = performance.now();
    update();
}

// Load a specific stage
function loadStage(stageNum) {
    // Clear existing entities
    platforms = [];
    enemies = [];
    projectiles = [];
    particles = [];
    
    // Set up platforms
    switch(stageNum) {
        case 1:
            // Stage 1: Basic level with some platforms
            
            // Ground
            platforms.push({
                x: 0,
                y: GAME_HEIGHT - 40,
                width: GAME_WIDTH,
                height: 40,
                type: 'normal'
            });
            
            // Platforms
            platforms.push({
                x: 100,
                y: GAME_HEIGHT - 120,
                width: 200,
                height: 20,
                type: 'normal'
            });
            
            platforms.push({
                x: 400,
                y: GAME_HEIGHT - 180,
                width: 200,
                height: 20,
                type: 'normal'
            });
            
            platforms.push({
                x: 650,
                y: GAME_HEIGHT - 150,
                width: 150,
                height: 20,
                type: 'normal'
            });
            
            // Walls for wall jumping
            platforms.push({
                x: 300,
                y: GAME_HEIGHT - 220,
                width: 20,
                height: 100,
                type: 'normal'
            });
            
            platforms.push({
                x: 600,
                y: GAME_HEIGHT - 220,
                width: 20,
                height: 100,
                type: 'normal'
            });
            
            // Add basic enemies
            enemies.push({
                x: 150,
                y: GAME_HEIGHT - 160,
                width: 30,
                height: 40,
                type: 'patrol',
                health: 1,
                speed: 50,
                direction: 1,
                frameX: 0
            });
            
            enemies.push({
                x: 450,
                y: GAME_HEIGHT - 220,
                width: 30,
                height: 40,
                type: 'jumper',
                health: 1,
                jumpTimer: 2,
                jumpStrength: 300,
                dy: 0,
                frameX: 0
            });
            
            break;
            
        case 2:
            // Stage 2: More complex level with more enemies
            
            // Ground with gaps
            platforms.push({
                x: 0,
                y: GAME_HEIGHT - 40,
                width: 300,
                height: 40,
                type: 'normal'
            });
            
            platforms.push({
                x: 400,
                y: GAME_HEIGHT - 40,
                width: 400,
                height: 40,
                type: 'normal'
            });
            
            // Platforms
            platforms.push({
                x: 150,
                y: GAME_HEIGHT - 140,
                width: 150,
                height: 20,
                type: 'normal'
            });
            
            platforms.push({
                x: 50,
                y: GAME_HEIGHT - 240,
                width: 100,
                height: 20,
                type: 'normal'
            });
            
            platforms.push({
                x: 400,
                y: GAME_HEIGHT - 160,
                width: 150,
                height: 20,
                type: 'normal'
            });
            
            platforms.push({
                x: 600,
                y: GAME_HEIGHT - 200,
                width: 200,
                height: 20,
                type: 'normal'
            });
            
            // Walls
            platforms.push({
                x: 300,
                y: GAME_HEIGHT - 200,
                width: 20,
                height: 160,
                type: 'normal'
            });
            
            // Add more enemies
            enemies.push({
                x: 200,
                y: GAME_HEIGHT - 180,
                width: 30,
                height: 40,
                type: 'patrol',
                health: 1,
                speed: 60,
                direction: 1,
                frameX: 0
            });
            
            enemies.push({
                x: 450,
                y: GAME_HEIGHT - 200,
                width: 30,
                height: 40,
                type: 'jumper',
                health: 1,
                jumpTimer: 2,
                jumpStrength: 350,
                dy: 0,
                frameX: 0
            });
            
            enemies.push({
                x: 650,
                y: GAME_HEIGHT - 240,
                width: 30,
                height: 40,
                type: 'shooter',
                health: 2,
                shootTimer: 2,
                direction: -1,
                frameX: 0
            });
            
            break;
            
        case 3:
            // Stage 3: Boss stage
            
            // Ground
            platforms.push({
                x: 0,
                y: GAME_HEIGHT - 40,
                width: GAME_WIDTH,
                height: 40,
                type: 'normal'
            });
            
            // Platforms
            platforms.push({
                x: 150,
                y: GAME_HEIGHT - 150,
                width: 150,
                height: 20,
                type: 'normal'
            });
            
            platforms.push({
                x: 500,
                y: GAME_HEIGHT - 150,
                width: 150,
                height: 20,
                type: 'normal'
            });
            
            // Boss
            enemies.push({
                x: 550,
                y: GAME_HEIGHT - 240,
                width: 60,
                height: 80,
                type: 'boss',
                health: 5,
                attackTimer: 3,
                attackPattern: 0,
                jumpStrength: 400,
                dy: 0,
                speed: 100,
                direction: -1,
                frameX: 0
            });
            
            break;
    }
    
    // Reset player position
    player.x = 50;
    player.y = GAME_HEIGHT - 200;
    player.health = player.maxHealth;
}

// Basic game loop
function update() {
    // Request next frame
    requestAnimationFrame(update);
    
    // Get time since last frame
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // Convert to seconds
    lastTime = now;
    
    // Process input
    handleInput(dt);
    
    // Clear canvas
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw based on game state
    if (gameState === 'playing') {
        // Update game physics
        updatePhysics(dt);
        
        // Update player state
        updatePlayerState(dt);
        
        // Update entities
        updateEntities(dt);
        
        // Collision detection
        detectCollisions();
        
        // Draw background
        drawBackground();
        
        // Draw platforms
        platforms.forEach(platform => {
            drawPlatform(platform);
        });
        
        // Draw enemies
        enemies.forEach(enemy => {
            drawEnemy(enemy);
        });
        
        // Draw projectiles
        projectiles.forEach(projectile => {
            drawProjectile(projectile);
        });
        
        // Draw player
        drawPlayer();
        
        // Draw particles
        particles.forEach(particle => {
            drawParticle(particle);
        });
        
        // Draw UI elements
        drawUI();
        
        // Check for level completion
        if (player.x > canvas.width - 50 && enemies.length === 0) {
            completeLevel();
        }
        
        // Check for player death
        if (player.health <= 0) {
            gameState = 'game_over';
        }
    }
    
    // Always draw game messages (handles different game states)
    drawGameMessages();
}

// Function to draw a platform
function drawPlatform(platform) {
    ctx.fillStyle = platform.type === 'spikes' ? COLORS.red : COLORS.darkBlue;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Add highlights
    ctx.fillStyle = platform.type === 'spikes' ? COLORS.orange : COLORS.blue;
    ctx.fillRect(platform.x, platform.y, platform.width, 5);
    
    // Add decoration based on type
    if (platform.type === 'spikes') {
        // Draw spikes
        ctx.fillStyle = COLORS.red;
        const spikeWidth = 10;
        const spikeCount = Math.floor(platform.width / spikeWidth);
        
        for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            ctx.moveTo(platform.x + i * spikeWidth, platform.y);
            ctx.lineTo(platform.x + (i + 0.5) * spikeWidth, platform.y - 10);
            ctx.lineTo(platform.x + (i + 1) * spikeWidth, platform.y);
            ctx.fill();
        }
    }
}

// Function to reset the game state for a new game
function resetGame() {
    // Create player
    player = {
        x: 50,
        y: 200,
        width: 30,
        height: 50,
        dx: 0,
        dy: 0,
        speed: 200,
        jumpStrength: 400,
        health: 6,
        maxHealth: 6,
        score: 0,
        state: 'idle',
        facing: 1,
        canJump: true,
        attacking: false,
        attackTimer: 0,
        invulnerable: 0,
        wallSliding: false
    };
    
    // Initialize collections
    platforms = [];
    enemies = [];
    projectiles = [];
    particles = [];
    
    // Set up the stage
    stage = 1;
    loadStage(stage);
}

// Draw background elements
function drawBackground() {
    // Backgrounds for different stages
    const backgrounds = {
        1: {
            skyColor: COLORS.lightBlue,
            groundColor: COLORS.darkBlue,
            elementColor: COLORS.blue,
            hasStars: true
        },
        2: {
            skyColor: COLORS.purple,
            groundColor: COLORS.gray,
            elementColor: COLORS.darkBlue,
            hasStars: true
        },
        3: {
            skyColor: COLORS.black,
            groundColor: COLORS.darkBlue,
            elementColor: COLORS.red,
            hasStars: true,
            hasMoon: true
        }
    };
    
    const bg = backgrounds[stage] || backgrounds[1];
    
    // Background gradient (sky)
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, bg.skyColor);
    gradient.addColorStop(1, bg.groundColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Stars
    if (bg.hasStars) {
        ctx.fillStyle = COLORS.white;
        // Use a predictable pattern for stars
        for (let i = 0; i < 30; i++) {
            const x = (i * 71) % GAME_WIDTH;
            const y = (i * 47) % (GAME_HEIGHT / 2);
            const size = ((i % 3) + 1);
            ctx.fillRect(x, y, size, size);
        }
    }
    
    // Moon
    if (bg.hasMoon) {
        ctx.fillStyle = COLORS.yellow;
        ctx.beginPath();
        ctx.arc(100, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon craters
        ctx.fillStyle = bg.skyColor;
        ctx.beginPath();
        ctx.arc(110, 70, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(80, 90, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Cityscape silhouette
    ctx.fillStyle = COLORS.black;
    
    // Draw buildings
    for (let i = 0; i < 10; i++) {
        const buildingWidth = 60 + (i * 20) % 40;
        const buildingHeight = 100 + (i * 30) % 120;
        const x = i * 100 - 20;
        
        // Building silhouette
        ctx.fillRect(x, GAME_HEIGHT - buildingHeight, buildingWidth, buildingHeight);
        
        // Windows (lit up)
        ctx.fillStyle = COLORS.yellow;
        const windowSize = 5;
        const windowSpacing = 15;
        
        for (let wy = 0; wy < Math.floor(buildingHeight / windowSpacing) - 1; wy++) {
            for (let wx = 0; wx < Math.floor(buildingWidth / windowSpacing); wx++) {
                // Only draw some windows (random pattern but consistent)
                if ((wx + wy + i) % 3 !== 0) {
                    ctx.fillRect(
                        x + wx * windowSpacing + 5,
                        GAME_HEIGHT - buildingHeight + wy * windowSpacing + 15,
                        windowSize,
                        windowSize
                    );
                }
            }
        }
        
        ctx.fillStyle = COLORS.black;
    }
}

// Function to initialize the game on load
window.onload = function() {
    // Set initial game state to start screen
    gameState = 'start_screen';
    
        ctx.beginPath();
        ctx.arc(0, 0, size/6, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Enemy projectile (arrows, energy bolts)
        ctx.fillStyle = COLORS.white;
        
        const width = projectile.width;
        const height = projectile.height;
        const x = projectile.x;
        const y = projectile.y;
        
        if (projectile.type === 'arrow') {
            // Draw arrow 
            ctx.beginPath();
            
            // Arrow direction based on trajectory
            if (projectile.dx > 0) {
                // Arrow flying right
                // Arrow shaft
                ctx.fillRect(x, y + height/3, width * 0.7, height/3);
                
                // Arrowhead
                ctx.moveTo(x + width * 0.7, y);
                ctx.lineTo(x + width, y + height/2);
                ctx.lineTo(x + width * 0.7, y + height);
                ctx.closePath();
                ctx.fill();
                
                // Feathers
                ctx.fillRect(x, y, width * 0.2, height/5);
                ctx.fillRect(x, y + height - height/5, width * 0.2, height/5);
            } else {
                // Arrow flying left
                // Arrow shaft
                ctx.fillRect(x + width * 0.3, y + height/3, width * 0.7, height/3);
                
                // Arrowhead
                ctx.moveTo(x + width * 0.3, y);
                ctx.lineTo(x, y + height/2);
                ctx.lineTo(x + width * 0.3, y + height);
                ctx.closePath();
                ctx.fill();
                
                // Feathers
                ctx.fillRect(x + width * 0.8, y, width * 0.2, height/5);
                ctx.fillRect(x + width * 0.8, y + height - height/5, width * 0.2, height/5);
            }
        } else if (projectile.type === 'energy') {
            // Energy projectile for boss
            ctx.fillStyle = COLORS.white;
            
            // Pulsating effect
            const pulseSize = Math.sin(projectile.lifetime * 0.3) * 2;
            
            // Multiple layers for energy ball effect
            ctx.fillRect(x, y, width, height);
            
            // Inner detail
            ctx.fillStyle = COLORS.black;
            ctx.fillRect(x + width/4, y + height/4, width/2, height/2);
            
            // Outer flare effects - small rectangles around the energy ball
            ctx.fillStyle = COLORS.white;
            
            // Top flare
            ctx.fillRect(x + width/2 - 1, y - pulseSize, 2, pulseSize);
            // Bottom flare
            ctx.fillRect(x + width/2 - 1, y + height, 2, pulseSize);
            // Left flare
            ctx.fillRect(x - pulseSize, y + height/2 - 1, pulseSize, 2);
            // Right flare
            ctx.fillRect(x + width, y + height/2 - 1, pulseSize, 2);
        }
    }
    
    ctx.restore();
}

function drawUI() {
    // Top bar with score and stage info
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, canvas.width, 30);
    
    // Border for UI panel
    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, 30);
    
    // Score display
    ctx.fillStyle = COLORS.black;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${player.score.toString().padStart(6, '0')}`, 10, 20);
    
    // Stage display
    ctx.textAlign = 'right';
    ctx.fillText(`STAGE: ${stage}`, canvas.width - 10, 20);
    
    // Bottom UI bar (only on boss stages)
    if (stage === 3) {
        // Boss health bar at bottom
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        
        ctx.strokeStyle = COLORS.black;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, canvas.height - 20, canvas.width, 20);
        
        // Find boss enemy
        const boss = enemies.find(e => e.type === 'boss');
        
        if (boss) {
            // Boss name
            ctx.fillStyle = COLORS.black;
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('BOSS:', 10, canvas.height - 6);
            
            // Health meter
            const maxBossHealth = 5;
            const healthBarWidth = 200;
            const healthPercent = boss.health / maxBossHealth;
            
            ctx.fillStyle = COLORS.white;
            ctx.fillRect(70, canvas.height - 15, healthBarWidth, 10);
            
            ctx.strokeStyle = COLORS.black;
            ctx.strokeRect(70, canvas.height - 15, healthBarWidth, 10);
            
            ctx.fillStyle = COLORS.black;
            ctx.fillRect(70, canvas.height - 15, healthBarWidth * healthPercent, 10);
        }
    }
    
    // Make sure to also show player health
    drawPlayerHealth();
}

function drawPlayerHealth() {
    // Player health as classic NES-style blocks
    const blockSize = 10;
    const blockSpacing = 12;
    const topMargin = 40;
    
    // LIFE label
    ctx.fillStyle = COLORS.white;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LIFE:', 10, topMargin);
    
    // Health blocks
    for (let i = 0; i < player.maxHealth; i++) {
        ctx.fillStyle = i < player.health ? COLORS.white : COLORS.darkGray;
        ctx.fillRect(60 + (i * blockSpacing), topMargin - blockSize, blockSize, blockSize);
        ctx.strokeStyle = COLORS.black;
        ctx.strokeRect(60 + (i * blockSpacing), topMargin - blockSize, blockSize, blockSize);
    }
}

function drawGameOver() {
    ctx.fillStyle = COLORS.darkest;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME_WIDTH/2, GAME_HEIGHT/2 - 10);
    ctx.font = '8px Arial';
    ctx.fillText('PRESS ENTER TO RESTART', GAME_WIDTH/2, GAME_HEIGHT/2 + 10);
    ctx.textAlign = 'left';
}

function drawStageComplete() {
    ctx.fillStyle = COLORS.darkest;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE ' + stage + ' COMPLETE!', GAME_WIDTH/2, GAME_HEIGHT/2 - 10);
    ctx.font = '8px Arial';
    ctx.fillText('PRESS ENTER TO CONTINUE', GAME_WIDTH/2, GAME_HEIGHT/2 + 10);
    ctx.textAlign = 'left';
}

function drawGameCompleted() {
    ctx.fillStyle = COLORS.darkest;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CONGRATULATIONS!', GAME_WIDTH/2, GAME_HEIGHT/2 - 15);
    ctx.fillText('YOU COMPLETED THE GAME!', GAME_WIDTH/2, GAME_HEIGHT/2);
    ctx.font = '8px Arial';
    ctx.fillText('FINAL SCORE: ' + score, GAME_WIDTH/2, GAME_HEIGHT/2 + 15);
    ctx.textAlign = 'left';
}

// Draw stage background
function drawBackground() {
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT - 20);
    gradient.addColorStop(0, COLORS.black);
    gradient.addColorStop(1, COLORS.darkGray);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT - 20);
    
    // Draw cityscape background
    const bgOffset = (player.x * backgrounds.city.scrollSpeed) % GAME_WIDTH;
    
    // Draw moon
    const moon = backgrounds.city.moon;
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(moon.x - bgOffset/2, moon.y, moon.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw moon details
    ctx.fillStyle = COLORS.lightGray;
    ctx.beginPath();
    ctx.arc(moon.x - bgOffset/2 - 3, moon.y - 3, moon.radius / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw buildings
    ctx.fillStyle = COLORS.black;
    for (const building of backgrounds.city.buildings) {
        // Draw each building twice for seamless scrolling
        for (let i = -1; i <= 1; i++) {
            const x = (building.x - bgOffset) % GAME_WIDTH + (i * GAME_WIDTH);
            if (x < -building.width || x > GAME_WIDTH) continue;
            
            // Building silhouette
            ctx.fillRect(x, building.y, building.width, building.height);
            
            // Windows
            ctx.fillStyle = COLORS.white;
            for (let wx = x + 2; wx < x + building.width - 2; wx += 5) {
                for (let wy = building.y + 5; wy < building.y + building.height - 5; wy += 8) {
                    if (Math.random() > 0.3) { // Some windows are lit
                        ctx.fillRect(wx, wy, 3, 4);
                    }
                }
            }
            ctx.fillStyle = COLORS.black;
        }
    }
    
    // Draw ground
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);
    
    // Add horizontal lines to ground
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 2);
    ctx.fillRect(0, GAME_HEIGHT - 10, GAME_WIDTH, 1);
}

// Initialize and start game
setupTouchControls();
initializeStages();
update();

function drawGameMessages() {
    if (gameState === 'game_over') {
        // Classic GameBoy-style Game Over screen
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Game Over text
        ctx.fillStyle = COLORS.white;
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
        
        // Score display
        ctx.font = '16px monospace';
        ctx.fillText(`FINAL SCORE: ${player.score.toString().padStart(6, '0')}`, canvas.width/2, canvas.height/2 + 20);
        
        // Continue text that blinks
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillText('PRESS SPACE TO CONTINUE', canvas.width/2, canvas.height/2 + 60);
        }
        
        // Draw ninja silhouette
        drawNinjaSilhouette(canvas.width/2 - 20, canvas.height/2 - 80, 40, 40);
    } else if (gameState === 'level_complete') {
        // Level complete overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Stage Complete text
        ctx.fillStyle = COLORS.white;
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${stage} COMPLETE!`, canvas.width/2, canvas.height/2 - 40);
        
        // Score bonuses
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('TIME BONUS: ', canvas.width/2 - 150, canvas.height/2 + 20);
        ctx.textAlign = 'right';
        ctx.fillText(`${stageBonuses.time}`, canvas.width/2 + 150, canvas.height/2 + 20);
        
        ctx.textAlign = 'left';
        ctx.fillText('HEALTH BONUS: ', canvas.width/2 - 150, canvas.height/2 + 50);
        ctx.textAlign = 'right';
        ctx.fillText(`${stageBonuses.health}`, canvas.width/2 + 150, canvas.height/2 + 50);
        
        ctx.textAlign = 'left';
        ctx.fillText('TOTAL SCORE: ', canvas.width/2 - 150, canvas.height/2 + 90);
        ctx.textAlign = 'right';
        ctx.fillText(`${player.score}`, canvas.width/2 + 150, canvas.height/2 + 90);
        
        // Continue text
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.textAlign = 'center';
            ctx.fillText('PRESS SPACE TO CONTINUE', canvas.width/2, canvas.height - 50);
        }
        
        // Draw two ninja silhouettes in victory pose
        drawNinjaVictoryPose(canvas.width/2 - 80, canvas.height/2 - 120);
        drawNinjaVictoryPose(canvas.width/2 + 30, canvas.height/2 - 120);
    } else if (gameState === 'start_screen') {
        // Title screen
        // Background fill
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw cityscape background
        drawBackground();
        
        // Title text with shadow
        ctx.fillStyle = COLORS.black;
        ctx.font = '46px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SHADOW NINJA', canvas.width/2 + 3, canvas.height/3 + 3);
        
        ctx.fillStyle = COLORS.white;
        ctx.fillText('SHADOW NINJA', canvas.width/2, canvas.height/3);
        
        // Ninja character in action pose
        drawNinjaActionPose(canvas.width/2 - 80, canvas.height/2);
        
        // Instructions
        ctx.font = '18px monospace';
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'center';
        
        // Controls info
        const instructions = [
            'CONTROLS:',
            'Arrow Keys: Move',
            'Z: Jump',
            'X: Attack',
            'Press SPACE to Start'
        ];
        
        for (let i = 0; i < instructions.length; i++) {
            ctx.fillText(instructions[i], canvas.width/2 + 100, canvas.height/2 + i * 30);
        }
        
        // Blinking Press Start text
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.font = '24px monospace';
            ctx.fillText('PRESS SPACE TO START', canvas.width/2, canvas.height - 60);
        }
    }
}

// Helper function to draw ninja silhouette for Game Over screen
function drawNinjaSilhouette(x, y, width, height) {
    ctx.fillStyle = COLORS.black;
    
    // Kneeling ninja silhouette
    // Body
    ctx.fillRect(x, y + height/3, width/2, height/2);
    
    // Head
    ctx.fillRect(x, y, width/2, height/3);
    
    // Sword (pointing down)
    ctx.fillRect(x + width/4, y - height/4, width/10, height/2);
    
    // Arms
    ctx.fillRect(x + width/2, y + height/3, width/4, height/10);
    
    // Legs
    ctx.fillRect(x + width/6, y + height*2/3, width/3, height/3);
}

// Helper function to draw ninja victory pose for Level Complete screen
function drawNinjaVictoryPose(x, y) {
    const width = 40;
    const height = 60;
    
    ctx.fillStyle = COLORS.black;
    
    // Body
    ctx.fillRect(x + width/4, y + height/4, width/2, height/2);
    
    // Head
    ctx.fillRect(x + width/4, y, width/2, height/4);
    
    // Sword arm raised (victory pose)
    ctx.fillRect(x + width/2, y - height/6, width/10, height/3);
    
    // Sword
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x + width/2 - width/4, y - height/6 - height/10, width/2, height/10);
    
    // Other arm
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x, y + height/4, width/4, height/6);
    
    // Legs
    ctx.fillRect(x + width/4, y + height*3/4, width/6, height/4);
    ctx.fillRect(x + width*3/5, y + height*3/4, width/6, height/4);
    
    // Scarf flowing in victory
    ctx.fillStyle = COLORS.white;
    const scarfWave = Math.sin(Date.now() * 0.003) * 2;
    ctx.beginPath();
    ctx.moveTo(x + width/2, y + height/5);
    ctx.lineTo(x + width, y + height/5 + scarfWave);
    ctx.lineTo(x + width + width/5, y + height/3 + scarfWave);
    ctx.lineTo(x + width/2 + width/4, y + height/3);
    ctx.fill();
}

// Helper function to draw ninja in action pose for title screen
function drawNinjaActionPose(x, y) {
    const width = 80;
    const height = 100;
    
    // Dynamic animation for title screen
    const bounceY = Math.sin(Date.now() * 0.002) * 5;
    
    ctx.fillStyle = COLORS.black;
    
    // Legs in running position
    ctx.fillRect(x + width/6, y + height*3/5 + bounceY, width/4, height*2/5);
    ctx.fillRect(x + width*3/5, y + height*3/5 + bounceY - 10, width/4, height*2/5);
    
    // Body slightly angled for action
    ctx.fillRect(x + width/4, y + height/5 + bounceY, width/2, height*2/5);
    
    // Head with mask
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x + width/3, y + bounceY, width/3, height/5);
    
    // Eyes
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x + width*2/5, y + height/10 + bounceY, width/10, height/20);
    ctx.fillRect(x + width*3/5, y + height/10 + bounceY, width/10, height/20);
    
    // Arms in attack position
    ctx.fillRect(x, y + height/4 + bounceY, width/3, height/6);
    
    // Sword arm extended
    ctx.fillRect(x + width*3/5, y + height/5 + bounceY, width*2/5, height/8);
    
    // Sword
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x + width, y + height/5 + bounceY, width/2, height/16);
    
    // Scarf dramatically flowing
    ctx.beginPath();
    const scarfWave = Math.sin(Date.now() * 0.004) * 5;
    ctx.moveTo(x + width/3, y + height/5 + bounceY);
    ctx.lineTo(x - width/4, y + height/3 + scarfWave + bounceY);
    ctx.lineTo(x - width/5, y + height/2 + scarfWave + bounceY);
    ctx.lineTo(x + width/4, y + height/3 + bounceY);
    ctx.fill();
}

// Helper function to update physics
function updatePhysics(dt) {
    // Apply gravity to player
    player.dy += GRAVITY * dt;
    
    // Check if player is on ground
    player.canJump = false;
    
    // Player movement
    player.x += player.dx * dt;
    player.y += player.dy * dt;
    
    // Wall jumping logic
    player.wallSliding = false;
    
    // Check platform collisions
    for (let platform of platforms) {
        // Platform collision detection
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y &&
            player.y < platform.y + platform.height) {
            
            // Coming from above (landing)
            if (player.y + player.height - player.dy <= platform.y) {
                player.y = platform.y - player.height;
                player.dy = 0;
                player.canJump = true;
            }
            // Coming from below (hitting ceiling)
            else if (player.y - player.dy >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.dy = 0;
            }
            // Coming from left (hitting wall)
            else if (player.x + player.width - player.dx <= platform.x) {
                player.x = platform.x - player.width;
                player.dx = 0;
                
                // Wall sliding
                if (!player.canJump && player.dy > 0) {
                    player.wallSliding = true;
                    player.dy = Math.min(player.dy, 80 * dt); // Slow fall when wall sliding
                    
                    if ((keys.ArrowUp || keys.z) && player.wallSliding) {
                        // Wall jump
                        player.dy = -player.jumpStrength;
                        player.dx = -player.speed; // Push away from wall
                        player.wallSliding = false;
                    }
                }
            }
            // Coming from right (hitting wall)
            else if (player.x - player.dx >= platform.x + platform.width) {
                player.x = platform.x + platform.width;
                player.dx = 0;
                
                // Wall sliding
                if (!player.canJump && player.dy > 0) {
                    player.wallSliding = true;
                    player.dy = Math.min(player.dy, 80 * dt); // Slow fall when wall sliding
                    
                    if ((keys.ArrowUp || keys.z) && player.wallSliding) {
                        // Wall jump
                        player.dy = -player.jumpStrength;
                        player.dx = player.speed; // Push away from wall
                        player.wallSliding = false;
                    }
                }
            }
        }
    }
    
    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.canJump = true;
    }
}

// Helper function to update player state
function updatePlayerState(dt) {
    // Handle invulnerability timer
    if (player.invulnerable > 0) {
        player.invulnerable -= dt;
    }
    
    // Handle attack timer
    if (player.attacking) {
        player.attackTimer += dt;
        if (player.attackTimer > 0.3) { // Attack duration
            player.attacking = false;
            player.attackTimer = 0;
        }
    }
    
    // Check if player is falling
    if (player.dy > 0 && !player.canJump) {
        player.state = 'jump';
    }
}

// Helper function to update entities (enemies, projectiles, particles)
function updateEntities(dt) {
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move enemy based on type
        switch(enemy.type) {
            case 'patrol':
                // Basic patrol movement
                enemy.x += enemy.direction * enemy.speed * dt;
                
                // Change direction at screen edges or obstacles
                if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                    enemy.direction *= -1;
                }
                
                // Update frame animation
                enemy.frameX = (enemy.frameX + 1) % 4;
                break;
                
            case 'jumper':
                // Jump at intervals
                enemy.jumpTimer -= dt;
                if (enemy.jumpTimer <= 0) {
                    enemy.dy = -enemy.jumpStrength;
                    enemy.jumpTimer = 2 + Math.random(); // Random jump interval
                }
                
                // Apply gravity
                enemy.dy += GRAVITY * dt;
                
                // Update position
                enemy.y += enemy.dy * dt;
                
                // Stop at ground
                if (enemy.y + enemy.height > canvas.height) {
                    enemy.y = canvas.height - enemy.height;
                    enemy.dy = 0;
                }
                
                // Update frame animation faster during jump
                enemy.frameX = (enemy.frameX + 1) % 4;
                break;
                
            case 'shooter':
                // Shooter stays in place but tracks player
                enemy.direction = player.x < enemy.x ? -1 : 1;
                
                // Shoot timer
                enemy.shootTimer -= dt;
                if (enemy.shootTimer <= 0) {
                    // Create projectile
                    projectiles.push({
                        x: enemy.x + (enemy.direction > 0 ? enemy.width : 0),
                        y: enemy.y + enemy.height/3,
                        width: 15,
                        height: 5,
                        dx: enemy.direction * 150,
                        dy: 0,
                        damage: 1,
                        lifetime: 0,
                        type: 'arrow',
                        fromPlayer: false
                    });
                    
                    enemy.shootTimer = 3; // Reset timer
                }
                break;
                
            case 'boss':
                // Boss has multiple attack patterns
                enemy.attackTimer -= dt;
                
                if (enemy.attackTimer <= 0) {
                    // Change attack pattern
                    enemy.attackPattern = (enemy.attackPattern + 1) % 3;
                    enemy.attackTimer = 2;
                    
                    if (enemy.attackPattern === 0) {
                        // Rush toward player
                        enemy.direction = player.x < enemy.x ? -1 : 1;
                        enemy.speed = 150;
                    } else if (enemy.attackPattern === 1) {
                        // Jump up and shoot
                        enemy.dy = -enemy.jumpStrength;
                        
                        // Create energy ball projectile
                        for (let angle = -30; angle <= 30; angle += 30) {
                            const radians = angle * (Math.PI / 180);
                            const speed = 100;
                            projectiles.push({
                                x: enemy.x + enemy.width/2,
                                y: enemy.y + enemy.height/2,
                                width: 15,
                                height: 15,
                                dx: Math.cos(radians) * speed * enemy.direction,
                                dy: Math.sin(radians) * speed,
                                damage: 1,
                                lifetime: 0,
                                type: 'energy',
                                fromPlayer: false
                            });
                        }
                    } else {
                        // Slow pursuit
                        enemy.speed = 50;
                    }
                }
                
                // Apply gravity
                enemy.dy += GRAVITY * dt;
                
                // Update position based on current attack pattern
                if (enemy.attackPattern === 0 || enemy.attackPattern === 2) {
                    // Move toward player
                    enemy.direction = player.x < enemy.x ? -1 : 1;
                    enemy.x += enemy.direction * enemy.speed * dt;
                }
                
                enemy.y += enemy.dy * dt;
                
                // Stop at ground
                if (enemy.y + enemy.height > canvas.height) {
                    enemy.y = canvas.height - enemy.height;
                    enemy.dy = 0;
                }
                
                // Boundary check
                if (enemy.x < 0) enemy.x = 0;
                if (enemy.x + enemy.width > canvas.width) enemy.x = canvas.width - enemy.width;
                break;
        }
        
        // Remove dead enemies
        if (enemy.health <= 0) {
            // Add explosion particles
            addParticles(
                enemy.x + enemy.width/2,
                enemy.y + enemy.height/2,
                20,
                { color: COLORS.white, size: 5, type: 'square' }
            );
            
            // Add score
            if (enemy.type === 'boss') {
                player.score += 5000;
            } else {
                player.score += 500;
            }
            
            enemies.splice(i, 1);
        }
    }
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        // Update position
        proj.x += proj.dx * dt;
        proj.y += proj.dy * dt;
        
        // Update lifetime
        proj.lifetime += dt;
        
        // Remove if off screen or too old
        if (proj.x < -50 || proj.x > canvas.width + 50 || 
            proj.y < -50 || proj.y > canvas.height + 50 ||
            proj.lifetime > 3) {
            projectiles.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update position
        particle.x += particle.dx * dt;
        particle.y += particle.dy * dt;
        
        // Apply gravity
        particle.dy += GRAVITY * 0.5 * dt;
        
        // Update lifetime
        particle.lifetime += dt;
        
        // Remove if too old
        if (particle.lifetime > 1) {
            particles.splice(i, 1);
        }
    }
}

// Helper function to detect collisions
function detectCollisions() {
    // Projectile collisions with enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        if (proj.fromPlayer) {
            // Check collision with enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                if (proj.x + proj.width > enemy.x &&
                    proj.x < enemy.x + enemy.width &&
                    proj.y + proj.height > enemy.y &&
                    proj.y < enemy.y + enemy.height) {
                    
                    // Damage enemy
                    enemy.health -= proj.damage;
                    
                    // Remove projectile
                    projectiles.splice(i, 1);
                    
                    // Add hit particles
                    addParticles(
                        proj.x,
                        proj.y,
                        10,
                        { color: COLORS.white, size: 3, type: 'circle' }
                    );
                    
                    break;
                }
            }
        } else {
            // Check collision with player
            if (proj.x + proj.width > player.x &&
                proj.x < player.x + player.width &&
                proj.y + proj.height > player.y &&
                proj.y < player.y + player.height &&
                player.invulnerable <= 0) {
                
                // Damage player
                player.health--;
                player.invulnerable = 1; // 1 second invulnerability
                
                // Knockback
                player.dx = (player.x < proj.x) ? -150 : 150;
                player.dy = -150;
                
                // Remove projectile
                projectiles.splice(i, 1);
                
                // Add hit particles
                addParticles(
                    player.x + player.width/2,
                    player.y + player.height/2,
                    15,
                    { color: COLORS.white, size: 3, type: 'circle' }
                );
                
                break;
            }
        }
    }
    
    // Player collision with enemies
    if (player.invulnerable <= 0) {
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            
            if (player.x + player.width > enemy.x &&
                player.x < enemy.x + enemy.width &&
                player.y + player.height > enemy.y &&
                player.y < enemy.y + enemy.height) {
                
                // Damage player
                player.health--;
                player.invulnerable = 1; // 1 second invulnerability
                
                // Knockback
                player.dx = (player.x < enemy.x) ? -150 : 150;
                player.dy = -150;
                
                // Add hit particles
                addParticles(
                    player.x + player.width/2,
                    player.y + player.height/2,
                    15,
                    { color: COLORS.white, size: 3, type: 'circle' }
                );
                
                break;
            }
        }
    }
}

// Helper function to add particles
function addParticles(x, y, count, options) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        
        particles.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed - 50, // Initial upward velocity
            size: options.size + Math.random() * options.size,
            color: options.color,
            type: options.type || 'circle',
            lifetime: 0
        });
    }
}

// Helper function to draw particles
function drawParticle(particle) {
    ctx.fillStyle = particle.color;
    
    // Fade out based on lifetime
    ctx.globalAlpha = 1 - particle.lifetime;
    
    if (particle.type === 'circle') {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    } else if (particle.type === 'square') {
        ctx.fillRect(
            particle.x - particle.size/2,
            particle.y - particle.size/2,
            particle.size,
            particle.size
        );
    }
    
    ctx.globalAlpha = 1;
}

function drawProjectile(projectile) {
    ctx.save();
    
    if (projectile.fromPlayer) {
        // Player projectile (kunai, shuriken)
        ctx.fillStyle = COLORS.white;
        
        const size = projectile.width;
        const x = projectile.x;
        const y = projectile.y;
        
        // Draw shuriken 
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x - size/2, y);
        ctx.closePath();
        ctx.fill();
        
        // Center circle
        ctx.beginPath();
        ctx.arc(x, y, size/6, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Enemy projectile (arrows, energy bolts)
        ctx.fillStyle = COLORS.white;
        
        const width = projectile.width;
        const height = projectile.height;
        const x = projectile.x;
        const y = projectile.y;
        
        if (projectile.type === 'arrow') {
            // Draw arrow 
            ctx.beginPath();
            
            // Arrow direction based on trajectory
            if (projectile.dx > 0) {
                // Arrow flying right
                // Arrow shaft
                ctx.fillRect(x, y + height/3, width * 0.7, height/3);
                
                // Arrowhead
                ctx.moveTo(x + width * 0.7, y);
                ctx.lineTo(x + width, y + height/2);
                ctx.lineTo(x + width * 0.7, y + height);
                ctx.closePath();
                ctx.fill();
                
                // Feathers
                ctx.fillRect(x, y, width * 0.2, height/5);
                ctx.fillRect(x, y + height - height/5, width * 0.2, height/5);
            } else {
                // Arrow flying left
                // Arrow shaft
                ctx.fillRect(x + width * 0.3, y + height/3, width * 0.7, height/3);
                
                // Arrowhead
                ctx.moveTo(x + width * 0.3, y);
                ctx.lineTo(x, y + height/2);
                ctx.lineTo(x + width * 0.3, y + height);
                ctx.closePath();
                ctx.fill();
                
                // Feathers
                ctx.fillRect(x + width * 0.8, y, width * 0.2, height/5);
                ctx.fillRect(x + width * 0.8, y + height - height/5, width * 0.2, height/5);
            }
        } else if (projectile.type === 'energy') {
            // Energy projectile for boss
            ctx.fillStyle = COLORS.white;
            
            // Pulsating effect
            const pulseSize = Math.sin(projectile.lifetime * 0.3) * 2;
            
            // Multiple layers for energy ball effect
            ctx.fillRect(x, y, width, height);
            
            // Inner detail
            ctx.fillStyle = COLORS.black;
            ctx.fillRect(x + width/4, y + height/4, width/2, height/2);
            
            // Outer flare effects - small rectangles around the energy ball
            ctx.fillStyle = COLORS.white;
            
            // Top flare
            ctx.fillRect(x + width/2 - 1, y - pulseSize, 2, pulseSize);
            // Bottom flare
            ctx.fillRect(x + width/2 - 1, y + height, 2, pulseSize);
            // Left flare
            ctx.fillRect(x - pulseSize, y + height/2 - 1, pulseSize, 2);
            // Right flare
            ctx.fillRect(x + width, y + height/2 - 1, pulseSize, 2);
        }
    }
    
    ctx.restore();
}