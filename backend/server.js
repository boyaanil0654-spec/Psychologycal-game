const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for now
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get root directory (one level up from backend folder)
const rootDir = path.join(__dirname, '..');

// Serve static files from root directory
app.use(express.static(rootDir, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    // Cache static assets longer
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// ========== API ENDPOINTS ==========

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Cognitive Puzzle API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start a new game session
app.post('/api/session/start', (req, res) => {
  try {
    const { userId, puzzleType } = req.body;
    
    const session = {
      sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId: userId || 'anonymous_' + Date.now(),
      puzzleType: puzzleType || 'ego_labyrinth',
      startTime: new Date().toISOString(),
      status: 'active'
    };
    
    console.log('New session started:', session.sessionId);
    
    res.status(201).json({
      success: true,
      session,
      message: 'Game session started successfully'
    });
    
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session',
      message: error.message
    });
  }
});

// Track game events
app.post('/api/events/track', (req, res) => {
  try {
    const { sessionId, eventType, data } = req.body;
    
    if (!sessionId || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId and eventType'
      });
    }
    
    console.log('Event tracked:', { sessionId, eventType, timestamp: new Date().toISOString() });
    
    // In production, you would save this to a database
    // For now, just acknowledge receipt
    
    res.status(200).json({
      success: true,
      message: 'Event tracked successfully',
      event: {
        sessionId,
        eventType,
        timestamp: new Date().toISOString(),
        processed: true
      }
    });
    
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: error.message
    });
  }
});

// Analyze game completion
app.post('/api/analyze/game', (req, res) => {
  try {
    const { 
      sessionId,
      moves,
      timeTaken,
      decisions,
      pathTaken,
      hesitations 
    } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    // Calculate basic metrics
    const moveEfficiency = Math.min(100, Math.round((100 - moves) * 100 / 150));
    const timeEfficiency = Math.min(100, Math.round((300 - timeTaken) * 100 / 300));
    const decisionConfidence = Math.min(100, Math.round((100 - (hesitations || 0))));
    
    // Determine cognitive archetype based on gameplay
    let archetype = 'balanced';
    let archetypeDescription = '';
    
    if (moveEfficiency > 80 && timeEfficiency > 80) {
      archetype = 'strategist';
      archetypeDescription = 'Efficient planner who thinks ahead';
    } else if (moveEfficiency < 60 && decisions > 30) {
      archetype = 'explorer';
      archetypeDescription = 'Curious mind who explores all possibilities';
    } else if (timeEfficiency > 90) {
      archetype = 'intuitive';
      archetypeDescription = 'Quick decision maker who trusts instincts';
    } else if (decisionConfidence < 70) {
      archetype = 'analytical';
      archetypeDescription = 'Careful thinker who analyzes thoroughly';
    }
    
    // Detect potential cognitive biases
    const biases = [];
    if (moves > 50) biases.push('analysis_paralysis');
    if (hesitations > 10) biases.push('decision_anxiety');
    if (timeTaken < 30 && moves > 40) biases.push('impulsivity');
    
    // Generate insights
    const insights = [
      `You made ${moves} moves in ${timeTaken} seconds`,
      `Your decision efficiency score: ${moveEfficiency}%`,
      `Your time management score: ${timeEfficiency}%`,
      `Your confidence level: ${decisionConfidence}%`
    ];
    
    // Generate cognitive profile
    const cognitiveProfile = {
      sessionId,
      archetype: {
        type: archetype,
        name: getArchetypeName(archetype),
        description: archetypeDescription,
        confidence: Math.round((moveEfficiency + timeEfficiency + decisionConfidence) / 3)
      },
      metrics: {
        moves,
        timeTaken,
        decisions: decisions || moves * 2,
        moveEfficiency,
        timeEfficiency,
        decisionConfidence,
        overallScore: Math.round((moveEfficiency + timeEfficiency + decisionConfidence) / 3)
      },
      biases: biases.map(bias => ({
        type: bias,
        name: getBiasName(bias),
        description: getBiasDescription(bias),
        severity: 'low'
      })),
      insights,
      recommendations: [
        biases.length > 0 ? `Practice making quicker decisions to overcome ${biases[0]}` : 'Great balanced approach!',
        moveEfficiency < 70 ? 'Try planning your route more carefully' : 'Excellent path efficiency!',
        timeEfficiency < 70 ? 'Work on time management during puzzles' : 'Great time management!'
      ],
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      profile: cognitiveProfile,
      shareable: {
        archetype: cognitiveProfile.archetype.name,
        score: cognitiveProfile.metrics.overallScore,
        topBias: cognitiveProfile.biases[0]?.name || 'None detected'
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze game data',
      message: error.message
    });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    // Mock leaderboard data
    const leaderboard = [
      { rank: 1, username: 'MindMaster', score: 98, archetype: 'Strategist', time: '1:23' },
      { rank: 2, username: 'Brainiac', score: 95, archetype: 'Intuitive', time: '1:45' },
      { rank: 3, username: 'PuzzleSage', score: 92, archetype: 'Analytical', time: '2:10' },
      { rank: 4, username: 'NeuroNomad', score: 88, archetype: 'Explorer', time: '3:30' },
      { rank: 5, username: 'CognitiveNinja', score: 85, archetype: 'Balanced', time: '1:55' },
      { rank: 6, username: 'ThoughtWeaver', score: 82, archetype: 'Strategist', time: '2:05' },
      { rank: 7, username: 'PatternSeeker', score: 80, archetype: 'Analytical', time: '2:45' },
      { rank: 8, username: 'MindfulMaze', score: 78, archetype: 'Explorer', time: '3:15' }
    ];
    
    res.status(200).json({
      success: true,
      leaderboard,
      updated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Get game statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      totalGames: 1234,
      totalPlayers: 892,
      averageScore: 72,
      mostCommonArchetype: 'Balanced',
      averageTime: '2:30',
      puzzlesCompleted: 7890,
      activeToday: 156
    };
    
    res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Helper functions
function getArchetypeName(type) {
  const names = {
    strategist: 'The Strategist',
    explorer: 'The Explorer',
    intuitive: 'The Intuitive',
    analytical: 'The Analytical',
    balanced: 'The Balanced Thinker'
  };
  return names[type] || 'The Thinker';
}

function getBiasName(bias) {
  const names = {
    analysis_paralysis: 'Analysis Paralysis',
    decision_anxiety: 'Decision Anxiety',
    impulsivity: 'Impulsivity',
    perfectionism: 'Perfectionism',
    confirmation_bias: 'Confirmation Bias'
  };
  return names[bias] || 'Cognitive Bias';
}

function getBiasDescription(bias) {
  const descriptions = {
    analysis_paralysis: 'Tendency to over-analyze situations',
    decision_anxiety: 'Hesitation when making choices',
    impulsivity: 'Making quick decisions without full consideration',
    perfectionism: 'Seeking perfect solutions at the cost of time',
    confirmation_bias: 'Favoring information that confirms existing beliefs'
  };
  return descriptions[bias] || 'A cognitive pattern that affects decision-making';
}

// Serve index.html for all other routes (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🧠 COGNITIVE PUZZLE SERVER 🧠
  ==============================
  🚀 Server running on port: ${PORT}
  📂 Serving from: ${rootDir}
  ⏰ Started: ${new Date().toISOString()}
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  ==============================
  `);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  process.exit(0);
});
