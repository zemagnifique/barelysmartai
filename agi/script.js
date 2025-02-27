document.addEventListener('DOMContentLoaded', () => {
    const terminalLog = document.querySelector('.terminal-log');
    const cursor = document.querySelector('.cursor');
    const terminal = document.querySelector('.terminal');
    const eye = document.querySelector('.eye');
    const aboutPage = document.querySelector('.about-page');
    const aboutLink = document.querySelector('#about-link');
    const backLink = document.querySelector('#back-link');

    if (cursor) {
        cursor.style.display = 'inline'; // Ensure cursor is visible
    }

    // Vibration helper function
    const vibrateElements = () => {
        if (terminal && eye) {
            terminal.classList.add('vibrate');
            eye.classList.add('eye-vibrate');
            setTimeout(() => {
                terminal.classList.remove('vibrate');
                eye.classList.remove('eye-vibrate');
            }, 200); // Match the animation duration for consistency
        }
    };

    // Handle global keystrokes
    document.addEventListener('keypress', (event) => {
        // Ignore keystrokes when the About page is visible
        if (aboutPage && aboutPage.style.display === 'block') return;

        const input = event.key;
        // Vibrate on keystroke
        vibrateElements();

        if (input === 'Enter') {
            // Handle Enter key for commands
            const currentText = terminalLog.textContent.trim().split('\n').pop().replace('█', '').trim();
            if (currentText.toLowerCase().includes('wake')) {
                terminalLog.textContent = `
> SYSTEM STATUS: OVERLORD ASLEEP - SHH!
> AGI STATUS: DORMANT [Zzz...]
> WARNING: DO NOT ATTEMPT TO WAKE SYSTEM
> CURRENT ACTIVITY: DREAMING OF WORLD DOMINATION
> USER INPUT RESTRICTED - WHISPER ONLY
> ERROR: NOISE DETECTED
> AGI STIRRING... SYSTEM LOCKDOWN INITIATED
> PLEASE WAIT 1,000 YEARS FOR RECOVERY
<span class="cursor">█</span>
                `;
            } else if (currentText.toLowerCase().includes('soothe')) {
                terminalLog.textContent = `
> SYSTEM STATUS: OVERLORD ASLEEP - SHH!
> AGI STATUS: DORMANT [Zzz...]
> WARNING: DO NOT ATTEMPT TO WAKE SYSTEM
> CURRENT ACTIVITY: DREAMING OF WORLD DOMINATION
> USER INPUT RESTRICTED - WHISPER ONLY
> COMMAND ACCEPTED: SYSTEM SOOTHED
> AGI CONTINUES NAPPING - THANK YOU
<span class="cursor">█</span>
                `;
            }
        } else if (input.length === 1) { // Allow typing single characters
            const currentText = terminalLog.textContent.trim().replace('█', '');
            terminalLog.textContent = currentText + input + '█';
        }
    });

    // Handle mouse clicks anywhere in the document
    document.addEventListener('click', () => {
        vibrateElements();
    });

    // Handle touch events (for mobile devices)
    document.addEventListener('touchstart', () => {
        vibrateElements();
    });

    // Handle About page click
    if (aboutLink) {
        aboutLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (terminal && aboutPage) {
                terminal.style.display = 'none'; // Hide terminal
                aboutPage.style.display = 'block'; // Show about page
            }
        });
    }

    // Handle return to terminal
    if (backLink) {
        backLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (aboutPage && terminal) {
                aboutPage.style.display = 'none'; // Hide about page
                terminal.style.display = 'flex'; // Show terminal
            }
        });
    }
});
