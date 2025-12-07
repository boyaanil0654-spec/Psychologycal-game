// js/game.js - Maze Game Logic

class MazeGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.player = { x: 1, y: 1 };
        this.moves = 0;
        this.decisions = 0;
        this.hesitations = 0;
        this.startTime = null;
        this.gameActive = false;
        this.lastMoveTime = null;
        this.path = [];
        this.exit = null;
        
        // Game metrics
        this.metrics = {
            moves: 0,
            timeTaken: 0,
            decisions: 0,
            hesitations: 0,
            efficiency: 0,
            confidence: 100
        };
        
        // Initialize
        this.maze = this.generateMaze(15, 15);
        this.setupCanvas();
        this.setupEventListeners();
        this.draw();
        
        console.log('Maze Game initialized');
    }

    setupCanvas() {
        // Set canvas size based on maze dimensions
        const mazeWidth = this.maze[0].length * this.cellSize;
        const mazeHeight = this.maze.length * this.cellSize;
        
        this.canvas.width = mazeWidth;
        this.canvas.height = mazeHeight;
        
        // Adjust canvas display size
        this.canvas.style.width = mazeWidth + 'px';
        this.canvas.style.height = mazeHeight + 'px';
    }

    generateMaze(width, height) {
        // Create grid with walls
        const grid = Array(height).fill().map(() => Array(width).fill(1));
        
        // Use recursive backtracking algorithm
        const stack = [];
        const startX = 1;
        const startY = 1;
        
        grid[startY][startX] = 0; // Start cell
        stack.push([startX, startY]);
        
        while (stack.length > 0) {
            const [x, y] = stack[stack.length - 1];
            const neighbors = [];
            
            // Check all four directions
            const directions = [
                [0, -2], // Up
                [2, 0],  // Right
                [0, 2],  // Down
                [-2, 0]  // Left
            ];
            
            for (const [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX > 0 && newX < width - 1 && 
                    newY > 0 && newY < height - 1 && 
                    grid[newY][newX] === 1) {
                    neighbors.push([newX, newY, dx, dy]);
                }
            }
            
            if (neighbors.length > 0) {
                const [newX, newY, dx, dy] = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Remove wall between current cell and chosen neighbor
                grid[y + dy/2][x + dx/2] = 0;
                grid[newY][newX] = 0;
                
                stack.push([newX, newY]);
            } else {
                stack.pop();
            }
        }
        
        // Set exit (ensure it's reachable)
        let exitX, exitY;
        do {
            exitX = width - 2;
            exitY = Math.floor(Math.random() * (height - 2)) + 1;
        } while (grid[exitY][exitX] === 1);
        
        this.exit = { x: exitX, y: exitY };
        grid[exitY][exitX] = 2; // Mark as exit
        
        // Set start position
        grid[startY][startX] = 0;
        this.player = { x: startX, y: startY };
        this.path = [[startX, startY]];
        
        return grid;
    }

    draw() {
        const { ctx, canvas, maze, cellSize, player, exit } = this;
        
        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw maze
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[y].length; x++) {
                if (maze[y][x] === 1) { // Wall
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    
                    // Add texture to walls
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                } else if (x === exit?.x && y === exit?.y) { // Exit
                    // Draw exit with glow effect
                    ctx.save();
                    ctx.shadowColor = '#10b981';
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath();
                    ctx.arc(
                        x * cellSize + cellSize / 2,
                        y * cellSize + cellSize / 2,
                        cellSize / 3,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    ctx.restore();
                    
                    // Draw exit symbol
                    ctx.fillStyle = 'white';
                    ctx.font = `${cellSize / 2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🏁', 
                        x * cellSize + cellSize / 2, 
                        y * cellSize + cellSize / 2);
                }
            }
        }
        
        // Draw path
        if (this.path.length > 1) {
            ctx.strokeStyle = 'rgba(107, 70, 193, 0.3)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            this.path.forEach(([x, y], index) => {
                const centerX = x * cellSize + cellSize / 2;
                const centerY = y * cellSize + cellSize / 2;
                
                if (index === 0) {
                    ctx.moveTo(centerX, centerY);
                } else {
                    ctx.lineTo(centerX, centerY);
                }
            });
            
            ctx.stroke();
        }
        
        // Draw player
        ctx.save();
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(
            player.x * cellSize + cellSize / 2,
            player.y * cellSize + cellSize / 2,
            cellSize / 2.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
        
        // Draw player direction indicator
        if (this.lastMoveTime && Date.now() - this.lastMoveTime < 500) {
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            const direction = this.getLastDirection();
            const offset = cellSize / 3;
            
            switch(direction) {
                case 'up':
                    ctx.ellipse(
                        player.x * cellSize + cellSize / 2,
                        player.y * cellSize + cellSize / 4,
                        cellSize / 6,
                        cellSize / 8,
                        0, 0, Math.PI * 2
                    );
                    break;
                case 'down':
                    ctx.ellipse(
                        player.x * cellSize + cellSize / 2,
                        player.y * cellSize + cellSize * 3/4,
                        cellSize / 6,
                        cellSize / 8,
                        0, 0, Math.PI * 2
                    );
                    break;
                case 'left':
                    ctx.ellipse(
                        player.x * cellSize + cellSize / 4,
                        player.y * cellSize + cellSize / 2,
                        cellSize / 8,
                        cellSize / 6,
                        0, 0, Math.PI * 2
                    );
                    break;
                case 'right':
                    ctx.ellipse(
                        player.x * cellSize + cellSize * 3/4,
                        player.y * cellSize + cellSize / 2,
                        cellSize / 8,
                        cellSize / 6,
                        0, 0, Math.PI * 2
                    );
                    break;
            }
            ctx.fill();
        }
        
        // Draw hesitation indicator
        if (this.isHesitating()) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(
                player.x * cellSize + cellSize / 2,
                player.y * cellSize + cellSize / 2,
                cellSize / 2 + 5,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }
        
        // Update UI elements
        this.updateUI();
    }

    getLastDirection() {
        if (this.path.length < 2) return 'right';
        
        const [lastX, lastY] = this.path[this.path.length - 2];
        const [currentX, currentY] = this.path[this.path.length - 1];
        
        if (currentX > lastX) return 'right';
        if (currentX < lastX) return 'left';
        if (currentY > lastY) return 'down';
        if (currentY < lastY) return 'up';
        
        return 'right';
    }

    isHesitating() {
        if (!this.lastMoveTime) return false;
        const timeSinceLastMove = Date.now() - this.lastMoveTime;
        return timeSinceLastMove > 2000 && this.gameActive;
    }

    updateUI() {
        // Update move count
        const moveElement = document.getElementById('move-count');
        if (moveElement) {
            moveElement.textContent = this.moves;
        }
        
        // Update time
        const timeElement = document.getElementById('time-count');
        if (timeElement && this.startTime) {
            const seconds = Math.floor((Date.now() - this.startTime) / 1000);
            timeElement.textContent = `${seconds}s`;
        }
        
        // Update decisions
        const decisionElement = document.getElementById('decision-count');
        if (decisionElement) {
            decisionElement.textContent = this.decisions;
        }
        
        // Update efficiency
        const efficiencyElement = document.getElementById('efficiency-score');
        if (efficiencyElement) {
            const efficiency = this.moves > 0 ? 
                Math.min(100, Math.round((100 - this.moves) * 100 / 150)) : 100;
            efficiencyElement.textContent = `${efficiency}%`;
        }
    }

    move(direction) {
        if (!this.gameActive) {
            this.startGame();
        }
        
        const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
        const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check if move is valid
        if (this.isValidMove(newX, newY)) {
            // Track hesitation before move
            if (this.lastMoveTime) {
                const hesitationTime = Date.now() - this.lastMoveTime;
                if (hesitationTime > 1000) {
                    this.hesitations++;
                    this.metrics.hesitations++;
                    this.trackEvent('hesitation', { duration: hesitationTime });
                }
            }
            
            // Update player position
            this.player.x = newX;
            this.player.y = newY;
            this.moves++;
            this.decisions++;
            this.lastMoveTime = Date.now();
            
            // Add to path if it's a new position
            const lastPos = this.path[this.path.length - 1];
            if (!lastPos || lastPos[0] !== newX || lastPos[1] !== newY) {
                this.path.push([newX, newY]);
            }
            
            // Track the move
            this.trackEvent('move', { 
                direction, 
                from: { x: this.player.x - dx, y: this.player.y - dy },
                to: { x: newX, y: newY }
            });
            
            // Check for win condition
            if (newX === this.exit.x && newY === this.exit.y) {
                this.completeGame();
            }
            
            // Redraw
            this.draw();
        } else {
            // Invalid move (into wall)
            this.trackEvent('invalid_move', { 
                direction, 
                attempted: { x: newX, y: newY }
            });
        }
    }

    isValidMove(x, y) {
        return (
            x >= 0 && x < this.maze[0].length &&
            y >= 0 && y < this.maze.length &&
            this.maze[y][x] !== 1
        );
    }

    startGame() {
        if (!this.gameActive) {
            this.startTime = Date.now();
            this.gameActive = true;
            this.lastMoveTime = Date.now();
            
            this.trackEvent('game_start', {
                startTime: this.startTime,
                mazeSize: `${this.maze[0].length}x${this.maze.length}`
            });
            
            console.log('Game started');
        }
    }

    async completeGame() {
        if (!this.gameActive) return;
        
        this.gameActive = false;
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - this.startTime) / 1000);
        
        // Calculate final metrics
        this.metrics.moves = this.moves;
        this.metrics.timeTaken = timeTaken;
        this.metrics.decisions = this.decisions;
        this.metrics.efficiency = Math.min(100, Math.round((100 - this.moves) * 100 / 150));
        this.metrics.confidence = Math.max(0, 100 - (this.hesitations * 5));
        
        // Track completion
        this.trackEvent('game_complete', {
            moves: this.moves,
            timeTaken,
            decisions: this.decisions,
            hesitations: this.hesitations,
            pathLength: this.path.length
        });
        
        // Show celebration
        this.showCelebration();
        
        // Update UI with final score
        setTimeout(() => {
            this.showCompletionMessage(timeTaken);
        }, 1500);
        
        // Send data for analysis
        if (window.cognitiveApp) {
            setTimeout(() => {
                window.cognitiveApp.analyzeGameResults(this.metrics);
            }, 2000);
        }
    }

    showCelebration() {
        const { ctx, canvas, player, cellSize } = this;
        
        // Draw celebration particles
        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: player.x * cellSize + cellSize / 2,
                y: player.y * cellSize + cellSize / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)],
                size: Math.random() * 5 + 2,
                life: 60
            });
        }
        
        let frame = 0;
        const animate = () => {
            // Redraw the maze
            this.draw();
            
            // Update and draw particles
            ctx.save();
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                p.life--;
                
                ctx.globalAlpha = p.life / 60;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                if (p.life <= 0) {
                    particles.splice(i, 1);
                }
            }
            ctx.restore();
            
            frame++;
            if (frame < 60 && particles.length > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    showCompletionMessage(timeTaken) {
        const hintElement = document.getElementById('hint-text');
        if (hintElement) {
            hintElement.innerHTML = `
                <strong>🎉 Maze Completed!</strong><br>
                Moves: ${this.moves} | Time: ${timeTaken}s | Efficiency: ${this.metrics.efficiency}%<br>
                <small>Analyzing your cognitive patterns...</small>
            `;
            hintElement.style.background = 'rgba(16, 185, 129, 0.2)';
            hintElement.style.borderColor = '#10b981';
        }
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive && e.key.startsWith('Arrow')) {
                this.startGame();
            }
            
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
                this.move(keyMap[e.key]);
                e.preventDefault();
            }
        });
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            
            if (!this.gameActive) {
                this.startGame();
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                this.move(deltaX > 0 ? 'right' : 'left');
            } else {
                // Vertical swipe
                this.move(deltaY > 0 ? 'down' : 'up');
            }
        });
    }

    async trackEvent(eventType, data = {}) {
        // Track locally
        console.log(`Game Event: ${eventType}`, data);
        
        // Send to main app for server tracking
        if (window.cognitiveApp) {
            window.cognitiveApp.trackGameEvent(eventType, data);
        }
    }

    reset() {
        // Generate new maze
        this.maze = this.generateMaze(15, 15);
        
        // Reset player
        this.player = { x: 1, y: 1 };
        this.path = [[1, 1]];
        
        // Reset metrics
        this.moves = 0;
        this.decisions = 0;
        this.hesitations = 0;
        this.startTime = null;
        this.gameActive = false;
        this.lastMoveTime = null;
        
        this.metrics = {
            moves: 0,
            timeTaken: 0,
            decisions: 0,
            hesitations: 0,
            efficiency: 0,
            confidence: 100
        };
        
        // Reset UI
        const hintElement = document.getElementById('hint-text');
        if (hintElement) {
            hintElement.innerHTML = 'Use arrow keys or buttons to navigate. Find the green exit.';
            hintElement.style.background = 'rgba(234, 88, 12, 0.1)';
            hintElement.style.borderColor = '#EA580C';
        }
        
        // Redraw
        this.draw();
        
        // Track reset
        this.trackEvent('game_reset');
        
        console.log('Game reset');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('maze-canvas');
    if (canvas) {
        window.mazeGame = new MazeGame('maze-canvas');
        console.log('Maze Game ready to play!');
    }
});
