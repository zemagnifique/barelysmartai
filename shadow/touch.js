// Touch controls handling
document.addEventListener('DOMContentLoaded', function() {
    // Create a global object to track touch controls
    window.touchControls = {
        left: false,
        right: false,
        jump: false,
        attack: false,
        space: false
    };
    
    // Track active touches and their associated buttons
    const activeTouches = new Map();
    
    // Helper function to get button element from touch coordinates
    function getButtonFromTouch(touch) {
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
        return elements.find(el => el.classList.contains('control-button'));
    }
    
    // Helper function to get control key from button ID
    function getControlFromButton(button) {
        const buttonMap = {
            'left-button': 'left',
            'right-button': 'right',
            'jump-button': 'jump',
            'attack-button': 'attack',
            'space-button': 'space'
        };
        return buttonMap[button.id];
    }
    
    // Helper function to reset all controls
    function resetAllControls() {
        Object.keys(touchControls).forEach(key => {
            touchControls[key] = false;
        });
        document.querySelectorAll('.control-button').forEach(button => {
            button.style.backgroundColor = '#306630';
        });
        activeTouches.clear();
    }
    
    // Add touch event listeners to the mobile controls container
    const mobileControls = document.getElementById('mobile-controls');
    
    mobileControls.addEventListener('touchstart', function(e) {
        e.preventDefault();
        
        // Handle each new touch
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const button = getButtonFromTouch(touch);
            
            if (button) {
                const control = getControlFromButton(button);
                if (control) {
                    activeTouches.set(touch.identifier, {
                        button: button,
                        control: control
                    });
                    touchControls[control] = true;
                    button.style.backgroundColor = '#8bac8b';
                }
            }
        }
    }, { passive: false });
    
    mobileControls.addEventListener('touchmove', function(e) {
        e.preventDefault();
        
        // Check if touches have moved off their original buttons
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchInfo = activeTouches.get(touch.identifier);
            
            if (touchInfo) {
                const currentButton = getButtonFromTouch(touch);
                if (currentButton !== touchInfo.button) {
                    // Touch has moved off the button
                    touchControls[touchInfo.control] = false;
                    touchInfo.button.style.backgroundColor = '#306630';
                    activeTouches.delete(touch.identifier);
                }
            }
        }
    }, { passive: false });
    
    mobileControls.addEventListener('touchend', function(e) {
        e.preventDefault();
        
        // Remove ended touches and reset their controls
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const touchInfo = activeTouches.get(touch.identifier);
            
            if (touchInfo) {
                touchControls[touchInfo.control] = false;
                touchInfo.button.style.backgroundColor = '#306630';
                activeTouches.delete(touch.identifier);
            }
        }
    }, { passive: false });
    
    mobileControls.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        resetAllControls();
    }, { passive: false });
    
    // Reset controls when window loses focus
    window.addEventListener('blur', resetAllControls);
    
    // Reset controls when switching tabs
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            resetAllControls();
        }
    });
    
    // Function to update space button visibility based on game state
    function updateSpaceButtonVisibility() {
        const spaceButton = document.getElementById('space-button');
        
        if (window.gameState === 'start_screen') {
            spaceButton.innerText = 'START';
            spaceButton.style.display = 'flex';
        } else if (window.gameState === 'game_over' || window.gameState === 'game_complete') {
            spaceButton.innerText = 'RESTART';
            spaceButton.style.display = 'flex';
        } else if (window.gameState === 'playing') {
            // Hide the space button during gameplay
            spaceButton.style.display = 'none';
        }
    }
    
    // Handle touch controls in game loop
    const gameLoop = function() {
        // Map touch controls to key presses
        if (window.keys) {
            keys.ArrowLeft = keys.ArrowLeft || touchControls.left;
            keys.ArrowRight = keys.ArrowRight || touchControls.right;
            keys.z = keys.z || touchControls.jump;
            keys.x = keys.x || touchControls.attack;
            keys[' '] = keys[' '] || touchControls.space;
        }
        
        // Update space button visibility
        if (window.gameState) {
            updateSpaceButtonVisibility();
        }
        
        requestAnimationFrame(gameLoop);
    };
    
    // Show mobile controls on touch devices
    if (('ontouchstart' in window) || window.innerWidth <= 820) {
        mobileControls.style.display = 'block';
        updateSpaceButtonVisibility();
    }
    
    gameLoop();
});