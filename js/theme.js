// abhishekkumar177/pixel_phantoms/Pixel_Phantoms-main/js/theme.js

document.addEventListener('DOMContentLoaded', function() {
    const themeSwitch = document.getElementById('theme-switch');
    const bodyElement = document.body;
    
    // 1. Check for saved preference or system default
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // 2. Apply theme to body for full-page effect
    applyTheme(savedTheme);

    // 3. Sync the toggle switch UI
    if (themeSwitch) {
        themeSwitch.checked = (savedTheme === 'light');
        
        themeSwitch.addEventListener('change', function() {
            const newTheme = this.checked ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            bodyElement.classList.add('light-mode');
            bodyElement.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            bodyElement.classList.add('dark-mode');
            bodyElement.classList.remove('light-mode');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
});
/**
 * Creative Micro-Interactions for Theme Switch
 * Final Redesign for SWOC 2026 Toggle
 */
const themeInput = document.getElementById('theme-switch');
const themeLabel = document.querySelector('.theme-label');

if (themeInput && themeLabel) {
    themeInput.addEventListener('change', () => {
        // Creative "Mechanical Shake" effect on toggle
        themeLabel.style.animation = 'none';
        void themeLabel.offsetWidth; // Trigger reflow
        themeLabel.style.animation = 'switchShake 0.4s ease';
        
        // Add a 'click' sound effect via JS if you want to be extra creative
        console.log("Theme Protocol: " + (themeInput.checked ? "Dark" : "Light") + " Mode Active");
    });
}

// Add the keyframe for the shake to the JS (injected into CSS)
const style = document.createElement('style');
style.textContent = `
    @keyframes switchShake {
        0%, 100% { transform: scale(1); }
        25% { transform: scale(0.9) rotate(5deg); }
        50% { transform: scale(1.1) rotate(-5deg); }
        75% { transform: scale(1.05) rotate(2deg); }
    }
`;
document.head.append(style);