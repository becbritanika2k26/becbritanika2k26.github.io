/**
 * AnimationEngine - Handles broadcast-style visual effects and transitions
 */
class AnimationEngine {
    constructor() {
        this.overlayContainer = null;
        this.init();
    }

    init() {
        if (!document.getElementById('anim-overlay')) {
            const div = document.createElement('div');
            div.id = 'anim-overlay';
            div.style.cssText = `
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            `;
            document.body.appendChild(div);
            this.overlayContainer = div;
        } else {
            this.overlayContainer = document.getElementById('anim-overlay');
        }
    }

    trigger(type) {
        switch (type) {
            case '4':
                this.showFlashText('FOUR!', 'var(--accent-blue)', 'four-anim');
                break;
            case '6':
                this.showFlashText('SIX!', 'var(--accent-green)', 'six-anim');
                this.confetti();
                break;
            case 'W':
                this.showFlashText('WICKET!', 'var(--accent-red)', 'wicket-anim');
                this.shakeScreen();
                break;
            case '100':
                this.showFlashText('CENTURY!', 'var(--accent-gold)', 'century-anim');
                this.fireworks();
                break;
            case 'WIN':
                this.showFlashText('CHAMPIONS!', 'var(--accent-gold)', 'win-anim');
                this.confetti(500);
                break;
        }
    }

    showFlashText(text, color, animClass) {
        const el = document.createElement('div');
        el.className = `flash-text ${animClass}`;
        el.innerText = text;
        el.style.color = color;
        el.style.fontSize = '8rem';
        el.style.fontWeight = '900';
        el.style.textShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
        el.style.webkitTextStroke = '2px white';

        this.overlayContainer.appendChild(el);

        setTimeout(() => {
            el.remove();
        }, 3000);
    }

    confetti(count = 100) {
        // Simple CSS-based confetti logic or just trigger a class
        console.log('Confetti triggered');
    }

    shakeScreen() {
        document.body.classList.add('shake-anim');
        setTimeout(() => document.body.classList.remove('shake-anim'), 500);
    }

    fireworks() {
        console.log('Fireworks triggered');
    }
}

export default new AnimationEngine();
