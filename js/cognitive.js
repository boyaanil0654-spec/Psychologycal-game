// js/cognitive.js - API Client and Cognitive Functions

class CognitiveAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.sessionId = null;
        this.userId = null;
        
        this.init();
    }
    
    init() {
        // Load or create user ID
        this.userId = localStorage.getItem('cognitive_user_id');
        if (!this.userId) {
            this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('cognitive_user_id', this.userId);
        }
    }
    
    async startSession(puzzleType = 'ego_labyrinth') {
        try {
            const response = await fetch(`${this.baseURL}/api/session/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    puzzleType
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.session.sessionId;
                console.log('Session started:', this.sessionId);
                return data.session;
            } else {
                throw new Error('Failed to start session');
            }
        } catch (error) {
            console.error('Session start error:', error);
            // Create local session
            this.sessionId = 'local_' + Date.now();
            return {
                sessionId: this.sessionId,
                userId: this.userId,
                startTime: new Date().toISOString()
            };
        }
    }
    
    async trackEvent(eventType, data = {}) {
        if (!this.sessionId) return null;
        
        try {
            const response = await fetch(`${this.baseURL}/api/events/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    eventType,
                    data: {
                        ...data,
                        timestamp: new Date().toISOString(),
                        userId: this.userId
                    }
                })
            });
            
            return response.ok;
        } catch (error) {
            console.debug('Event tracking failed:', error);
            return false;
        }
    }
    
    async analyzeGame(gameData) {
        try {
            const response = await fetch(`${this.baseURL}/api/analyze/game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId || 'anonymous',
                    userId: this.userId,
                    ...gameData
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                throw new Error('Analysis failed');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            return this.generateLocalAnalysis(gameData);
        }
    }
    
    generateLocalAnalysis(gameData) {
        // Generate analysis locally when server is unavailable
        const { moves, timeTaken } = gameData;
        
        const efficiency = Math.min(100, Math.round((100 - moves) * 100 / 150));
        const timeScore = Math.min(100, Math.round((300 - timeTaken) * 100 / 300));
        const overallScore = Math.round((efficiency + timeScore) / 2);
        
        // Determine archetype based on gameplay
        let archetype = 'balanced';
        let archetypeName = 'The Balanced Thinker';
        let description = 'You show a good mix of planning and adaptability.';
        
        if (efficiency > 80 && timeScore > 80) {
            archetype = 'strategist';
            archetypeName = 'The Strategist';
            description = 'You plan ahead efficiently and manage time well.';
        } else if (moves > 50) {
            archetype = 'explorer';
            archetypeName = 'The Explorer';
            description = 'You like to explore all possibilities before deciding.';
        } else if (timeTaken < 30) {
            archetype = 'intuitive';
            archetypeName = 'The Intuitive';
            description = 'You make quick decisions based on intuition.';
        }
        
        return {
            success: true,
            message: 'Local analysis completed',
            profile: {
                archetype: {
                    type: archetype,
                    name: archetypeName,
                    description: description,
                    confidence: overallScore
                },
                metrics: {
                    moves,
                    timeTaken,
                    decisions: moves * 2,
                    moveEfficiency: efficiency,
                    timeEfficiency: timeScore,
                    decisionConfidence: 85,
                    overallScore
                },
                biases: moves > 60 ? [{
                    type: 'analysis_paralysis',
                    name: 'Analysis Paralysis',
                    description: 'Tendency to over-analyze situations',
                    severity: 'low'
                }] : [],
                insights: [
                    `You completed the maze in ${moves} moves`,
                    `Your time: ${timeTaken} seconds`,
                    `Efficiency score: ${efficiency}%`,
                    `Time management: ${timeScore}%`
                ],
                recommendations: [
                    efficiency < 70 ? 'Try planning your route more carefully' : 'Great path efficiency!',
                    timeScore < 70 ? 'Work on time management during puzzles' : 'Excellent time management!',
                    'Practice different solving strategies'
                ]
            }
        };
    }
    
    async getLeaderboard() {
        try {
            const response = await fetch(`${this.baseURL}/api/leaderboard`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Leaderboard error:', error);
            return this.getMockLeaderboard();
        }
    }
    
    getMockLeaderboard() {
        return {
            success: true,
            leaderboard: [
                { rank: 1, username: 'MindMaster', score: 98, archetype: 'Strategist', time: '1:23' },
                { rank: 2, username: 'Brainiac', score: 95, archetype: 'Intuitive', time: '1:45' },
                { rank: 3, username: 'PuzzleSage', score: 92, archetype: 'Analytical', time: '2:10' },
                { rank: 4, username: 'NeuroNomad', score: 88, archetype: 'Explorer', time: '3:30' },
                { rank: 5, username: 'CognitiveNinja', score: 85, archetype: 'Balanced', time: '1:55' }
            ]
        };
    }
    
    async getStats() {
        try {
            const response = await fetch(`${this.baseURL}/api/stats`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Stats error:', error);
            return this.getMockStats();
        }
    }
    
    getMockStats() {
        return {
            success: true,
            stats: {
                totalGames: 1234,
                totalPlayers: 892,
                averageScore: 72,
                mostCommonArchetype: 'Balanced',
                averageTime: '2:30',
                puzzlesCompleted: 7890,
                activeToday: 156
            }
        };
    }
    
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/api/health`);
            if (response.ok) {
                const data = await response.json();
                return {
                    healthy: true,
                    ...data
                };
            }
        } catch (error) {
            console.debug('Health check failed:', error);
            return {
                healthy: false,
                message: 'Cannot connect to server',
                error: error.message
            };
        }
    }
}

// Cognitive analysis utilities
class CognitiveAnalysis {
    static analyzeDecisions(decisions) {
        // Analyze decision patterns
        if (!decisions || decisions.length === 0) {
            return {
                pattern: 'no_data',
                consistency: 0,
                speed: 0,
                confidence: 0
            };
        }
        
        // Calculate average time between decisions
        const times = [];
        for (let i = 1; i < decisions.length; i++) {
            times.push(decisions[i].timestamp - decisions[i - 1].timestamp);
        }
        
        const avgTime = times.length > 0 ? 
            times.reduce((a, b) => a + b, 0) / times.length : 0;
        
        // Calculate consistency (variance in decision times)
        const variance = times.length > 1 ?
            times.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) / times.length : 0;
        
        // Determine pattern
        let pattern = 'consistent';
        if (variance > 5000) pattern = 'erratic';
        if (avgTime < 1000) pattern = 'impulsive';
        if (avgTime > 5000) pattern = 'deliberate';
        
        return {
            pattern,
            consistency: Math.max(0, 100 - (variance / 100)),
            speed: Math.max(0, 100 - (avgTime / 100)),
            confidence: Math.min(100, (100 - (variance / 1000)) + (100 - (avgTime / 100))) / 2
        };
    }
    
    static analyzePathEfficiency(path, optimalPath) {
        if (!path || path.length < 2) return 100;
        
        // Calculate straightness of path
        let directionChanges = 0;
        for (let i = 2; i < path.length; i++) {
            const dx1 = path[i-1][0] - path[i-2][0];
            const dy1 = path[i-1][1] - path[i-2][1];
            const dx2 = path[i][0] - path[i-1][0];
            const dy2 = path[i][1] - path[i-1][1];
            
            if (dx1 !== dx2 || dy1 !== dy2) {
                directionChanges++;
            }
        }
        
        const efficiency = Math.max(0, 100 - (directionChanges * 5));
        return Math.round(efficiency);
    }
    
    static detectBiases(gameData) {
        const biases = [];
        
        // Check for analysis paralysis (too many moves for simple maze)
        if (gameData.moves > 60) {
            biases.push({
                type: 'analysis_paralysis',
                name: 'Analysis Paralysis',
                description: 'Tendency to over-analyze rather than act',
                severity: 'low'
            });
        }
        
        // Check for impulsivity (very fast completion with many moves)
        if (gameData.timeTaken < 30 && gameData.moves > 40) {
            biases.push({
                type: 'impulsivity',
                name: 'Impulsivity',
                description: 'Making quick decisions without full consideration',
                severity: 'low'
            });
        }
        
        // Check for perfectionism (very few moves but long time)
        if (gameData.moves < 30 && gameData.timeTaken > 120) {
            biases.push({
                type: 'perfectionism',
                name: 'Perfectionism',
                description: 'Seeking optimal solutions at the cost of time',
                severity: 'low'
            });
        }
        
        // Check for confirmation bias (repeating same patterns)
        if (gameData.decisions > 50 && gameData.hesitations < 5) {
            biases.push({
                type: 'confirmation_bias',
                name: 'Confirmation Bias',
                description: 'Favoring information that confirms existing choices',
                severity: 'low'
            });
        }
        
        return biases;
    }
    
    static determineArchetype(metrics) {
        const { moves, timeTaken, efficiency, confidence } = metrics;
        
        // Calculate scores
        const speedScore = Math.max(0, 100 - (timeTaken / 3));
        const efficiencyScore = efficiency;
        const confidenceScore = confidence;
        
        const totalScore = (speedScore + efficiencyScore + confidenceScore) / 3;
        
        // Determine archetype
        if (efficiencyScore > 85 && speedScore > 85) {
            return {
                type: 'strategist',
                name: 'The Strategist',
                description: 'Efficient planner who thinks ahead and manages time well',
                confidence: Math.round(totalScore)
            };
        } else if (efficiencyScore < 60 && moves > 40) {
            return {
                type: 'explorer',
                name: 'The Explorer',
                description: 'Curious mind who explores all possibilities before deciding',
                confidence: Math.round(totalScore)
            };
        } else if (speedScore > 90) {
            return {
                type: 'intuitive',
                name: 'The Intuitive',
                description: 'Quick decision maker who trusts instincts and adapts rapidly',
                confidence: Math.round(totalScore)
            };
        } else if (confidenceScore < 70) {
            return {
                type: 'analytical',
                name: 'The Analytical',
                description: 'Careful thinker who analyzes thoroughly before acting',
                confidence: Math.round(totalScore)
            };
        } else {
            return {
                type: 'balanced',
                name: 'The Balanced Thinker',
                description: 'Shows a good mix of different thinking styles',
                confidence: Math.round(totalScore)
            };
        }
    }
}

// Initialize global API instance
document.addEventListener('DOMContentLoaded', () => {
    window.cognitiveAPI = new CognitiveAPI();
    window.CognitiveAnalysis = CognitiveAnalysis;
    
    console.log('Cognitive API initialized');
});
