// Handle user input
function handleInput(dt) {
    // Reset speed first
    player.dx = 0;
    
    // Left/Right movement
    if (keys.ArrowLeft) {
        player.dx = -player.speed;
        player.facing = -1;
        player.state = player.canJump ? 'run' : player.state;
    } else if (keys.ArrowRight) {
        player.dx = player.speed;
        player.facing = 1;
        player.state = player.canJump ? 'run' : player.state;
    } else if (player.canJump) {
        player.state = 'idle';
    }
    
    // Wall Jump cooldown
    if (player.wallJumpCooldown > 0) {
        player.wallJumpCooldown -= dt;
    }
    
    // Jump
    if ((keys.ArrowUp || keys.z)) {
        if (player.canJump) {
            // Regular jump
            player.dy = -player.jumpStrength;
            player.canJump = false;
            player.state = 'jump';
        } else if (player.wallCling && player.wallJumpCooldown <= 0 && player.wallJumps < player.maxWallJumps) {
            // Wall jump - push away from wall and upward
            player.dy = -player.jumpStrength * 0.9;
            player.dx = player.wallDirection * player.speed * 1.1;
            player.wallCling = false;
            player.wallSliding = false;
            player.state = 'jump';
            player.wallJumps++;
            player.wallJumpCooldown = 0.15; // Short cooldown between wall jumps
            
            // REMOVED: Wall jump particle effect has been removed
        }
    }
    
    // Attack
    if (keys.x && !player.attacking) {
        // Only allow attack if player has shurikens available
        if (player.shurikenCount > 0) {
            player.attacking = true;
            player.attackTimer = 0;
            player.shurikenCount--; // Use one shuriken
            
            // Create shuriken projectile
            projectiles.push({
                x: player.x + (player.facing > 0 ? player.width : 0),
                y: player.y + player.height/2 - 5,
                width: 10,
                height: 10,
                dx: player.facing * 300,
                dy: 0,
                damage: 1,
                lifetime: 0,
                type: 'shuriken',
                fromPlayer: true
            });
        }
    }
}