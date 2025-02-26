// Define colors based on GameBoy palette
const COLORS = {
    black: '#0f0f0f',
    darkGray: '#306630',
    lightGray: '#8bac8b',
    white: '#e0f8e0',
    bg: '#8bac8b'
};

// Constants
const GRAVITY = 800;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Game state variables
let gameState = 'start_screen';
let stage = 1;
let canvas, ctx;
let player, platforms, enemies, projectiles, particles;
let lastTime = 0;
let keys = {};

// Visual effects variables
let screenFlash = {active: false, duration: 0, intensity: 0};
let lightning = {active: false, timer: 0, nextStrike: Math.random() * 5 + 3, bolts: []};

// Initialize when the window loads
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize keys
    window.keys = keys = {};

    // Create a separate global object for keyboard input
    window.keyboardState = {};

    // Setup keyboard event listeners to update keyboardState
    window.addEventListener('keydown', function(e) {
    keyboardState[e.key] = true;
    });
    window.addEventListener('keyup', function(e) {
    keyboardState[e.key] = false;
    });

    
    // Initialize game objects
    resetGame();
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(update);
};

// Basic game loop
function update() {
    // Request next frame
    requestAnimationFrame(update);
    
    // Get time since last frame
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // Convert to seconds
    lastTime = now;
    
    // Process input
    if (gameState === 'start_screen' && (keys[' '] || keys.Space)) {
        gameState = 'playing';
    }
    
    // Clear canvas
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update visual effects
    updateVisualEffects(dt);
    
    // Draw based on game state
    if (gameState === 'start_screen') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        // Handle inputs
        handleInput(dt);
        
        // Update physics
        updatePhysics(dt);
        
        // Update player state
        updatePlayerState(dt);
        
        // Update enemies
        updateEnemies(dt);
        
        // Check collisions
        checkCollisions();
        
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
        
        // Final boss position verification - ultimate failsafe
        for (const enemy of enemies) {
            if (enemy.type === 'boss') {
                // If boss is off-screen after all other processing, force it back
                if (enemy.x < 0 || enemy.y < 0 || 
                    enemy.x > canvas.width || enemy.y > canvas.height) {
                    
                    console.log("EMERGENCY: Boss recovery initiated in main game loop!");
                    enemy.x = canvas.width / 2 - enemy.width / 2;
                    enemy.y = canvas.height / 2;
                    enemy.dy = 0;
                    enemy.dx = 0;
                    
                    // Create a visual indicator for this emergency reset
                    for (let i = 0; i < 30; i++) {
                        particles.push({
                            x: enemy.x + enemy.width/2,
                            y: enemy.y + enemy.height/2,
                            dx: (Math.random() - 0.5) * 100,
                            dy: (Math.random() - 0.5) * 100,
                            size: 4 + Math.random() * 5,
                            color: COLORS.white,
                            lifetime: 0,
                            maxLifetime: 1.0
                        });
                    }
                }
            }
        }
        
        // Check for level completion (updated to handle both Stage 1 and Stage 2)
        if ((stage === 1 || stage === 2) && player.x > canvas.width - 50 && enemies.length === 0) {
            stage++;
            loadStage(stage);
            
            // Refill shurikens when moving to the next stage
            player.shurikenCount = player.maxShurikens;
            player.shurikenReloadTimer = 0;
        }
        
        // Check for player death
        if (player.health <= 0) {
            gameState = 'game_over';
        }
    } else if (gameState === 'game_over') {
        drawGameOverScreen();
    } else if (gameState === 'game_complete') {
        drawGameCompleteScreen();
    }
}

// Function to update visual effects
function updateVisualEffects(dt) {
    // Update screen flash effect (thunder)
    if (screenFlash.active) {
        screenFlash.duration -= dt;
        
        // Create fading effect
        if (screenFlash.duration > 0.1) {
            screenFlash.intensity = Math.min(0.7, screenFlash.duration);
        } else {
            screenFlash.intensity *= 0.8;
        }
        
        // Deactivate when done
        if (screenFlash.duration <= 0 || screenFlash.intensity < 0.05) {
            screenFlash.active = false;
        }
    }
    
    // Update lightning effect
    lightning.timer += dt;
    
    // Check if it's time for a lightning strike
    if (lightning.timer >= lightning.nextStrike) {
        // Create new lightning bolts
        createLightning();
        
        // Reset timer and set time for next strike (random interval)
        lightning.timer = 0;
        lightning.nextStrike = Math.random() * 8 + 4; // 4-12 seconds between strikes
        
        // Activate lightning
        lightning.active = true;
        
        // Create thunder flash effect with slight delay
        setTimeout(() => {
            screenFlash.active = true;
            screenFlash.duration = 0.2;
            screenFlash.intensity = 0.3;
        }, Math.random() * 300 + 100); // 100-400ms delay
    }
    
    // Deactivate lightning after short duration
    if (lightning.active && lightning.timer > 0.2) {
        lightning.active = false;
        lightning.bolts = [];
    }
}

// Function to create lightning
function createLightning() {
    // Clear existing bolts
    lightning.bolts = [];
    
    // Create 1-3 lightning bolts
    const numBolts = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numBolts; i++) {
        // Random starting position along the top of the screen
        const startX = Math.random() * GAME_WIDTH;
        
        lightning.bolts.push({
            startX: startX,
            startY: 0,
            endY: GAME_HEIGHT * (0.3 + Math.random() * 0.5), // Random height
            width: 1 + Math.random() * 3,
            segmentLength: 10 + Math.random() * 20,
            jitter: 30 + Math.random() * 50
        });
    }
}

// Function to draw the start screen
function drawStartScreen() {
    // Title screen
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title text with shadow
    ctx.fillStyle = COLORS.black;
    ctx.font = '46px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW NINJA', canvas.width/2 + 3, canvas.height/3 + 3);
    
    ctx.fillStyle = COLORS.white;
    ctx.fillText('SHADOW NINJA', canvas.width/2, canvas.height/3);
    
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
        ctx.fillText(instructions[i], canvas.width/2, canvas.height/2 + i * 30);
    }
    
    // Blinking Press Start text
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.font = '24px monospace';
        ctx.fillText('PRESS SPACE TO START', canvas.width/2, canvas.height - 60);
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
        wallSliding: false,
        wallCling: false,
        wallDirection: 0,
        wallJumps: 0, // Track consecutive wall jumps
        maxWallJumps: 5, // Maximum consecutive wall jumps allowed
        wallJumpCooldown: 0, // Cooldown between wall jumps
        currentCorner: null,
        
        // Shuriken system
        shurikenCount: 5, // Current number of shurikens available
        maxShurikens: 5, // Maximum number of shurikens
        shurikenReloadTimer: 0, // Timer for reloading shurikens
        shurikenReloadTime: 2 // Time in seconds to reload one shuriken
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
            
            // Add enemies
            
            // Patrol enemy on first platform
            enemies.push({
                x: 150,
                y: GAME_HEIGHT - 160,
                width: 30,
                height: 40,
                type: 'patrol',
                health: 1,
                speed: 60,
                direction: 1,
                animFrame: 0,
                animTimer: 0
            });
            
            // Flying enemy above
            enemies.push({
                x: 350,
                y: GAME_HEIGHT - 250,
                width: 25,
                height: 25,
                type: 'flyer',
                health: 1,
                speed: 80,
                direction: 1,
                yOffset: 0,
                amplitude: 30,
                frequency: 3,
                animFrame: 0,
                animTimer: 0
            });
            
            // Projectile thrower on middle platform
            enemies.push({
                x: 500,
                y: GAME_HEIGHT - 220,
                width: 30,
                height: 40,
                type: 'thrower',
                health: 1,
                attackCooldown: 0,
                attackInterval: 2,
                animFrame: 0,
                animTimer: 0
            });
            
            // Jumping enemy
            enemies.push({
                x: 700,
                y: GAME_HEIGHT - 190,
                width: 25,
                height: 30,
                type: 'jumper',
                health: 1,
                speed: 40,
                jumpPower: 350,
                direction: -1,
                jumpCooldown: 0,
                jumpInterval: 1.5,
                dy: 0,
                onGround: true,
                animFrame: 0,
                animTimer: 0
            });
            
            break;
            
        case 2:
            // Stage 2: Boss battle stage
            
            // Ground
            platforms.push({
                x: 0,
                y: GAME_HEIGHT - 40,
                width: GAME_WIDTH,
                height: 40,
                type: 'normal'
            });
            
            // Side platforms for player to avoid boss attacks
            platforms.push({
                x: 50,
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
            
            // Adding stage 2 enemies (NOT the boss - boss should only be in stage 3)
            // Tougher patrol enemies
            enemies.push({
                x: 150,
                y: GAME_HEIGHT - 80,
                width: 30,
                height: 40,
                type: 'patrol',
                health: 2,
                speed: 80,
                direction: 1,
                animFrame: 0,
                animTimer: 0
            });
            
            enemies.push({
                x: 450,
                y: GAME_HEIGHT - 80,
                width: 30,
                height: 40,
                type: 'patrol',
                health: 2,
                speed: 80,
                direction: -1,
                animFrame: 0,
                animTimer: 0
            });
            
            // Advanced thrower enemy
            enemies.push({
                x: GAME_WIDTH/2,
                y: GAME_HEIGHT - 80,
                width: 30,
                height: 40,
                type: 'thrower',
                health: 2,
                attackCooldown: 0,
                attackInterval: 1.5,
                animFrame: 0,
                animTimer: 0
            });
            
            break;
            
        case 3:
            // Stage 3: Final Boss battle
            
            // Ground
            platforms.push({
                x: 0,
                y: GAME_HEIGHT - 40,
                width: GAME_WIDTH,
                height: 40,
                type: 'normal'
            });
            
            // Side platforms for player to avoid boss attacks
            platforms.push({
                x: 50,
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
            
            // Boss enemy
            enemies.push({
                x: GAME_WIDTH/2 - 40,
                y: GAME_HEIGHT - 160,
                width: 80,
                height: 120,
                type: 'boss',
                health: 10,
                maxHealth: 10,
                speed: 70,
                direction: 1,
                attackCooldown: 3,
                attackPhase: 0, // 0-ground attack, 1-jump attack, 2-projectile barrage
                phaseTimer: 4,
                jumpPower: 500,
                dy: 0,
                onGround: true,
                isInvulnerable: false,
                invulnerableTimer: 0,
                animFrame: 0,
                animTimer: 0,
                flashTimer: 0,
                currentCorner: null
            });
            
            console.log("Boss initialized with health:", enemies[enemies.length-1].health);
            
            break;
    }
    
    // Reset player position
    player.x = 50;
    player.y = GAME_HEIGHT - 200;
    player.health = player.maxHealth;
}

// Helper function to update physics
function updatePhysics(dt) {
    // Store previous position for collision calculations
    const prevX = player.x;
    const prevY = player.y;
    
    // Apply gravity to player
    player.dy += GRAVITY * dt;
    
    // Limit maximum falling speed to prevent tunneling through platforms
    const maxFallSpeed = 800;
    if (player.dy > maxFallSpeed) player.dy = maxFallSpeed;
    
    // Move player horizontally first
    player.x += player.dx * dt;
    
    // Reset wall jumping logic
    player.wallSliding = false;
    player.wallCling = false;
    
    // Handle horizontal collisions first
    let horizontalCollision = false;
    for (let platform of platforms) {
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height > platform.y + 5 && // Small buffer to prioritize horizontal collisions
            player.y < platform.y + platform.height - 5) {
            
            // Coming from left (hitting right edge of platform)
            if (prevX + player.width <= platform.x + 2) {
                player.x = platform.x - player.width;
                player.dx = 0;
                horizontalCollision = true;
                
                // Wall sliding and clinging
                if (!player.canJump && player.dy > 0) {
                    player.wallSliding = true;
                    player.wallCling = true;
                    player.wallDirection = 1; // Right wall
                    player.dy = Math.min(player.dy, 80); // Slow fall when wall sliding
                }
            }
            // Coming from right (hitting left edge of platform)
            else if (prevX >= platform.x + platform.width - 2) {
                player.x = platform.x + platform.width;
                player.dx = 0;
                horizontalCollision = true;
                
                // Wall sliding and clinging
                if (!player.canJump && player.dy > 0) {
                    player.wallSliding = true;
                    player.wallCling = true;
                    player.wallDirection = -1; // Left wall
                    player.dy = Math.min(player.dy, 80); // Slow fall when wall sliding
                }
            }
        }
    }
    
    // Now move player vertically
    player.y += player.dy * dt;
    
    // Handle vertical collisions
    let verticalCollision = false;
    for (let platform of platforms) {
        if (player.x + player.width > platform.x + 2 &&
            player.x < platform.x + platform.width - 2 &&
            player.y + player.height > platform.y &&
            player.y < platform.y + platform.height) {
            
            // Coming from above (landing)
            if (prevY + player.height <= platform.y + 5) {
                player.y = platform.y - player.height;
                player.dy = 0;
                player.canJump = true;
                player.wallJumps = 0; // Reset wall jumps when landing
                verticalCollision = true;
            }
            // Coming from below (hitting ceiling)
            else if (prevY >= platform.y + platform.height - 5 && !verticalCollision) {
                player.y = platform.y + platform.height;
                player.dy = 0;
                verticalCollision = true;
            }
        }
    }
    
    // Special case for vertical walls in stage 1
    // If player is against a thin vertical wall, ensure they don't get stuck inside it
    for (let platform of platforms) {
        // Check if this is a vertical wall-like platform (much taller than wide)
        if (platform.height > platform.width * 2) {
            const isNearLeftEdge = Math.abs(player.x + player.width - platform.x) < 5;
            const isNearRightEdge = Math.abs(player.x - (platform.x + platform.width)) < 5;
            
            if ((isNearLeftEdge || isNearRightEdge) && 
                player.y + player.height > platform.y &&
                player.y < platform.y + platform.height) {
                
                // If player is inside the wall, push them out
                if (player.x + player.width > platform.x + 2 && 
                    player.x < platform.x + platform.width - 2) {
                    
                    // Find which side is closer and push that way
                    const distToLeft = player.x + player.width - platform.x;
                    const distToRight = platform.x + platform.width - player.x;
                    
                    if (distToLeft < distToRight) {
                        player.x = platform.x - player.width;
                    } else {
                        player.x = platform.x + platform.width;
                    }
                    
                    player.dx = 0;
                }
            }
        }
    }
    
    // Screen boundaries
    if (player.x < 0) {
        player.x = 0;
        // Allow wall climbing on screen edges too
        if (!player.canJump && player.dy > 0) {
            player.wallSliding = true;
            player.wallCling = true;
            player.wallDirection = 1; // Right wall (pushing left)
            player.dy = Math.min(player.dy, 80); // Slow fall when wall sliding
        }
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        // Allow wall climbing on screen edges too
        if (!player.canJump && player.dy > 0) {
            player.wallSliding = true;
            player.wallCling = true;
            player.wallDirection = -1; // Left wall (pushing right)
            player.dy = Math.min(player.dy, 80); // Slow fall when wall sliding
        }
    }
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.canJump = true;
        player.wallJumps = 0; // Reset wall jumps when landing
    }
    
    // Final failsafe - if player somehow gets stuck inside a platform, try to resolve it
    for (let platform of platforms) {
        if (player.x + player.width > platform.x + 5 &&
            player.x < platform.x + platform.width - 5 &&
            player.y + player.height > platform.y + 5 &&
            player.y < platform.y + platform.height - 5) {
            
            // Player is inside platform - find nearest edge to eject them
            const distToTop = player.y + player.height - platform.y;
            const distToBottom = platform.y + platform.height - player.y;
            const distToLeft = player.x + player.width - platform.x;
            const distToRight = platform.x + platform.width - player.x;
            
            // Find the smallest distance to an edge
            const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
            
            if (minDist === distToTop) {
                player.y = platform.y - player.height;
                player.dy = 0;
                player.canJump = true;
            } else if (minDist === distToBottom) {
                player.y = platform.y + platform.height;
                player.dy = 0;
            } else if (minDist === distToLeft) {
                player.x = platform.x - player.width;
                player.dx = 0;
            } else if (minDist === distToRight) {
                player.x = platform.x + platform.width;
                player.dx = 0;
            }
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
    
    // Remove expired particles
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].lifetime >= particles[i].maxLifetime) {
            particles.splice(i, 1);
        }
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
    
    // Handle shuriken reloading
    if (player.shurikenCount < player.maxShurikens) {
        player.shurikenReloadTimer += dt;
        
        // When reload timer reaches reload time, add a shuriken
        if (player.shurikenReloadTimer >= player.shurikenReloadTime) {
            player.shurikenCount++;
            player.shurikenReloadTimer = 0; // Reset timer
        }
    }
    
    // Check if player is falling
    if (player.dy > 0 && !player.canJump) {
        player.state = 'jump';
    }
}

// Function to draw a platform
function drawPlatform(platform) {
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Add highlights
    ctx.fillStyle = COLORS.lightGray;
    ctx.fillRect(platform.x, platform.y, platform.width, 5);
}

// Function to draw background elements
function drawBackground() {
    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, COLORS.bg);
    gradient.addColorStop(1, COLORS.darkGray);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw cityscape silhouette
    ctx.fillStyle = COLORS.black;
    
    // Draw buildings
    for (let i = 0; i < 10; i++) {
        const buildingWidth = 60 + (i * 20) % 40;
        const buildingHeight = 100 + (i * 30) % 120;
        const x = i * 100 - 20;
        
        // Building silhouette
        ctx.fillRect(x, GAME_HEIGHT - buildingHeight, buildingWidth, buildingHeight);
        
        // Windows (lit up)
        ctx.fillStyle = COLORS.white;
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
    
    // Draw moon
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(100, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Moon craters
    ctx.fillStyle = COLORS.lightGray;
    ctx.beginPath();
    ctx.arc(110, 70, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, 90, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw lightning bolts if active
    if (lightning.active && lightning.bolts.length > 0) {
        for (const bolt of lightning.bolts) {
            drawLightningBolt(bolt);
        }
    }
    
    // Apply screen flash effect if active (thunder effect)
    if (screenFlash.active) {
        ctx.globalAlpha = screenFlash.intensity;
        ctx.fillStyle = COLORS.black;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
    }
}

// Function to create and draw a lightning bolt
function drawLightningBolt(bolt) {
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = bolt.width;
    
    ctx.beginPath();
    ctx.moveTo(bolt.startX, bolt.startY);
    
    let currentX = bolt.startX;
    let currentY = bolt.startY;
    
    // Create zig-zag pattern for lightning
    while (currentY < bolt.endY) {
        const nextY = currentY + bolt.segmentLength;
        const nextX = currentX + (Math.random() - 0.5) * bolt.jitter;
        
        ctx.lineTo(nextX, nextY);
        
        currentX = nextX;
        currentY = nextY;
    }
    
    ctx.stroke();
    
    // Draw a glow around the lightning for effect
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = COLORS.lightGray;
    ctx.lineWidth = bolt.width * 3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1;
}

// Function to draw the player
function drawPlayer() {
    // Draw with slight transparency if invulnerable
    if (player.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    // Calculate animation offsets based on movement
    const runCycle = player.dx !== 0 && player.canJump ? Math.floor(Date.now() / 100) % 4 : 0;
    const legOffset = [0, 2, 0, -2][runCycle];
    
    // Save the current context state
    ctx.save();
    
    // Draw shadow beneath player (not affected by rotation)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(
        player.x + player.width/2, 
        player.y + player.height - 2,
        player.width/2,
        4,
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Determine if rolling (in the air and not wall clinging)
    const isRolling = !player.canJump && !player.wallCling;
    
    if (isRolling) {
        // Calculate rotation based on vertical velocity and horizontal direction
        const jumpHeight = 400;
        const jumpProgress = Math.abs(player.dy) / jumpHeight;
        const rotationAngle = jumpProgress * Math.PI * 2 * (player.dy > 0 ? 1 : -1) * player.facing;
        
        // Center of rotation is the middle of the player sprite
        const centerX = player.x + player.width/2;
        const centerY = player.y + player.height/2;
        
        // Translate to center, rotate, then translate back
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle);
        
        // Draw curled-up ninja (tucked position) instead of just a ball
        
        // Main body (torso) - slightly oval
        ctx.fillStyle = COLORS.black;
        ctx.beginPath();
        ctx.ellipse(0, 0, player.width/3, player.height/3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = COLORS.black;
        ctx.beginPath();
        ctx.arc(-player.width/8, -player.height/5, player.width/5, 0, Math.PI * 2);
        ctx.fill();
        
        // White headband/mask 
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(-player.width/4, -player.height/4, player.width/2, player.height/12);
        
        // Tucked legs (curved shapes)
        ctx.fillStyle = COLORS.black;
        
        // Left leg (curved)
        ctx.beginPath();
        ctx.arc(player.width/12, player.height/12, player.width/6, 0, Math.PI, true);
        ctx.fill();
        
        // Right leg (curved differently)
        ctx.beginPath();
        ctx.arc(-player.width/12, player.height/8, player.width/6, 0, Math.PI, true);
        ctx.fill();
        
        // Arms wrapped around legs
        ctx.lineWidth = player.width/12;
        ctx.strokeStyle = COLORS.black;
        ctx.beginPath();
        ctx.arc(0, 0, player.width/4, 0.5 * Math.PI, 1.5 * Math.PI, false);
        ctx.stroke();
        
        // Add flowing scarf trailing behind based on rotation
        ctx.fillStyle = COLORS.white;
        const scarfAngle = Math.PI + (Date.now() * 0.005) % (Math.PI * 2);
        const scarfLength = player.width/2;
        
        ctx.beginPath();
        ctx.moveTo(0, -player.height/6);
        
        // Create a flowing, curved scarf with bezier curves
        ctx.bezierCurveTo(
            Math.cos(scarfAngle) * scarfLength * 0.5, Math.sin(scarfAngle) * scarfLength * 0.5 - player.height/6,
            Math.cos(scarfAngle) * scarfLength * 0.8, Math.sin(scarfAngle) * scarfLength * 0.8 - player.height/12,
            Math.cos(scarfAngle) * scarfLength, Math.sin(scarfAngle) * scarfLength
        );
        
        ctx.bezierCurveTo(
            Math.cos(scarfAngle + 0.2) * scarfLength * 0.8, Math.sin(scarfAngle + 0.2) * scarfLength * 0.8,
            Math.cos(scarfAngle + 0.3) * scarfLength * 0.5, Math.sin(scarfAngle + 0.3) * scarfLength * 0.5,
            0, -player.height/12
        );
        
        ctx.fill();
        
        // REMOVED: Spin motion lines have been removed to avoid looking like a sword
        
        // Restore context after ball drawing
        ctx.restore();
    } else {
        // Regular ninja drawing (not rolling)
        // Ninja body - slightly hunched over posture
        ctx.fillStyle = COLORS.black;
        ctx.fillRect(
            player.x + player.width/6, 
            player.y + player.height/8, 
            player.width*2/3, 
            player.height*7/8
        );
        
        // Legs with animation
        ctx.fillStyle = COLORS.black;
        
        // Left leg
        ctx.fillRect(
            player.x + player.width/3 - 2,
            player.y + player.height*2/3,
            player.width/8,
            player.height/3 + legOffset
        );
        
        // Right leg
        ctx.fillRect(
            player.x + player.width*2/3 - 2,
            player.y + player.height*2/3,
            player.width/8,
            player.height/3 - legOffset
        );
        
        // Ninja head wrapping (full face mask)
        ctx.fillStyle = COLORS.black;
        ctx.fillRect(
            player.x + player.width/6, 
            player.y, 
            player.width*2/3, 
            player.height/4
        );
        
        // Eye slit - narrow white band
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(
            player.x + player.width/4,
            player.y + player.height/10,
            player.width/2,
            player.height/20
        );
        
        // Add ninja equipment - belt
        ctx.fillStyle = COLORS.darkGray;
        ctx.fillRect(
            player.x + player.width/6,
            player.y + player.height/2 - player.height/16,
            player.width*2/3,
            player.height/8
        );
        
        // Sash/rope knot on belt
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(
            player.x + player.width/2 - player.width/16,
            player.y + player.height/2 - player.height/16,
            player.width/8,
            player.height/8
        );
        
        // Arm holding shuriken when attacking
        if (player.attacking) {
            ctx.fillStyle = COLORS.black;
            if (player.facing > 0) {
                // Right arm extended
                ctx.fillRect(
                    player.x + player.width*2/3,
                    player.y + player.height/3,
                    player.width/2,
                    player.width/8
                );
                
                // Small shuriken in hand
                const hand_x = player.x + player.width*2/3 + player.width/2 - player.width/16;
                const hand_y = player.y + player.height/3 + player.width/16;
                
                ctx.fillStyle = COLORS.white;
                ctx.beginPath();
                ctx.moveTo(hand_x, hand_y - player.width/20);
                ctx.lineTo(hand_x + player.width/20, hand_y);
                ctx.lineTo(hand_x, hand_y + player.width/20);
                ctx.lineTo(hand_x - player.width/20, hand_y);
                ctx.closePath();
                ctx.fill();
            } else {
                // Left arm extended
                ctx.fillRect(
                    player.x - player.width/2 + player.width/3,
                    player.y + player.height/3,
                    player.width/2,
                    player.width/8
                );
                
                // Small shuriken in hand
                const hand_x = player.x - player.width/2 + player.width/3 + player.width/16;
                const hand_y = player.y + player.height/3 + player.width/16;
                
                ctx.fillStyle = COLORS.white;
                ctx.beginPath();
                ctx.moveTo(hand_x, hand_y - player.width/20);
                ctx.lineTo(hand_x + player.width/20, hand_y);
                ctx.lineTo(hand_x, hand_y + player.width/20);
                ctx.lineTo(hand_x - player.width/20, hand_y);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            // Normal arm position
            ctx.fillStyle = COLORS.black;
            if (player.facing > 0) {
                // Right arm
                ctx.fillRect(
                    player.x + player.width*2/3,
                    player.y + player.height/3,
                    player.width/6,
                    player.height/3
                );
            } else {
                // Left arm
                ctx.fillRect(
                    player.x + player.width/6,
                    player.y + player.height/3,
                    player.width/6,
                    player.height/3
                );
            }
        }
        
        // Draw scarf - longer and more flowing
        ctx.fillStyle = COLORS.white;
        
        // Scarf behavior depends on movement state
        let scarfWave = Math.sin(Date.now() * 0.01) * 3;
        let scarfLength = 15;
        
        // Show scarf in all states, including jumping
        if (player.dx !== 0) {
            // Running scarf - flows behind more dramatically
            scarfLength = 20;
            scarfWave = Math.sin(Date.now() * 0.015) * 6;
        } else if (player.wallCling) {
            // Wall climbing scarf - points downward
            scarfLength = 15;
            scarfWave = Math.sin(Date.now() * 0.008) * 4;
        } else if (!player.canJump) {
            // Jumping scarf - more dynamic flowing
            scarfLength = 25;
            scarfWave = Math.sin(Date.now() * 0.02) * 8;
        }
        
        // Always draw the scarf, even when jumping
        ctx.beginPath();
        ctx.moveTo(
            player.x + (player.facing > 0 ? player.width/4 : player.width*3/4),
            player.y + player.height/5
        );
        
        // Different scarf animation based on wall climbing
        if (player.wallCling) {
            // When wall climbing, scarf points more downward
            ctx.lineTo(
                player.x + (player.facing > 0 ? -scarfLength : player.width + scarfLength),
                player.y + player.height/3 + scarfWave
            );
            ctx.lineTo(
                player.x + (player.facing > 0 ? -scarfLength/2 : player.width + scarfLength/2),
                player.y + player.height/2 + scarfWave*1.5
            );
            ctx.lineTo(
                player.x + (player.facing > 0 ? player.width/6 : player.width*5/6),
                player.y + player.height/3
            );
        } else {
            // Normal scarf animation
            ctx.lineTo(
                player.x + (player.facing > 0 ? -scarfLength : player.width + scarfLength),
                player.y + player.height/4 + scarfWave
            );
            ctx.lineTo(
                player.x + (player.facing > 0 ? -scarfLength/1.5 : player.width + scarfLength/1.5),
                player.y + player.height/2 + scarfWave*1.2
            );
            ctx.lineTo(
                player.x + (player.facing > 0 ? player.width/6 : player.width*5/6),
                player.y + player.height/3
            );
        }
        ctx.fill();
        
        // Draw wall climbing pose
        if (player.wallCling) {
            // Arm reaching to wall
            ctx.fillStyle = COLORS.black;
            
            if (player.wallDirection > 0) { // Right wall
                ctx.fillRect(
                    player.x + player.width - player.width/10,
                    player.y + player.height/3,
                    player.width/10,
                    player.height/4
                );
            } else { // Left wall
                ctx.fillRect(
                    player.x,
                    player.y + player.height/3,
                    player.width/10,
                    player.height/4
                );
            }
        }
        
        // Restore context after regular drawing
        ctx.restore();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
}

// Function to draw projectiles
function drawProjectile(projectile) {
    if (projectile.fromPlayer) {
        // Player projectile (yellow star-shaped shuriken)
        ctx.fillStyle = '#FFDD00'; // Bright yellow
        
        const size = projectile.width;
        const x = projectile.x;
        const y = projectile.y;
        
        // Draw star with rotation
        const rotationAngle = projectile.lifetime * 15; // Rotate based on lifetime
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationAngle);
        
        // Draw 5-point star
        const outerRadius = size/2;
        const innerRadius = outerRadius * 0.4;
        const spikes = 5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Add a small center circle
        ctx.fillStyle = '#FF8800'; // Darker orange center
        ctx.beginPath();
        ctx.arc(0, 0, size/6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    } else if (projectile.type === 'enemy_shuriken') {
        // Enemy shuriken
        ctx.fillStyle = COLORS.white;
        
        const size = projectile.width;
        const x = projectile.x;
        const y = projectile.y;
        
        // Draw with opposite rotation
        const rotationAngle = -projectile.lifetime * 15;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationAngle);
        
        // Draw the shuriken shape
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(size/2, 0);
        ctx.lineTo(0, size/2);
        ctx.lineTo(-size/2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Center circle
        ctx.beginPath();
        ctx.arc(0, 0, size/6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    } else if (projectile.type === 'shockwave') {
        // Boss ground shockwave
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(
            projectile.x - projectile.width/2,
            projectile.y - projectile.height/2,
            projectile.width,
            projectile.height
        );
        
        // Remove particle trail effect
        // No particles for ground shockwaves anymore
    } else if (projectile.type === 'energyBall') {
        // Boss energy projectile
        const pulseSize = Math.sin(projectile.lifetime * 5) * 2;
        
        // Outer glow
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.arc(
            projectile.x + projectile.width/2,
            projectile.y + projectile.height/2,
            projectile.width/2 + pulseSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = COLORS.black;
        ctx.beginPath();
        ctx.arc(
            projectile.x + projectile.width/2,
            projectile.y + projectile.height/2,
            projectile.width/4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// Function to draw enemy
function drawEnemy(enemy) {
    const flickering = Math.floor(Date.now() / 100) % 2 === 0;
    
    switch(enemy.type) {
        case 'patrol':
            // Patrol enemy - ninja soldier with improved visuals
            ctx.fillStyle = '#990000'; // Dark red for enemy ninjas
            
            // Body
            ctx.fillRect(
                enemy.x, 
                enemy.y, 
                enemy.width, 
                enemy.height
            );
            
            // Head band
            ctx.fillStyle = '#000000';
            ctx.fillRect(
                enemy.x,
                enemy.y + enemy.height/8,
                enemy.width,
                enemy.height/10
            );
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
                enemy.x + (enemy.direction > 0 ? enemy.width*2/3 : enemy.width/4), 
                enemy.y + enemy.height/5,
                enemy.width/8,
                enemy.height/10
            );
            
            // Arms
            ctx.fillStyle = '#990000';
            // Left arm
            ctx.fillRect(
                enemy.x - enemy.width/6,
                enemy.y + enemy.height/3,
                enemy.width/6,
                enemy.height/4
            );
            
            // Right arm
            ctx.fillRect(
                enemy.x + enemy.width,
                enemy.y + enemy.height/3,
                enemy.width/6,
                enemy.height/4
            );
            
            // Legs (animated based on frame)
            ctx.fillStyle = '#000000';
            const legOffset = [0, 3, 0, -3][enemy.animFrame];
            
            // Left leg
            ctx.fillRect(
                enemy.x + enemy.width/3 - 3,
                enemy.y + enemy.height*2/3,
                enemy.width/6,
                enemy.height/3 + legOffset
            );
            
            // Right leg
            ctx.fillRect(
                enemy.x + enemy.width*2/3 - 3,
                enemy.y + enemy.height*2/3,
                enemy.width/6,
                enemy.height/3 - legOffset
            );
            break;
            
        case 'flyer':
            // Flying enemy - improved bat-like enemy
            ctx.fillStyle = '#332244'; // Purple-black for bat body
            
            // Calculate the current position with sine wave
            const currentY = enemy.y + enemy.yOffset;
            
            // Wings (animated)
            const wingFrame = enemy.animFrame;
            const wingExtension = [0, 8, 15, 8][wingFrame];
            
            // Body
            ctx.beginPath();
            ctx.ellipse(
                enemy.x + enemy.width/2,
                currentY + enemy.height/2,
                enemy.width/4,
                enemy.height/3,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Wings
            ctx.fillStyle = '#443355'; // Slightly lighter for wings
            ctx.beginPath();
            if (enemy.direction > 0) {
                // Facing right - draw right wing
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/2, currentY + enemy.height/3);
                ctx.quadraticCurveTo(
                    enemy.x + enemy.width/2 + wingExtension/2, 
                    currentY - wingExtension/2,
                    enemy.x + enemy.width/2 + wingExtension, 
                    currentY
                );
                ctx.quadraticCurveTo(
                    enemy.x + enemy.width - wingExtension/4,
                    currentY + enemy.height/3,
                    enemy.x + enemy.width/2, 
                    currentY + enemy.height/2
                );
                ctx.fill();
                
                // Draw left wing
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/2, currentY + enemy.height/3);
                ctx.quadraticCurveTo(
                    enemy.x + enemy.width/2 - wingExtension/2, 
                    currentY - wingExtension/2,
                    enemy.x + enemy.width/2 - wingExtension, 
                    currentY
                );
                ctx.quadraticCurveTo(
                    enemy.x + wingExtension/4,
                    currentY + enemy.height/3,
                    enemy.x + enemy.width/2, 
                    currentY + enemy.height/2
                );
                ctx.fill();
            } else {
                // Facing left - draw wings (same code as right but flipped direction)
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/2, currentY + enemy.height/3);
                ctx.quadraticCurveTo(
                    enemy.x + enemy.width/2 - wingExtension/2, 
                    currentY - wingExtension/2,
                    enemy.x + enemy.width/2 - wingExtension, 
                    currentY
                );
                ctx.quadraticCurveTo(
                    enemy.x + wingExtension/4,
                    currentY + enemy.height/3,
                    enemy.x + enemy.width/2, 
                    currentY + enemy.height/2
                );
                ctx.fill();
                
                // Draw right wing
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/2, currentY + enemy.height/3);
                ctx.quadraticCurveTo(
                    enemy.x + enemy.width/2 + wingExtension/2, 
                    currentY - wingExtension/2,
                    enemy.x + enemy.width/2 + wingExtension, 
                    currentY
                );
                ctx.quadraticCurveTo(
                    enemy.x + enemy.width - wingExtension/4,
                    currentY + enemy.height/3,
                    enemy.x + enemy.width/2, 
                    currentY + enemy.height/2
                );
                ctx.fill();
            }
            
            // Eyes - glowing red
            ctx.fillStyle = '#FF0000';
            const eyeSize = enemy.width/10;
            
            // Left eye
            ctx.beginPath();
            ctx.arc(
                enemy.x + enemy.width/2 - eyeSize*1.5,
                currentY + enemy.height/4,
                eyeSize,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Right eye
            ctx.beginPath();
            ctx.arc(
                enemy.x + enemy.width/2 + eyeSize*1.5,
                currentY + enemy.height/4,
                eyeSize,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Small fangs
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2 - eyeSize, currentY + enemy.height/3);
            ctx.lineTo(enemy.x + enemy.width/2 - eyeSize/2, currentY + enemy.height/3 + eyeSize);
            ctx.lineTo(enemy.x + enemy.width/2, currentY + enemy.height/3);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2, currentY + enemy.height/3);
            ctx.lineTo(enemy.x + enemy.width/2 + eyeSize/2, currentY + enemy.height/3 + eyeSize);
            ctx.lineTo(enemy.x + enemy.width/2 + eyeSize, currentY + enemy.height/3);
            ctx.fill();
            break;
            
        case 'jumper':
            // Jumping enemy - improved frog-like ninja
            ctx.fillStyle = '#006600'; // Green color
            
            // Body - crouched when on ground, stretched when jumping
            const stretchFactor = enemy.onGround ? 0 : Math.min(1, Math.abs(enemy.dy) / 100);
            const bodyHeight = enemy.height * (1 - stretchFactor * 0.3);
            
            // Draw rounded body
            ctx.beginPath();
            ctx.ellipse(
                enemy.x + enemy.width/2,
                enemy.y + (enemy.height - bodyHeight/2),
                enemy.width/2,
                bodyHeight/2,
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Head
            ctx.fillStyle = '#006600';
            ctx.beginPath();
            ctx.arc(
                enemy.x + enemy.width/2,
                enemy.y + enemy.height/4,
                enemy.width/3,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Eyes - yellow with black pupils
            const eyeY = enemy.y + enemy.height/5;
            
            // Eye whites
            ctx.fillStyle = '#FFFF00';
            // Left eye
            ctx.beginPath();
            ctx.arc(
                enemy.x + (enemy.direction > 0 ? enemy.width*2/3 : enemy.width/3),
                eyeY,
                enemy.width/8,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(
                enemy.x + (enemy.direction > 0 ? enemy.width*2/3 : enemy.width/3),
                eyeY,
                enemy.width/16,
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Legs
            ctx.fillStyle = '#004400';
            if (enemy.onGround) {
                // Crouched legs - more defined with joints
                // Left leg
                ctx.beginPath();
                ctx.ellipse(
                    enemy.x - enemy.width/8,
                    enemy.y + enemy.height - enemy.height/8,
                    enemy.width/4,
                    enemy.height/8,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                
                // Right leg
                ctx.beginPath();
                ctx.ellipse(
                    enemy.x + enemy.width + enemy.width/8,
                    enemy.y + enemy.height - enemy.height/8,
                    enemy.width/4,
                    enemy.height/8,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            } else {
                // Extended legs when jumping - longer and thinner
                // Left leg
                ctx.fillRect(
                    enemy.x - enemy.width/8,
                    enemy.y + enemy.height - enemy.height/4,
                    enemy.width/10,
                    enemy.height/4
                );
                
                // Right leg
                ctx.fillRect(
                    enemy.x + enemy.width,
                    enemy.y + enemy.height - enemy.height/4,
                    enemy.width/10,
                    enemy.height/4
                );
                
                // Feet
                ctx.beginPath();
                ctx.ellipse(
                    enemy.x - enemy.width/8,
                    enemy.y + enemy.height,
                    enemy.width/6,
                    enemy.height/12,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(
                    enemy.x + enemy.width + enemy.width/10,
                    enemy.y + enemy.height,
                    enemy.width/6,
                    enemy.height/12,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }
            break;
            
        case 'thrower':
            // Projectile throwing enemy - ninja with shuriken
            ctx.fillStyle = '#0066AA'; // Blue ninja
            
            // Body
            ctx.fillRect(
                enemy.x, 
                enemy.y, 
                enemy.width, 
                enemy.height
            );
            
            // Ninja mask/hood
            ctx.fillStyle = '#004488';
            ctx.fillRect(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height/3
            );
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
                enemy.x + (enemy.direction > 0 ? enemy.width*2/3 : enemy.width/4), 
                enemy.y + enemy.height/5,
                enemy.width/8,
                enemy.height/10
            );
            
            // Throwing arm animation
            ctx.fillStyle = '#0066AA';
            if (enemy.attackCooldown < 0.3) {
                // Arm in throwing position
                if (enemy.direction > 0) {
                    // Throwing right
                    ctx.fillRect(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/3,
                        enemy.width,
                        enemy.height/10
                    );
                    
                    // Draw shuriken in hand
                    if (enemy.attackCooldown < 0.15) {
                        ctx.fillStyle = '#CCCCCC';
                        ctx.save();
                        ctx.translate(enemy.x + enemy.width*1.5, enemy.y + enemy.height/3 + enemy.height/20);
                        ctx.rotate(enemy.attackCooldown * 15);
                        
                        ctx.beginPath();
                        ctx.moveTo(0, -enemy.width/5);
                        ctx.lineTo(enemy.width/5, 0);
                        ctx.lineTo(0, enemy.width/5);
                        ctx.lineTo(-enemy.width/5, 0);
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.restore();
                    }
                } else {
                    // Throwing left
                    ctx.fillRect(
                        enemy.x - enemy.width/2,
                        enemy.y + enemy.height/3,
                        enemy.width/2,
                        enemy.height/10
                    );
                    
                    // Draw shuriken in hand
                    if (enemy.attackCooldown < 0.15) {
                        ctx.fillStyle = '#CCCCCC';
                        ctx.save();
                        ctx.translate(enemy.x - enemy.width/2, enemy.y + enemy.height/3 + enemy.height/20);
                        ctx.rotate(enemy.attackCooldown * 15);
                        
                        ctx.beginPath();
                        ctx.moveTo(0, -enemy.width/5);
                        ctx.lineTo(enemy.width/5, 0);
                        ctx.lineTo(0, enemy.width/5);
                        ctx.lineTo(-enemy.width/5, 0);
                        ctx.closePath();
                        ctx.fill();
                        
                        ctx.restore();
                    }
                }
            } else {
                // Arm in normal position
                ctx.fillRect(
                    enemy.x + (enemy.direction > 0 ? enemy.width/2 : 0),
                    enemy.y + enemy.height/3,
                    enemy.width/2,
                    enemy.height/10
                );
            }
            
            // Legs
            ctx.fillStyle = '#004488';
            ctx.fillRect(
                enemy.x + enemy.width/3 - 3,
                enemy.y + enemy.height*2/3,
                enemy.width/6,
                enemy.height/3
            );
            
            ctx.fillRect(
                enemy.x + enemy.width*2/3 - 3,
                enemy.y + enemy.height*2/3,
                enemy.width/6,
                enemy.height/3
            );
            break;
        
        case 'boss':
            // Draw boss with damage flash effect
            ctx.fillStyle = enemy.flashTimer > 0 && flickering ? COLORS.white : COLORS.darkGray;
            
            // Body
            ctx.fillRect(
                enemy.x, 
                enemy.y, 
                enemy.width, 
                enemy.height
            );
            
            // Head with more details - helmet and face
            ctx.fillStyle = COLORS.white;
            
            // Base head shape
            ctx.fillRect(
                enemy.x + enemy.width/4, 
                enemy.y, 
                enemy.width/2, 
                enemy.height/4
            );
            
            // Helmet top (angular shape)
            ctx.fillStyle = '#222222';
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/4, enemy.y);
            ctx.lineTo(enemy.x + enemy.width*3/4, enemy.y);
            ctx.lineTo(enemy.x + enemy.width*2/3, enemy.y - enemy.height/10);
            ctx.lineTo(enemy.x + enemy.width/3, enemy.y - enemy.height/10);
            ctx.closePath();
            ctx.fill();
            
            // Helmet side plates
            ctx.fillRect(
                enemy.x + enemy.width/4 - enemy.width/16, 
                enemy.y, 
                enemy.width/16, 
                enemy.height/5
            );
            
            ctx.fillRect(
                enemy.x + enemy.width*3/4, 
                enemy.y, 
                enemy.width/16, 
                enemy.height/5
            );
            
            // Face mask (covers lower part of face)
            ctx.fillStyle = '#444444';
            ctx.fillRect(
                enemy.x + enemy.width/4, 
                enemy.y + enemy.height/8,
                enemy.width/2, 
                enemy.height/8
            );
            
            // Breathing vents on mask
            ctx.fillStyle = '#111111';
            // Left vent
            ctx.fillRect(
                enemy.x + enemy.width*2/5, 
                enemy.y + enemy.height/6,
                enemy.width/15, 
                enemy.height/20
            );
            
            // Right vent
            ctx.fillRect(
                enemy.x + enemy.width*3/5 - enemy.width/15, 
                enemy.y + enemy.height/6,
                enemy.width/15, 
                enemy.height/20
            );
            
            // Glowing eyes - more intimidating
            if (enemy.isInvulnerable) {
                // White glowing eyes when invulnerable - with glow effect
                ctx.fillStyle = COLORS.white;
                
                // Outer glow
                ctx.globalAlpha = 0.5;
                ctx.fillRect(
                    enemy.x + enemy.width/3 - enemy.width/16, 
                    enemy.y + enemy.height/12 - enemy.height/32,
                    enemy.width/8 + enemy.width/8,
                    enemy.height/16 + enemy.height/16
                );
                
                ctx.fillRect(
                    enemy.x + enemy.width*2/3 - enemy.width/8 - enemy.width/16, 
                    enemy.y + enemy.height/12 - enemy.height/32,
                    enemy.width/8 + enemy.width/8,
                    enemy.height/16 + enemy.height/16
                );
                
                ctx.globalAlpha = 1.0;
            }
            
            // Eye shape is now slanted/angular for a more menacing look
            ctx.fillStyle = enemy.isInvulnerable ? COLORS.white : '#FF0000';
            
            // Left eye - angular shape
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/3, enemy.y + enemy.height/12);
            ctx.lineTo(enemy.x + enemy.width/3 + enemy.width/8, enemy.y + enemy.height/12);
            ctx.lineTo(enemy.x + enemy.width/3 + enemy.width/8 + enemy.width/20, enemy.y + enemy.height/12 + enemy.height/16);
            ctx.lineTo(enemy.x + enemy.width/3 - enemy.width/20, enemy.y + enemy.height/12 + enemy.height/16);
            ctx.closePath();
            ctx.fill();
            
            // Right eye - angular shape
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width*2/3 - enemy.width/8, enemy.y + enemy.height/12);
            ctx.lineTo(enemy.x + enemy.width*2/3, enemy.y + enemy.height/12);
            ctx.lineTo(enemy.x + enemy.width*2/3 + enemy.width/20, enemy.y + enemy.height/12 + enemy.height/16);
            ctx.lineTo(enemy.x + enemy.width*2/3 - enemy.width/8 - enemy.width/20, enemy.y + enemy.height/12 + enemy.height/16);
            ctx.closePath();
            ctx.fill();
            
            // When not invulnerable, add pupils for more detail
            if (!enemy.isInvulnerable) {
                ctx.fillStyle = '#000000';
                // Left pupil
                ctx.beginPath();
                ctx.arc(
                    enemy.x + enemy.width/3 + enemy.width/16,
                    enemy.y + enemy.height/12 + enemy.height/32,
                    enemy.width/30,
                    0, Math.PI * 2
                );
                ctx.fill();
                
                // Right pupil
                ctx.beginPath();
                ctx.arc(
                    enemy.x + enemy.width*2/3 - enemy.width/16,
                    enemy.y + enemy.height/12 + enemy.height/32,
                    enemy.width/30,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            
            // Armor plates
            ctx.fillStyle = COLORS.black;
            
            // Shoulder armor - left
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x - enemy.width/8, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x - enemy.width/10, enemy.y + enemy.height/2);
            ctx.lineTo(enemy.x, enemy.y + enemy.height/2);
            ctx.closePath();
            ctx.fill();
            
            // Shoulder armor - right
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x + enemy.width + enemy.width/8, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x + enemy.width + enemy.width/10, enemy.y + enemy.height/2);
            ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height/2);
            ctx.closePath();
            ctx.fill();
            
            // Chest plate - center ridge
            ctx.fillStyle = '#333333';
            ctx.fillRect(
                enemy.x + enemy.width/2 - enemy.width/16,
                enemy.y + enemy.height/4,
                enemy.width/8,
                enemy.height*3/5
            );
            
            // Add chest armor details - left side plate
            ctx.fillStyle = '#444444';
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/4, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x + enemy.width/2 - enemy.width/16, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x + enemy.width/2 - enemy.width/16, enemy.y + enemy.height*3/4);
            ctx.lineTo(enemy.x + enemy.width/4, enemy.y + enemy.height*2/3);
            ctx.closePath();
            ctx.fill();
            
            // Add chest armor details - right side plate
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2 + enemy.width/16, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x + enemy.width*3/4, enemy.y + enemy.height/4);
            ctx.lineTo(enemy.x + enemy.width*3/4, enemy.y + enemy.height*2/3);
            ctx.lineTo(enemy.x + enemy.width/2 + enemy.width/16, enemy.y + enemy.height*3/4);
            ctx.closePath();
            ctx.fill();
            
            // Belt
            ctx.fillStyle = '#222222';
            ctx.fillRect(
                enemy.x,
                enemy.y + enemy.height*3/4,
                enemy.width,
                enemy.height/12
            );
            
            // Belt buckle
            ctx.fillStyle = '#555555';
            ctx.fillRect(
                enemy.x + enemy.width/2 - enemy.width/10,
                enemy.y + enemy.height*3/4,
                enemy.width/5,
                enemy.height/12
            );
            
            // Leg armor patterns
            ctx.fillStyle = '#333333';
            // Left leg detail
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/4, enemy.y + enemy.height*5/6);
            ctx.lineTo(enemy.x + enemy.width/2 - enemy.width/10, enemy.y + enemy.height*5/6);
            ctx.lineTo(enemy.x + enemy.width/2 - enemy.width/10, enemy.y + enemy.height);
            ctx.lineTo(enemy.x + enemy.width/4, enemy.y + enemy.height);
            ctx.closePath();
            ctx.fill();
            
            // Right leg detail
            ctx.beginPath();
            ctx.moveTo(enemy.x + enemy.width/2 + enemy.width/10, enemy.y + enemy.height*5/6);
            ctx.lineTo(enemy.x + enemy.width*3/4, enemy.y + enemy.height*5/6);
            ctx.lineTo(enemy.x + enemy.width*3/4, enemy.y + enemy.height);
            ctx.lineTo(enemy.x + enemy.width/2 + enemy.width/10, enemy.y + enemy.height);
            ctx.closePath();
            ctx.fill();
            
            // Phase specific features
            if (enemy.attackPhase === 'projectile') {
                // Arms extended
                ctx.fillStyle = COLORS.darkGray;
                
                // Left arm
                ctx.fillRect(
                    enemy.x - enemy.width/2, 
                    enemy.y + enemy.height/3,
                    enemy.width/2,
                    enemy.height/6
                );
                
                // Right arm
                ctx.fillRect(
                    enemy.x + enemy.width, 
                    enemy.y + enemy.height/3,
                    enemy.width/2,
                    enemy.height/6
                );
                
                // Arm armor plates - left
                ctx.fillStyle = '#222222';
                ctx.fillRect(
                    enemy.x - enemy.width/2, 
                    enemy.y + enemy.height/3,
                    enemy.width/4,
                    enemy.height/6
                );
                
                // Arm armor plates - right
                ctx.fillRect(
                    enemy.x + enemy.width + enemy.width/4, 
                    enemy.y + enemy.height/3,
                    enemy.width/4,
                    enemy.height/6
                );
                
                // Energy gathering in hands
                const energyPulse = 0.5 + Math.sin(gameTime * 10) * 0.5; // Pulsing effect
                
                // Left hand energy orb
                ctx.fillStyle = enemy.isInvulnerable ? COLORS.white : `rgba(255, 0, 0, ${energyPulse})`;
                ctx.beginPath();
                ctx.arc(
                    enemy.x - enemy.width/2, 
                    enemy.y + enemy.height/3 + enemy.height/12,
                    enemy.width/8 * (0.8 + energyPulse * 0.4),
                    0, Math.PI * 2
                );
                ctx.fill();
                
                // Energy glow effect
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(
                    enemy.x - enemy.width/2, 
                    enemy.y + enemy.height/3 + enemy.height/12,
                    enemy.width/6 * (0.8 + energyPulse * 0.6),
                    0, Math.PI * 2
                );
                ctx.fill();
                ctx.globalAlpha = 1.0;
                
                // Right hand energy orb
                ctx.fillStyle = enemy.isInvulnerable ? COLORS.white : `rgba(255, 0, 0, ${energyPulse})`;
                ctx.beginPath();
                ctx.arc(
                    enemy.x + enemy.width + enemy.width/2, 
                    enemy.y + enemy.height/3 + enemy.height/12,
                    enemy.width/8 * (0.8 + energyPulse * 0.4),
                    0, Math.PI * 2
                );
                ctx.fill();
                
                // Energy glow effect
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(
                    enemy.x + enemy.width + enemy.width/2, 
                    enemy.y + enemy.height/3 + enemy.height/12,
                    enemy.width/6 * (0.8 + energyPulse * 0.6),
                    0, Math.PI * 2
                );
                ctx.fill();
                ctx.globalAlpha = 1.0;
                
                // Energy particles around hands
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = enemy.width/10 * (1 + energyPulse);
                    const particleSize = enemy.width/30 * (0.5 + Math.random() * 0.5);
                    
                    // Left hand particles
                    ctx.fillStyle = enemy.isInvulnerable ? COLORS.white : `rgba(255, ${Math.floor(Math.random() * 100)}, 0, ${0.5 + Math.random() * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(
                        enemy.x - enemy.width/2 + Math.cos(angle) * distance, 
                        enemy.y + enemy.height/3 + enemy.height/12 + Math.sin(angle) * distance,
                        particleSize,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Right hand particles
                    ctx.beginPath();
                    ctx.arc(
                        enemy.x + enemy.width + enemy.width/2 + Math.cos(angle + Math.PI) * distance, 
                        enemy.y + enemy.height/3 + enemy.height/12 + Math.sin(angle + Math.PI) * distance,
                        particleSize,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
                
                // Energy beam connecting both hands (charging effect)
                if (enemy.attackTimer > 1.5) {
                    const beamOpacity = Math.min(1, (enemy.attackTimer - 1.5) * 2);
                    const beamWidth = enemy.height/20 * beamOpacity;
                    
                    // Create gradient for beam
                    const gradient = ctx.createLinearGradient(
                        enemy.x - enemy.width/2,
                        enemy.y + enemy.height/3 + enemy.height/12,
                        enemy.x + enemy.width + enemy.width/2,
                        enemy.y + enemy.height/3 + enemy.height/12
                    );
                    
                    if (enemy.isInvulnerable) {
                        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
                    } else {
                        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
                        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.8)');
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.2)');
                    }
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(
                        enemy.x - enemy.width/2,
                        enemy.y + enemy.height/3 + enemy.height/12 - beamWidth/2,
                        enemy.width * 2 + enemy.width,
                        beamWidth
                    );
                }
            }
            
            // Draw health bar
            ctx.fillStyle = COLORS.black;
            ctx.fillRect(
                enemy.x, 
                enemy.y - 20,
                enemy.width,
                10
            );
            
            ctx.fillStyle = COLORS.white;
            ctx.fillRect(
                enemy.x, 
                enemy.y - 20,
                (enemy.health / enemy.maxHealth) * enemy.width,
                10
            );
            break;
    }
}

// Function to draw particle
function drawParticle(particle) {
    // Set opacity based on lifetime
    ctx.globalAlpha = 1 - (particle.lifetime / particle.maxLifetime);
    
    if (particle.isBlood) {
        // Blood particle rendering
        ctx.fillStyle = particle.color;
        
        if (particle.isPool) {
            // Blood pool (circle)
            ctx.beginPath();
            ctx.arc(
                particle.x,
                particle.y,
                particle.size * 0.9, // Slightly larger for visibility
                0, Math.PI * 2
            );
            ctx.fill();
            
            // Slow down pool particles
            particle.dx *= 0.95;
            particle.dy *= 0.95;
        } else {
            // Blood droplet
            ctx.beginPath();
            ctx.arc(
                particle.x,
                particle.y,
                particle.size * 0.8, // Slightly larger for visibility
                0, Math.PI * 2
            );
            ctx.fill();
        }
    } else {
        // Regular particle rendering
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
    }
    
    // Update particle lifetime
    particle.lifetime += 1/60; // Assuming 60fps
    particle.x += particle.dx * 1/60;
    particle.y += particle.dy * 1/60;
    
    // Add gravity to blood particles (increased)
    if (particle.isBlood) {
        if (particle.isPool) {
            // Pools barely move
            particle.dy = Math.min(particle.dy, 50);
        } else {
            // Increased gravity - make blood fall faster
            particle.dy += 800 * 1/60;
        }
        
        // Check for collision with platforms - ALWAYS FORM POOLS ON GROUND
        for (const platform of platforms) {
            if (particle.x > platform.x && 
                particle.x < platform.x + platform.width &&
                particle.y + particle.size/2 > platform.y &&
                particle.y - particle.size/2 < platform.y) {
                
                // Always convert to a pool when hitting a platform
                if (!particle.isPool) {
                    particle.isPool = true;
                    particle.y = platform.y;
                    particle.dy = 0;
                    particle.dx *= 0.1; // Slow horizontal movement significantly
                    particle.maxLifetime = Math.min(particle.maxLifetime + 0.5, 1.0); // Shorter pool lifetime (was 1.5, 3.0)
                }
            }
        }
        
        // Check if blood reaches the bottom of the screen (ground)
        if (particle.y > GAME_HEIGHT - 10 && !particle.isPool) {
            particle.isPool = true;
            particle.y = GAME_HEIGHT - 5;
            particle.dy = 0;
            particle.dx *= 0.1;
            particle.maxLifetime = Math.min(particle.maxLifetime + 0.5, 1.0);
        }
    }
    
    // Reset opacity
    ctx.globalAlpha = 1;
}

// Function to draw UI
function drawUI() {
    // Constants for positioning
    const blockSize = 10;
    const blockSpacing = 12;
    const topMargin = 40;
    const starSize = blockSize * 1.2; // Slightly larger for stars
    
    // LIFE label - now first
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
    
    // Position where health ends - will be used for shuriken position
    const healthWidth = (player.maxHealth * blockSpacing) + 10;
    const shurikenStartX = 60 + healthWidth + 10; // Add some spacing between health and shurikens
    
    // Draw available shurikens as yellow stars - no label, just stars
    for (let i = 0; i < player.maxShurikens; i++) {
        const starX = shurikenStartX + (i * blockSpacing) + blockSize/2;
        const starY = topMargin - blockSize/2;
        
        // Draw star outline for all possible slots
        ctx.strokeStyle = COLORS.white;
        drawStar(starX, starY, 5, starSize/2, starSize/4, false, '#333333');
        
        // Fill in the available shurikens as yellow stars
        if (i < player.shurikenCount) {
            drawStar(starX, starY, 5, starSize/2, starSize/4, true, '#FFCC00');
        }
    }
    
    // Draw reload progress for the next shuriken if not full
    if (player.shurikenCount < player.maxShurikens) {
        const reloadProgress = player.shurikenReloadTimer / player.shurikenReloadTime;
        const starX = shurikenStartX + (player.shurikenCount * blockSpacing) + blockSize/2;
        const starY = topMargin - blockSize/2;
        
        // Draw partially filled star to show progress
        if (reloadProgress > 0) {
            ctx.save();
            ctx.beginPath();
            // Create a clipping region based on reload progress
            ctx.rect(starX - starSize/2, starY - starSize/2, 
                     starSize * reloadProgress, starSize);
            ctx.clip();
            // Draw the filled star within the clipping region
            drawStar(starX, starY, 5, starSize/2, starSize/4, true, '#FFCC00');
            ctx.restore();
        }
    }
    
    // Score
    ctx.fillStyle = COLORS.white;
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${player.score.toString().padStart(6, '0')}`, canvas.width - 10, 20);
}

// Helper function to draw a star shape
function drawStar(cx, cy, spikes, outerRadius, innerRadius, fill, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    
    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.strokeStyle = COLORS.white;
    ctx.stroke();
}

// Function to draw Game Over screen
function drawGameOverScreen() {
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
    
    // Show share buttons
    document.getElementById('share-container').style.display = 'block';
    
    // Handle restart
    if (keys[' '] || keys.Space) {
        resetGame();
        gameState = 'playing';
        // Hide share buttons
        document.getElementById('share-container').style.display = 'none';
    }
}

// Function to draw Game Complete screen
function drawGameCompleteScreen() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game Complete text
    ctx.fillStyle = COLORS.white;
    ctx.font = '30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME COMPLETE!', canvas.width/2, canvas.height/3);
    
    // Congratulations text
    ctx.font = '20px monospace';
    ctx.fillText('You defeated the Shadow Master!', canvas.width/2, canvas.height/2 - 20);
    
    // Score display
    ctx.font = '16px monospace';
    ctx.fillText(`FINAL SCORE: ${player.score.toString().padStart(6, '0')}`, canvas.width/2, canvas.height/2 + 20);
    
    // Continue text that blinks
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillText('PRESS SPACE TO PLAY AGAIN', canvas.width/2, canvas.height/2 + 60);
    }
    
    // Show share buttons
    document.getElementById('share-container').style.display = 'block';
    
    // Handle restart
    if (keys[' '] || keys.Space) {
        resetGame();
        gameState = 'playing';
        // Hide share buttons
        document.getElementById('share-container').style.display = 'none';
    }
}

// Function to draw the share button
function drawShareButton(x, y) {
    const buttonWidth = 180;
    const buttonHeight = 50;
    
    // Draw button shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - buttonWidth/2 + 3, y - buttonHeight/2 + 3, buttonWidth, buttonHeight);
    
    // Draw button background with gradient
    const gradient = ctx.createLinearGradient(
        x - buttonWidth/2, y - buttonHeight/2, 
        x - buttonWidth/2, y + buttonHeight/2
    );
    gradient.addColorStop(0, '#4267B2'); // Facebook blue top
    gradient.addColorStop(1, '#365899'); // Facebook blue bottom
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight);
    
    // Draw button border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - buttonWidth/2, y - buttonHeight/2, buttonWidth, buttonHeight);
    
    // Draw button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text with slight shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('SHARE SCORE', x, y);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Store button area for click detection
    shareButtonArea = {
        x: x - buttonWidth/2,
        y: y - buttonHeight/2,
        width: buttonWidth,
        height: buttonHeight
    };
    
    console.log("Share button drawn at:", shareButtonArea);
}

// Function to generate and share a screenshot with score
function shareScore() {
    // Save canvas state
    ctx.save();
    
    // Create a snapshot of the current state
    const gameOverSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Clear canvas and prepare for sharing image
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW NINJA', canvas.width/2, 50);
    
    // Draw score
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`SCORE: ${player.score.toString().padStart(6, '0')}`, canvas.width/2, canvas.height/2);
    
    // Draw a ninja silhouette
    drawNinjaForShare(canvas.width/2, canvas.height/2 - 80);
    
    // Convert canvas to data URL
    try {
        const dataUrl = canvas.toDataURL('image/png');
        
        // Create social media sharing links
        const shareText = `I scored ${player.score} points in Shadow Ninja! Can you beat that?`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
        
        // Create hidden links for sharing
        if (!document.getElementById('twitter-share')) {
            const twitterLink = document.createElement('a');
            twitterLink.id = 'twitter-share';
            twitterLink.style.display = 'none';
            twitterLink.setAttribute('target', '_blank');
            document.body.appendChild(twitterLink);
        }
        
        if (!document.getElementById('facebook-share')) {
            const facebookLink = document.createElement('a');
            facebookLink.id = 'facebook-share';
            facebookLink.style.display = 'none';
            facebookLink.setAttribute('target', '_blank');
            document.body.appendChild(facebookLink);
        }
        
        // Open sharing dialog
        const shareDialog = document.createElement('div');
        shareDialog.style.position = 'fixed';
        shareDialog.style.top = '50%';
        shareDialog.style.left = '50%';
        shareDialog.style.transform = 'translate(-50%, -50%)';
        shareDialog.style.backgroundColor = '#fff';
        shareDialog.style.padding = '20px';
        shareDialog.style.borderRadius = '10px';
        shareDialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        shareDialog.style.zIndex = '1000';
        shareDialog.style.textAlign = 'center';
        
        shareDialog.innerHTML = `
            <h3 style="margin-top:0">Share Your Score</h3>
            <img src="${dataUrl}" width="300" style="max-width:100%;margin:10px 0;border:1px solid #ccc" />
            <div style="margin:15px 0">
                <button id="twitter-btn" style="background:#1DA1F2;color:white;border:none;padding:8px 15px;margin:5px;border-radius:5px;cursor:pointer">Twitter</button>
                <button id="facebook-btn" style="background:#3b5998;color:white;border:none;padding:8px 15px;margin:5px;border-radius:5px;cursor:pointer">Facebook</button>
                <button id="download-btn" style="background:#4CAF50;color:white;border:none;padding:8px 15px;margin:5px;border-radius:5px;cursor:pointer">Download</button>
            </div>
            <button id="close-share" style="background:#f44336;color:white;border:none;padding:8px 15px;margin-top:5px;border-radius:5px;cursor:pointer">Close</button>
        `;
        
        document.body.appendChild(shareDialog);
        
        // Add event listeners
        document.getElementById('twitter-btn').addEventListener('click', function() {
            window.open(twitterUrl, '_blank');
        });
        
        document.getElementById('facebook-btn').addEventListener('click', function() {
            window.open(facebookUrl, '_blank');
        });
        
        document.getElementById('download-btn').addEventListener('click', function() {
            const downloadLink = document.createElement('a');
            downloadLink.href = dataUrl;
            downloadLink.download = 'shadow-ninja-score.png';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        });
        
        document.getElementById('close-share').addEventListener('click', function() {
            document.body.removeChild(shareDialog);
            
            // Restore canvas state
            ctx.putImageData(gameOverSnapshot, 0, 0);
            ctx.restore();
        });
        
    } catch (error) {
        console.error('Error creating or sharing screenshot:', error);
        // Restore canvas state
        ctx.putImageData(gameOverSnapshot, 0, 0);
        ctx.restore();
    }
}

// Function to draw a ninja silhouette for the share image
function drawNinjaForShare(x, y) {
    ctx.fillStyle = '#FFFFFF';
    
    // Ninja body
    ctx.beginPath();
    ctx.ellipse(x, y + 30, 15, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Ninja head
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Ninja scarf
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 5);
    ctx.lineTo(x - 25, y - 15);
    ctx.lineTo(x - 20, y - 5);
    ctx.lineTo(x - 5, y + 5);
    ctx.fill();
    
    // Ninja sword
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(x + 10, y - 30, 2, 60);
    
    // Throwing star
    drawStar(x + 30, y, 5, 8, 4, true, '#FFCC00');
}

// Function to check if all enemies in a stage are defeated
function checkStageClear() {
    if (enemies.length === 0) {
        stage++;
        loadStage(stage);
        
        // Refill shurikens when moving to the next stage
        player.shurikenCount = player.maxShurikens;
        player.shurikenReloadTimer = 0;
    }
}

// Variable to track share button area
let shareButtonArea = null;

// Add click event listener for share button (using a named function for clarity)
function handleCanvasClick(event) {
    console.log("Canvas clicked, gameState:", gameState);
    
    // Only process clicks if we're in game over or game complete state and share button is visible
    if ((gameState === 'gameOver' || gameState === 'gameComplete') && shareButtonArea) {
        console.log("In correct state with shareButtonArea:", shareButtonArea);
        
        // Get canvas-relative mouse position with proper scaling
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;
        
        console.log("Click position:", mouseX, mouseY);
        
        // Check if click is within share button area
        if (mouseX >= shareButtonArea.x && 
            mouseX <= shareButtonArea.x + shareButtonArea.width &&
            mouseY >= shareButtonArea.y && 
            mouseY <= shareButtonArea.y + shareButtonArea.height) {
            console.log("Share button clicked!");
            shareScore();
        }
    }
}

// Remove any existing click listener and add the new one
canvas.removeEventListener('click', handleCanvasClick);
canvas.addEventListener('click', handleCanvasClick);

// Function to update enemies
function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Animation timer for all enemies
        enemy.animTimer += dt;
        if (enemy.animTimer >= 0.2) { // Frame rate of animation
            enemy.animFrame = (enemy.animFrame + 1) % 4; // 4 frames of animation
            enemy.animTimer = 0;
        }
        
        // Debug boss health
        if (enemy.type === 'boss') {
            console.log(`Boss update: health=${enemy.health}, invulnerable=${enemy.isInvulnerable}`);
        }
        
        // Enemy behavior based on type
        switch(enemy.type) {
            case 'patrol':
                // Basic horizontal patrol
                enemy.x += enemy.speed * enemy.direction * dt;
                
                // Check for platform edges or obstacles
                let onPlatform = false;
                let hitWall = false;
                
                for (const platform of platforms) {
                    // Check if on platform
                    if (enemy.x + enemy.width > platform.x &&
                        enemy.x < platform.x + platform.width &&
                        enemy.y + enemy.height >= platform.y &&
                        enemy.y + enemy.height <= platform.y + 10) {
                        onPlatform = true;
                    }
                    
                    // Check collision with wall
                    if ((enemy.direction > 0 && 
                         enemy.x + enemy.width + 5 >= platform.x &&
                         enemy.x + enemy.width <= platform.x + 5 &&
                         enemy.y + enemy.height > platform.y &&
                         enemy.y < platform.y + platform.height) ||
                        (enemy.direction < 0 && 
                         enemy.x - 5 <= platform.x + platform.width &&
                         enemy.x >= platform.x + platform.width - 5 &&
                         enemy.y + enemy.height > platform.y &&
                         enemy.y < platform.y + platform.height)) {
                        hitWall = true;
                    }
                }
                
                // Check for edge of current platform
                const aheadX = enemy.x + enemy.width + (10 * enemy.direction);
                const aheadY = enemy.y + enemy.height + 5;
                let aheadOnPlatform = false;
                
                for (const platform of platforms) {
                    if (aheadX >= platform.x && 
                        aheadX <= platform.x + platform.width &&
                        aheadY >= platform.y &&
                        aheadY <= platform.y + 10) {
                        aheadOnPlatform = true;
                    }
                }
                
                // Turn around at edges or walls
                if (!aheadOnPlatform || hitWall) {
                    enemy.direction *= -1;
                }
                
                break;
            
            case 'flyer':
                // Flying enemy with sine wave pattern
                enemy.x += enemy.speed * enemy.direction * dt;
                
                // Calculate y position based on sine wave
                const time = Date.now() / 1000; // Time in seconds
                enemy.yOffset = Math.sin(time * enemy.frequency) * enemy.amplitude;
                
                // Bounce off screen edges
                if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_WIDTH) {
                    enemy.direction *= -1;
                }
                
                break;
                
            case 'jumper':
                // Apply gravity
                enemy.dy += GRAVITY * dt;
                enemy.y += enemy.dy * dt;
                
                // Horizontal movement
                enemy.x += enemy.speed * enemy.direction * dt;
                
                // Check platform collisions
                enemy.onGround = false;
                for (const platform of platforms) {
                    if (enemy.x + enemy.width > platform.x &&
                        enemy.x < platform.x + platform.width &&
                        enemy.y + enemy.height > platform.y &&
                        enemy.y + enemy.height < platform.y + platform.height) {
                        enemy.y = platform.y - enemy.height;
                        enemy.dy = 0;
                        enemy.onGround = true;
                    }
                }
                
                // Screen boundaries
                if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_WIDTH) {
                    enemy.direction *= -1;
                }
                
                // Jump logic
                if (enemy.onGround) {
                    enemy.jumpCooldown -= dt;
                    if (enemy.jumpCooldown <= 0) {
                        enemy.dy = -enemy.jumpPower;
                        enemy.jumpCooldown = enemy.jumpInterval;
                        enemy.onGround = false;
                    }
                }
                
                break;
                
            case 'thrower':
                // Projectile throwing enemy
                enemy.attackCooldown -= dt;
                
                // Face player
                if (player.x < enemy.x) {
                    enemy.direction = -1;
                } else {
                    enemy.direction = 1;
                }
                
                // Attack if cooldown expired and player is in range
                const distanceToPlayer = Math.abs(player.x - enemy.x);
                if (enemy.attackCooldown <= 0 && distanceToPlayer < 300) {
                    // Calculate angle to player
                    const dx = player.x + player.width/2 - (enemy.x + enemy.width/2);
                    const dy = player.y + player.height/2 - (enemy.y + enemy.height/2);
                    const angle = Math.atan2(dy, dx);
                    
                    // Create projectile
                    projectiles.push({
                        x: enemy.x + enemy.width/2,
                        y: enemy.y + enemy.height/3,
                        width: 15,
                        height: 15,
                        dx: Math.cos(angle) * 150,
                        dy: Math.sin(angle) * 150,
                        damage: 1,
                        lifetime: 0,
                        type: 'enemy_shuriken',
                        fromPlayer: false
                    });
                    
                    enemy.attackCooldown = enemy.attackInterval;
                }
                
                break;
            
            case 'boss':
                // Update invulnerability timer
                if (enemy.isInvulnerable) {
                    enemy.invulnerableTimer -= dt;
                    if (enemy.invulnerableTimer <= 0) {
                        enemy.isInvulnerable = false;
                    }
                }
                
                // CRITICAL FIX: Boss position tracking
                // Log every frame to catch when the boss is about to disappear
                console.log(`Boss tracking - x:${enemy.x.toFixed(1)}, y:${enemy.y.toFixed(1)}, phase:${enemy.attackPhase}, onGround:${enemy.onGround}, dy:${enemy.dy.toFixed(1)}`);
                
                // SUPER AGGRESSIVE BOUNDARY ENFORCEMENT
                // These bounds checks run EVERY FRAME regardless of phase
                const minX = 20;
                const maxX = GAME_WIDTH - enemy.width - 20;
                const minY = 20;
                const maxY = GAME_HEIGHT - enemy.height - 20;
                
                // Forcefully clamp the boss position within these bounds
                if (enemy.x < minX) enemy.x = minX;
                if (enemy.x > maxX) enemy.x = maxX;
                if (enemy.y < minY) enemy.y = minY;
                if (enemy.y > maxY) enemy.y = maxY;
                
                // Failsafe to ensure boss is always on screen
                if (enemy.y > GAME_HEIGHT || enemy.y < 0 || enemy.x > GAME_WIDTH || enemy.x < 0) {
                    console.log("FAILSAFE: Boss was outside screen bounds! Resetting position.");
                    // If boss somehow goes off screen, force it back to a visible position
                    if (enemy.attackPhase === 2) {
                        // If in projectile phase, place at one of the corners
                        enemy.currentCorner = enemy.currentCorner || 'topLeft';
                        const cornerPos = {
                            topLeft: {x: 50, y: 80},
                            topRight: {x: GAME_WIDTH - enemy.width - 50, y: 80}
                        }[enemy.currentCorner];
                        enemy.x = cornerPos.x;
                        enemy.y = cornerPos.y;
                    } else {
                        // If in other phases, place at center of stage
                        enemy.x = GAME_WIDTH/2 - enemy.width/2;
                        enemy.y = GAME_HEIGHT - enemy.height - 50;
                    }
                    enemy.dy = 0; // Reset vertical momentum
                }
                
                // Phase timer
                enemy.phaseTimer -= dt;

                if (enemy.phaseTimer <= 0) {
                    // Previous phase
                    const oldPhase = enemy.attackPhase;
                    
                    // Change to next attack phase
                    enemy.attackPhase = (enemy.attackPhase + 1) % 3;
                    enemy.phaseTimer = 4; // 4 seconds per phase
                    enemy.isInvulnerable = false;
                    
                    // Reset currentCorner when changing phases
                    if (enemy.attackPhase !== 2) {
                        enemy.currentCorner = null;
                    }
                    
                    // Create intense thunder effect for phase transition
                    screenFlash.active = true;
                    screenFlash.duration = 0.4;
                    screenFlash.intensity = 0.8;
                    
                    // Generate multiple lightning bolts for dramatic effect
                    lightning.active = true;
                    lightning.timer = 0;
                    lightning.bolts = [];
                    
                    // Create 3-5 lightning bolts
                    const numBolts = Math.floor(Math.random() * 3) + 3;
                    for (let i = 0; i < numBolts; i++) {
                        const startX = Math.random() * GAME_WIDTH;
                        
                        lightning.bolts.push({
                            startX: startX,
                            startY: 0,
                            endY: GAME_HEIGHT * (0.5 + Math.random() * 0.5),
                            width: 2 + Math.random() * 3,
                            segmentLength: 10 + Math.random() * 20,
                            jitter: 40 + Math.random() * 60
                        });
                    }
                    
                    console.log(`Boss phase changed: ${oldPhase} -> ${enemy.attackPhase} with thunder effect`);
                    
                    // Visual effect when entering projectile phase
                    if (enemy.attackPhase === 2) {
                        console.log("Boss entering projectile phase!");
                        // Create effect particles
                        for (let i = 0; i < 20; i++) {
                            particles.push({
                                x: enemy.x + enemy.width/2,
                                y: enemy.y + enemy.height/2,
                                dx: (Math.random() - 0.5) * 100,
                                dy: (Math.random() - 0.5) * 100,
                                size: 4 + Math.random() * 4,
                                color: COLORS.white,
                                lifetime: 0,
                                maxLifetime: 0.2 + Math.random() * 0.2 // Much shorter lifetime (was 0.3 + 0.3)
                            });
                        }
                    }
                }
                
                // Flash timer for damage indication
                if (enemy.flashTimer > 0) {
                    enemy.flashTimer -= dt;
                }
                
                // Boss behavior based on attack phase
                switch(enemy.attackPhase) {
                    case 0: // Ground attack phase - chase player
                        if (enemy.onGround) {
                            // Move towards player
                            enemy.direction = player.x < enemy.x ? -1 : 1;
                            enemy.x += enemy.speed * enemy.direction * dt;
                            
                            // Occasionally release a shockwave
                            if (Math.random() < 0.01) {
                                // Create ground shockwaves
                                for (let dir = -1; dir <= 1; dir += 2) {
                                    projectiles.push({
                                        x: enemy.x + enemy.width/2,
                                        y: GAME_HEIGHT - 50,
                                        width: 30,
                                        height: 10,
                                        dx: dir * 200,
                                        dy: 0,
                                        damage: 1,
                                        lifetime: 0,
                                        type: 'shockwave',
                                        fromPlayer: false
                                    });
                                }
                            }
                        }
                        break;
                        
                    case 1: // Jump attack phase
                        if (enemy.onGround && enemy.phaseTimer < 3.5) {
                            // Jump towards player
                            enemy.dy = -enemy.jumpPower;
                            enemy.onGround = false;
                            enemy.direction = player.x < enemy.x ? -1 : 1;
                            
                            // Aim jump to land near player
                            const distanceToPlayer = player.x - enemy.x;
                            const jumpDistance = enemy.jumpPower * 0.3; // Adjust as needed
                            enemy.dx = Math.min(Math.max(distanceToPlayer * 0.5, -jumpDistance), jumpDistance);
                        }
                        
                        // While in air, generate falling projectiles
                        if (!enemy.onGround && Math.random() < 0.05) {
                            projectiles.push({
                                x: Math.random() * (GAME_WIDTH - 20),
                                y: 0,
                                width: 20,
                                height: 20,
                                dx: 0,
                                dy: 200 + Math.random() * 100,
                                damage: 1,
                                lifetime: 0,
                                type: 'energyBall',
                                fromPlayer: false
                            });
                        }
                        
                        // Apply gravity
                        enemy.dy += GRAVITY * dt;
                        enemy.x += enemy.dx * dt;
                        enemy.y += enemy.dy * dt;
                        
                        // Check platform collisions
                        enemy.onGround = false;
                        for (const platform of platforms) {
                            if (enemy.x + enemy.width > platform.x &&
                                enemy.x < platform.x + platform.width &&
                                enemy.y + enemy.height > platform.y &&
                                enemy.y + enemy.height < platform.y + platform.height) {
                                enemy.y = platform.y - enemy.height;
                                enemy.dy = 0;
                                enemy.onGround = true;
                                
                                // Create landing shockwave
                                if (enemy.dy > 200) {
                                    for (let dir = -1; dir <= 1; dir += 1) {
                                        projectiles.push({
                                            x: enemy.x + enemy.width/2,
                                            y: enemy.y + enemy.height - 10,
                                            width: 40,
                                            height: 10,
                                            dx: dir * 150,
                                            dy: 0,
                                            damage: 1,
                                            lifetime: 0,
                                            type: 'shockwave',
                                            fromPlayer: false
                                        });
                                    }
                                }
                            }
                        }
                        
                        // Screen boundaries
                        if (enemy.x < 0) enemy.x = 0;
                        if (enemy.x + enemy.width > GAME_WIDTH) enemy.x = GAME_WIDTH - enemy.width;
                        if (enemy.y + enemy.height > GAME_HEIGHT) {
                            enemy.y = GAME_HEIGHT - enemy.height;
                            enemy.dy = 0;
                            enemy.onGround = true;
                        }
                        break;
                        
                    case 2: // Projectile barrage phase
                        // Make boss fly to a corner and fire projectiles in patterns
                        enemy.onGround = false; // Boss is always in the air during this phase
                        
                        // COMPLETE POSITION OVERRIDE SYSTEM FOR PROJECTILE PHASE
                        // This completely takes over position control during this phase
                        
                        // Initialize corner position if not set
                        if (!enemy.currentCorner) {
                            enemy.currentCorner = Math.random() < 0.5 ? 'topLeft' : 'topRight';
                            console.log("Boss initialized corner:", enemy.currentCorner);
                        }
                        
                        // Define corner positions with VERY conservative bounds
                        const cornerPositions = {
                            topLeft: {x: 80, y: 100},
                            topRight: {x: GAME_WIDTH - enemy.width - 80, y: 100}
                        };
                        
                        // Target position based on current corner
                        const targetX = cornerPositions[enemy.currentCorner].x;
                        const targetY = cornerPositions[enemy.currentCorner].y;
                        
                        // Calculate distance to target
                        const dx = targetX - enemy.x;
                        const dy = targetY - enemy.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Move towards the target corner
                        const moveSpeed = 150;
                        
                        if (distance > 5) {
                            // Normal movement when far from target
                            enemy.x += (dx / distance) * moveSpeed * dt;
                            enemy.y += (dy / distance) * moveSpeed * dt;
                        } else {
                            // When at target, make small hovering movements
                            enemy.x = targetX + Math.sin(Date.now() / 500) * 5;
                            enemy.y = targetY + Math.sin(Date.now() / 700) * 5;
                        }
                        
                        // CRITICAL: Cancel ALL physics effects
                        enemy.dy = 0;
                        enemy.dx = 0;
                        
                        // Switch corners less frequently (only 0.5% chance per frame)
                        if (Math.random() < 0.005 * dt) {
                            enemy.currentCorner = enemy.currentCorner === 'topLeft' ? 'topRight' : 'topLeft';
                            console.log("Boss switched corner to:", enemy.currentCorner);
                        }
                        
                        // Fire projectiles in patterns
                        if (enemy.phaseTimer < 3.8 && enemy.phaseTimer % 0.5 < 0.05) {
                            // Fire projectiles in a pattern
                            const projectileCount = 5; // Number of projectiles in the barrage
                            
                            // Create spiral pattern
                            for (let i = 0; i < projectileCount; i++) {
                                const angle = (i / projectileCount) * Math.PI * 2 + enemy.phaseTimer;
                                projectiles.push({
                                    x: enemy.x + enemy.width/2,
                                    y: enemy.y + enemy.height/2,
                                    width: 15,
                                    height: 15,
                                    dx: Math.cos(angle) * 150,
                                    dy: Math.sin(angle) * 150,
                                    damage: 1,
                                    lifetime: 0,
                                    type: 'energyBall',
                                    fromPlayer: false
                                });
                            }
                        }
                        
                        // Boss is vulnerable during this phase
                        enemy.isInvulnerable = false;
                        
                        // Very strict screen boundaries check to ensure boss doesn't go off-screen
                        if (enemy.x < 20) {
                            enemy.x = 20;
                            console.log("Boss hit left boundary");
                        }
                        if (enemy.x + enemy.width > GAME_WIDTH - 20) {
                            enemy.x = GAME_WIDTH - enemy.width - 20;
                            console.log("Boss hit right boundary");
                        }
                        if (enemy.y < 20) {
                            enemy.y = 20;
                            console.log("Boss hit top boundary");
                        }
                        if (enemy.y > GAME_HEIGHT / 3) {
                            enemy.y = GAME_HEIGHT / 3;
                            console.log("Boss hit bottom boundary");
                        }
                        
                        // Double-check that corner is still set
                        if (!enemy.currentCorner) {
                            console.log("Boss lost corner tracking! Resetting to topLeft");
                            enemy.currentCorner = 'topLeft';
                        }
                        
                        // Log boss position to debug disappearance issue
                        console.log(`Boss position: x=${enemy.x.toFixed(1)}, y=${enemy.y.toFixed(1)}, corner=${enemy.currentCorner}`);
                        
                        break;
                }
                break;
        }
        
        // Check if enemy is dead
        if (enemy.health <= 0) {
            // Log boss death
            if (enemy.type === 'boss') {
                console.log("Boss is being removed, health is now zero");
            }
            
            // Add death animation/particles
            createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            
            // Add score
            if (enemy.type === 'boss') {
                console.log("Boss defeated! Health was:", enemy.health);
                // Boss death - big explosion and high score
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        createExplosion(
                            enemy.x + Math.random() * enemy.width,
                            enemy.y + Math.random() * enemy.height
                        );
                    }, i * 200);
                }
                player.score += 5000;
                
                // Clear all projectiles immediately
                projectiles = [];
                
                // Player completed the game - immediate transition to game complete
                gameState = 'game_complete';
                
                // Remove enemy immediately
                enemies.splice(i, 1);
                return; // Exit the loop to prevent further processing
            } else {
                player.score += 100;
                
                // Remove regular enemy
                enemies.splice(i, 1);
            }
        }
    }
}

// Function to create explosion particles
function createExplosion(x, y) {
    // Create blood particles - reduced quantity
    for (let i = 0; i < 8; i++) { // Reduced from 20 to 8
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 50; // Reduced speed
        const size = 2 + Math.random() * 3; // Smaller size
        
        particles.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size: size,
            color: '#990000', // Darker red (was #BB5555)
            lifetime: 0,
            maxLifetime: 0.2 + Math.random() * 0.2, // Much shorter lifetime (was 0.4 + 0.4)
            isBlood: true
        });
    }
    
    // Create a blood splatter pattern - reduced
    for (let i = 0; i < 3; i++) { // Reduced from 8 to 3
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 15; // Smaller distance
        const splatterX = x + Math.cos(angle) * distance;
        const splatterY = y + Math.sin(angle) * distance;
        
        // Create blood pool - smaller and shorter-lived
        particles.push({
            x: splatterX,
            y: splatterY,
            dx: Math.cos(angle) * 5,
            dy: Math.sin(angle) * 5 + 10, // Less movement
            size: 3 + Math.random() * 4, // Smaller pools
            color: '#990000', // Darker red (was #BB5555)
            lifetime: 0,
            maxLifetime: 0.4 + Math.random() * 0.3, // Shorter lifetime (was 0.8 + 0.5)
            isBlood: true,
            isPool: true
        });
    }
}

// Function to check collisions
function checkCollisions() {
    // Player projectiles against enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        
        // Only check player projectiles
        if (proj.fromPlayer) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                // Simple collision detection
                if (proj.x < enemy.x + enemy.width &&
                    proj.x + proj.width > enemy.x &&
                    proj.y < enemy.y + enemy.height &&
                    proj.y + proj.height > enemy.y) {
                    
                    // Special handling for boss - check invulnerability
                    if (enemy.type === 'boss' && enemy.isInvulnerable) {
                        console.log("Boss deflected a projectile (invulnerable)");
                        // Boss is invulnerable - create deflect effect
                        for (let k = 0; k < 3; k++) {
                            particles.push({
                                x: proj.x,
                                y: proj.y,
                                dx: -proj.dx * 0.5 + (Math.random() - 0.5) * 20,
                                dy: (Math.random() - 0.5) * 20,
                                size: 2 + Math.random() * 2,
                                color: COLORS.white,
                                lifetime: 0,
                                maxLifetime: 0.2 + Math.random() * 0.2 // Much shorter lifetime (was 0.3 + 0.3)
                            });
                        }
                        // Remove projectile
                        projectiles.splice(i, 1);
                        break;
                    }
                    
                    // Damage enemy if not an invulnerable boss
                    if (enemy.type === 'boss') {
                        console.log("Boss hit by projectile before damage:", enemy.health);
                    }
                    
                    // Only damage if it's not a boss that's invulnerable
                    if (!(enemy.type === 'boss' && enemy.isInvulnerable)) {
                        // Only damage enemies with positive health
                        if (enemy.health > 0) {
                            enemy.health--;
                            
                            // Set boss invulnerability and flash effect
                            if (enemy.type === 'boss') {
                                console.log("Boss hit! Health remaining:", enemy.health);
                                enemy.isInvulnerable = true;
                                enemy.invulnerableTimer = 0.5;
                                enemy.flashTimer = 0.5;
                                
                                // If boss is in projectile phase (phase 2), force return to ground attacks
                                if (enemy.attackPhase === 2) {
                                    console.log("Boss hit during projectile phase! Returning to ground attacks.");
                                    enemy.attackPhase = 0; // Return to ground attacks (phase 0)
                                    enemy.phaseTimer = 4; // Reset phase timer
                                    enemy.onGround = false; // Will fall back down
                                    enemy.dy = 100; // Slight downward momentum
                                    enemy.currentCorner = null; // Reset corner selection
                                }
                            }
                        }
                    }
                    
                    // Create small hit effect
                    for (let k = 0; k < 6; k++) { // Reduced from 12 to 6
                        particles.push({
                            x: proj.x,
                            y: proj.y,
                            dx: (Math.random() - 0.5) * 15 + (proj.dx * 0.2), // Less momentum
                            dy: Math.random() * 25 + 5, // Less vertical movement
                            size: 2 + Math.random() * 2, // Smaller size
                            color: '#990000', // Darker red (was #BB5555)
                            lifetime: 0,
                            maxLifetime: 0.2 + Math.random() * 0.2, // Much shorter lifetime (was 0.3 + 0.3)
                            isBlood: true // Mark as blood particle for special rendering
                        });
                    }
                    
                    // Remove projectile
                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Enemy projectiles against player
            if (proj.x < player.x + player.width &&
                proj.x + proj.width > player.x &&
                proj.y < player.y + player.height &&
                proj.y + proj.height > player.y &&
                player.invulnerable <= 0) {
                
                // Damage player
                player.health--;
                player.invulnerable = 1.5; // 1.5 second invulnerability
                
                // Knockback effect
                const knockbackDir = player.x < enemy.x ? -1 : 1;
                player.dx = knockbackDir * 150;
                player.dy = -200;
                
                // Create hit effect
                for (let k = 0; k < 5; k++) { // Reduced from 10 to 5
                    particles.push({
                        x: player.x + player.width/2,
                        y: player.y + player.height/2,
                        dx: (Math.random() - 0.5) * 25, // Reduced spread
                        dy: Math.random() * 20 + 5, // Less vertical movement
                        size: 1 + Math.random() * 3, // Smaller size
                        color: '#990000', // Darker red (was #BB5555)
                        lifetime: 0,
                        maxLifetime: 0.3 + Math.random() * 0.3, // Shorter lifetime
                        isBlood: true // Mark as blood particle for special rendering
                    });
                }
                
                break;
            }
        }
    }
    
    // Player collision with enemies
    if (player.invulnerable <= 0) {
        for (const enemy of enemies) {
            if (player.x < enemy.x + enemy.width &&
                player.x + player.width > enemy.x &&
                player.y < enemy.y + enemy.height &&
                player.y + player.height > enemy.y) {
                
                // Special handling for boss
                if (enemy.type === 'boss') {
                    console.log("Player collided with boss");
                    // Player jumped on boss head - damage boss instead
                    if (player.dy > 0 && player.y + player.height < enemy.y + enemy.height/2) {
                        console.log("Player jumped on boss head, invulnerable:", enemy.isInvulnerable);
                        
                        // Only damage the boss if it's not currently invulnerable
                        if (!enemy.isInvulnerable && enemy.health > 0) {
                            console.log("Damaging boss from head jump");
                            enemy.health--;
                            console.log("Boss head hit! Health remaining:", enemy.health);
                            
                            // Set boss flash effect
                            enemy.isInvulnerable = true;
                            enemy.invulnerableTimer = 0.5;
                            enemy.flashTimer = 0.5;
                            
                            // Create hit effect
                            for (let k = 0; k < 5; k++) { // Reduced from 10 to 5
                                particles.push({
                                    x: enemy.x + Math.random() * enemy.width,
                                    y: enemy.y + Math.random() * enemy.height/4, // Focus on head area
                                    dx: (Math.random() - 0.5) * 25, // Reduced spread
                                    dy: Math.random() * 20 + 5, // Less vertical movement
                                    size: 1 + Math.random() * 3, // Smaller size
                                    color: '#990000', // Darker red (was #BB5555)
                                    lifetime: 0,
                                    maxLifetime: 0.2 + Math.random() * 0.2, // Much shorter lifetime (was 0.3 + 0.3)
                                    isBlood: true // Mark as blood particle for special rendering
                                });
                            }
                        } else {
                            console.log("Boss blocked head jump (invulnerable)");
                        }
                        
                        // Set the player to jump off the boss
                        player.dy = -350;
                        continue; // Skip the rest of damage code
                    }
                }
                
                // Damage player
                player.health--;
                player.invulnerable = 1.5; // 1.5 second invulnerability
                
                break;
            }
        }
    }
}