/**
 * AdminController - Handles interaction between Admin UI and CricketEngine
 */
import CricketEngine from './cricketEngine.js';
import AnimationEngine from './animationEngine.js';

class AdminController {
    constructor() {
        this.init();
    }

    init() {
        // Use a safer polling mechanism for event binding to ensure elements are ready
        const bindInterval = setInterval(() => {
            const buttons = document.querySelectorAll('.score-btn');
            if (buttons.length > 0) {
                this.bindEvents();
                clearInterval(bindInterval);
            }
        }, 500);
    }

    bindEvents() {
        console.log("AdminController: Binding Events...");

        // Score buttons (0-6)
        document.querySelectorAll('.score-btn[data-run]').forEach(btn => {
            btn.onclick = (e) => {
                const run = parseInt(e.currentTarget.dataset.run);
                CricketEngine.addBall('RUNS', run);
                if (run === 4) AnimationEngine.trigger('4');
                if (run === 6) AnimationEngine.trigger('6');
                this.refresh();
            };
        });

        // Special Buttons
        const setup = (id, type, anim) => {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = () => {
                    CricketEngine.addBall(type);
                    if (anim) AnimationEngine.trigger(anim);
                    this.refresh();
                };
            }
        };

        setup('btn-wicket', 'WICKET', 'W');
        setup('btn-wide', 'WIDE');
        setup('btn-no-ball', 'NO_BALL');

        const undoBtn = document.getElementById('btn-undo');
        if (undoBtn) {
            undoBtn.onclick = () => {
                CricketEngine.undo();
                this.refresh();
            };
        }

        // Player Dropdowns
        document.querySelectorAll('.player-sync').forEach(el => {
            el.onchange = () => {
                const striker = document.getElementById('select-striker').value;
                const nonStriker = document.getElementById('select-non-striker').value;
                const bowler = document.getElementById('select-bowler').value;
                CricketEngine.setActivePlayers(striker, nonStriker, bowler);
                this.refresh();
            };
        });

        // Global Key listener
        document.onkeydown = (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            const key = e.key.toLowerCase();
            if (key >= '0' && key <= '6' && key !== '5') {
                const run = parseInt(key);
                CricketEngine.addBall('RUNS', run);
                if (run === 4) AnimationEngine.trigger('4');
                if (run === 6) AnimationEngine.trigger('6');
                this.refresh();
            } else if (key === 'w') {
                CricketEngine.addBall('WICKET');
                AnimationEngine.trigger('W');
                this.refresh();
            } else if (key === 'u') {
                CricketEngine.undo();
                this.refresh();
            }
        };
    }

    refresh() {
        if (window.updateAdminUI) window.updateAdminUI();
    }
}

export default new AdminController();
