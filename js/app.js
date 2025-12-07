// js/app.js - Main Application Logic

class CognitiveApp {
    constructor() {
        this.currentSection = 'home';
        this.gameSession = null;
        this.isSoundOn = true;
        this.isDarkMode = true;
        
        this.initializeApp();
    }

    initializeApp() {
        // Remove loading screen after 2 seconds
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                this.setupEventListeners();
                this.updateStats();
                this.startNeuralAnimation();
            }, 500);
        }, 2000);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.navigateTo(section);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.toggleSound();
        });

        // Start game button
        document.getElementById('start-game').addEventListener('click', () => {
            this.navigateTo('game');
            if (window.mazeGame) {
                window.mazeGame.reset();
            }
        });

        // Go to game from analysis
        document.getElementById('go-to-game')?.addEventListener('click', () => {
            this.navigateTo('game');
        });

        // Watch demo button
        document.getElementById('watch-demo').addEventListener('click', () => {
            this.showDemo();
        });

        // Game control buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                if (window.mazeGame) {
                    window.mazeGame.move(direction);
                }
            });
        });

        // Reset game
        document.getElementById('reset-game')?.addEventListener('click', () => {
            if (window.mazeGame) {
                window.mazeGame.reset();
            }
        });

        // Hint button
        document.getElementById('hint-btn')?.addEventListener('click', () => {
            this.showHint();
        });

        // Keyboard controls for game
        document.addEventListener('keydown', (e) => {
            if (this.currentSection === 'game' && window.mazeGame) {
                const keyMap = {
                    'ArrowUp': 'up',
                    'ArrowDown': 'down',
                    'ArrowLeft': 'left',
                    'ArrowRight': 'right',
                    'w': 'up',
                    's': 'down',
                    'a': 'left',
                    'd': 'right'
                };
                
                if (keyMap[e.key]) {
                    window.mazeGame.move(keyMap[e.key]);
                    e.preventDefault();
                }
            }
        });

        // Initialize game when game section is shown
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const section = mutation.target.id;
                    if (section === 'game' && mutation.target.classList.contains('active')) {
                        this.initializeGame();
                    }
                }
            });
        });

        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section, { attributes: true });
        });
    }

    navigateTo(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${section}`) {
                link.classList.add('active');
            }
        });

        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === section) {
                sec.classList.add('active');
                this.currentSection = section;
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Update page title
        const titles = {
            'home': 'Cognitive Puzzle | Home',
            'game': 'Cognitive Puzzle | Ego Labyrinth',
            'analysis': 'Cognitive Puzzle | Your Profile',
            'about': 'Cognitive Puzzle | About'
        };
        document.title = titles[section] || 'Cognitive Puzzle';
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        const icon = document.querySelector('#theme-toggle i');
        
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-moon';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            icon.className = 'fas fa-sun';
        }
    }

    toggleSound() {
        this.isSoundOn = !this.isSoundOn;
        const icon = document.querySelector('#sound-toggle i');
        icon.className = this.isSoundOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }

    updateStats() {
        // Animate stats counting
        const stats = {
            'puzzle-count': 7,
            'player-count': 1234,
            'bias-count': 24
        };

        Object.entries(stats).forEach(([id, target]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateCount(element, 0, target, 2000);
            }
        });
    }

    animateCount(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value.toLocaleString();
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = end.toLocaleString();
            }
        };
        window.requestAnimationFrame(step);
    }

    startNeuralAnimation() {
        // This will be handled by neural-loader.js
        if (window.createNeuralNetwork) {
            window.createNeuralNetwork('neural-canvas');
        }
    }

    initializeGame() {
        // Initialize the maze game
        if (!window.mazeGame) {
            const canvas = document.getElementById('maze-canvas');
            if (canvas) {
                // The game will be initialized by game.js
                console.log('Game canvas found, game will initialize automatically');
            }
        } else {
            window.mazeGame.reset();
        }

        // Start a new session
        this.startGameSession();
    }

    async startGameSession() {
        try {
            const userId = localStorage.getItem('cognitive_user_id') || 
                          'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('cognitive_user_id', userId);

            const response = await fetch('/api/session/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    puzzleType: 'ego_labyrinth'
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.gameSession = data.session;
                console.log('Game session started:', this.gameSession);
            }
        } catch (error) {
            console.error('Failed to start game session:', error);
            // Continue without session tracking
            this.gameSession = {
                sessionId: 'local_' + Date.now(),
                userId: 'anonymous',
                startTime: new Date().toISOString()
            };
        }
    }

    async trackGameEvent(eventType, data = {}) {
        if (!this.gameSession) return;

        try {
            await fetch('/api/events/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.gameSession.sessionId,
                    eventType,
                    data: {
                        ...data,
                        timestamp: new Date().toISOString(),
                        section: this.currentSection
                    }
                })
            });
        } catch (error) {
            // Silent fail for event tracking
            console.debug('Event tracking failed:', error);
        }
    }

    showDemo() {
        alert('Demo video would play here. This feature is coming soon!');
        this.trackGameEvent('demo_watched');
    }

    showHint() {
        const hints = [
            "Look for patterns in the maze walls",
            "Sometimes the longest path is the quickest",
            "Don't be afraid to backtrack",
            "The exit is always reachable",
            "Your hesitation reveals your thinking style"
        ];
        
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        document.getElementById('hint-text').textContent = randomHint;
        
        // Flash the hint
        const hintElement = document.getElementById('hint-text');
        hintElement.style.animation = 'none';
        setTimeout(() => {
            hintElement.style.animation = 'pulse 1s';
        }, 10);
        
        this.trackGameEvent('hint_used', { hint: randomHint });
    }

    async analyzeGameResults(gameData) {
        try {
            const response = await fetch('/api/analyze/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.gameSession?.sessionId || 'anonymous',
                    ...gameData
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.displayAnalysis(data.profile);
                this.navigateTo('analysis');
                return data.profile;
            }
        } catch (error) {
            console.error('Failed to analyze game:', error);
            this.displayFallbackAnalysis(gameData);
        }
    }

    displayAnalysis(profile) {
        const analysisContent = document.getElementById('analysis-content');
        
        const html = `
            <div class="analysis-results fade-in">
                <div class="archetype-card">
                    <div class="archetype-icon">
                        <i class="fas fa-crown"></i>
                    </div>
                    <h3>${profile.archetype.name}</h3>
                    <p class="archetype-desc">${profile.archetype.description}</p>
                    <div class="confidence-level">
                        <div class="confidence-label">Confidence:</div>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${profile.archetype.confidence}%"></div>
                        </div>
                        <div class="confidence-percent">${profile.archetype.confidence}%</div>
                    </div>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-title">Move Efficiency</div>
                        <div class="metric-value">${profile.metrics.moveEfficiency}%</div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${profile.metrics.moveEfficiency}%"></div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Time Management</div>
                        <div class="metric-value">${profile.metrics.timeEfficiency}%</div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${profile.metrics.timeEfficiency}%"></div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Decision Confidence</div>
                        <div class="metric-value">${profile.metrics.decisionConfidence}%</div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${profile.metrics.decisionConfidence}%"></div>
                        </div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-title">Overall Score</div>
                        <div class="metric-value">${profile.metrics.overallScore}%</div>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: ${profile.metrics.overallScore}%"></div>
                        </div>
                    </div>
                </div>
                
                ${profile.biases.length > 0 ? `
                <div class="biases-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Detected Biases</h4>
                    <div class="biases-list">
                        ${profile.biases.map(bias => `
                            <div class="bias-item">
                                <div class="bias-name">${bias.name}</div>
                                <div class="bias-desc">${bias.description}</div>
                                <div class="bias-severity ${bias.severity}">${bias.severity}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="insights-section">
                    <h4><i class="fas fa-lightbulb"></i> Insights</h4>
                    <ul class="insights-list">
                        ${profile.insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="recommendations-section">
                    <h4><i class="fas fa-chart-line"></i> Recommendations</h4>
                    <ul class="recommendations-list">
                        ${profile.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="analysis-actions">
                    <button id="share-results" class="btn-secondary">
                        <i class="fas fa-share-alt"></i> Share Results
                    </button>
                    <button id="play-again" class="btn-primary">
                        <i class="fas fa-redo"></i> Play Another Puzzle
                    </button>
                </div>
            </div>
        `;
        
        analysisContent.innerHTML = html;
        
        // Add event listeners to new buttons
        document.getElementById('share-results')?.addEventListener('click', () => this.shareResults(profile));
        document.getElementById('play-again')?.addEventListener('click', () => this.navigateTo('game'));
        
        // Add CSS for analysis page
        this.addAnalysisStyles();
    }

    addAnalysisStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .analysis-results {
                animation: fadeIn 0.8s ease;
            }
            
            .archetype-card {
                background: linear-gradient(135deg, #6B46C1, #2A4B8C);
                border-radius: 20px;
                padding: 2.5rem;
                text-align: center;
                margin-bottom: 3rem;
                color: white;
            }
            
            .archetype-icon {
                font-size: 4rem;
                margin-bottom: 1.5rem;
                opacity: 0.9;
            }
            
            .archetype-card h3 {
                font-size: 2.5rem;
                margin-bottom: 1rem;
            }
            
            .archetype-desc {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 2rem;
            }
            
            .confidence-level {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .confidence-bar {
                flex-grow: 1;
                height: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
                overflow: hidden;
            }
            
            .confidence-fill {
                height: 100%;
                background: white;
                border-radius: 5px;
                transition: width 1s ease;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
                margin-bottom: 3rem;
            }
            
            @media (max-width: 768px) {
                .metrics-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            .metric-card {
                background: var(--dark-surface);
                border: 1px solid var(--dark-border);
                border-radius: 15px;
                padding: 1.5rem;
                text-align: center;
            }
            
            .metric-title {
                font-size: 0.9rem;
                color: var(--muted-text);
                margin-bottom: 0.5rem;
            }
            
            .metric-value {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
                background: var(--gradient-primary);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
            }
            
            .metric-bar {
                height: 8px;
                background: var(--dark-bg);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .metric-fill {
                height: 100%;
                background: var(--gradient-primary);
                border-radius: 4px;
                transition: width 1s ease;
            }
            
            .biases-section, .insights-section, .recommendations-section {
                background: var(--dark-surface);
                border: 1px solid var(--dark-border);
                border-radius: 15px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .biases-section h4, .insights-section h4, .recommendations-section h4 {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1rem;
                color: var(--primary-purple);
            }
            
            .biases-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .bias-item {
                background: var(--dark-bg);
                border: 1px solid var(--dark-border);
                border-radius: 10px;
                padding: 1rem;
                display: grid;
                grid-template-columns: 1fr 2fr auto;
                gap: 1rem;
                align-items: center;
            }
            
            .bias-name {
                font-weight: 600;
                color: var(--light-text);
            }
            
            .bias-desc {
                color: var(--muted-text);
                font-size: 0.9rem;
            }
            
            .bias-severity {
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .bias-severity.low {
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.3);
            }
            
            .bias-severity.medium {
                background: rgba(245, 158, 11, 0.2);
                color: #f59e0b;
                border: 1px solid rgba(245, 158, 11, 0.3);
            }
            
            .bias-severity.high {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            .insights-list, .recommendations-list {
                list-style: none;
                padding-left: 0;
            }
            
            .insights-list li, .recommendations-list li {
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--dark-border);
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .insights-list li:last-child, .recommendations-list li:last-child {
                border-bottom: none;
            }
            
            .insights-list li:before {
                content: '💡';
            }
            
            .recommendations-list li:before {
                content: '✅';
            }
            
            .analysis-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 3rem;
            }
        `;
        
        document.head.appendChild(style);
    }

    displayFallbackAnalysis(gameData) {
        const analysisContent = document.getElementById('analysis-content');
        
        const efficiency = Math.min(100, Math.round((100 - gameData.moves) * 100 / 150));
        const timeScore = Math.min(100, Math.round((300 - gameData.timeTaken) * 100 / 300));
        const overall = Math.round((efficiency + timeScore) / 2);
        
        analysisContent.innerHTML = `
            <div class="analysis-results">
                <div class="fallback-analysis">
                    <h3><i class="fas fa-brain"></i> Basic Analysis</h3>
                    <p>Note: Using offline analysis. Connect to internet for detailed cognitive profile.</p>
                    
                    <div class="basic-metrics">
                        <div class="basic-metric">
                            <span class="metric-label">Moves:</span>
                            <span class="metric-value">${gameData.moves}</span>
                        </div>
                        <div class="basic-metric">
                            <span class="metric-label">Time:</span>
                            <span class="metric-value">${gameData.timeTaken}s</span>
                        </div>
                        <div class="basic-metric">
                            <span class="metric-label">Efficiency:</span>
                            <span class="metric-value">${efficiency}%</span>
                        </div>
                        <div class="basic-metric">
                            <span class="metric-label">Overall Score:</span>
                            <span class="metric-value">${overall}%</span>
                        </div>
                    </div>
                    
                    <div class="basic-insights">
                        <h4>Quick Insights:</h4>
                        <ul>
                            <li>You completed the maze in ${gameData.moves} moves</li>
                            <li>Your efficiency score is ${efficiency}%</li>
                            <li>Try to complete it in fewer moves next time!</li>
                        </ul>
                    </div>
                    
                    <button onclick="window.cognitiveApp.navigateTo('game')" class="btn-primary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            </div>
        `;
    }

    shareResults(profile) {
        const shareData = {
            title: 'My Cognitive Puzzle Results',
            text: `I'm a ${profile.archetype.name} with a score of ${profile.metrics.overallScore}%! Can you beat my score?`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Shared successfully'))
                .catch((error) => console.log('Sharing failed:', error));
        } else {
            // Fallback: copy to clipboard
            const text = `Cognitive Puzzle Results:
Archetype: ${profile.archetype.name}
Score: ${profile.metrics.overallScore}%
Moves: ${profile.metrics.moves}
Time: ${profile.metrics.timeTaken}s

${profile.insights.join('\n')}`;
            
            navigator.clipboard.writeText(text)
                .then(() => alert('Results copied to clipboard!'))
                .catch(() => alert('Could not copy results.'));
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cognitiveApp = new CognitiveApp();
});
