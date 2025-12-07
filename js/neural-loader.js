// js/neural-loader.js - Neural Network Visualization

function createNeuralNetwork(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const nodes = [];
    const connections = [];
    
    // Configuration
    const config = {
        nodeCount: 20,
        connectionCount: 40,
        colors: ['#2A4B8C', '#6B46C1', '#0D9488', '#EA580C', '#CA8A04'],
        speed: 0.3,
        pulseSpeed: 0.02,
        glow: true
    };
    
    // Initialize nodes
    for (let i = 0; i < config.nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 4 + 3,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            vx: (Math.random() - 0.5) * config.speed,
            vy: (Math.random() - 0.5) * config.speed,
            pulse: Math.random() * Math.PI * 2,
            glow: Math.random() > 0.5
        });
    }
    
    // Create connections
    for (let i = 0; i < config.connectionCount; i++) {
        const nodeA = nodes[Math.floor(Math.random() * nodes.length)];
        const nodeB = nodes[Math.floor(Math.random() * nodes.length)];
        
        if (nodeA !== nodeB) {
            connections.push({
                nodeA,
                nodeB,
                strength: Math.random() * 0.3 + 0.2,
                pulse: Math.random() * Math.PI * 2,
                active: true
            });
        }
    }
    
    // Animation loop
    function animate() {
        // Clear with fade effect
        ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw connections
        connections.forEach(conn => {
            const dx = conn.nodeB.x - conn.nodeA.x;
            const dy = conn.nodeB.y - conn.nodeA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only draw if nodes are reasonably close
            if (distance < 300) {
                const alpha = (1 - distance / 300) * 0.4;
                const pulseAlpha = (Math.sin(conn.pulse) + 1) * 0.2;
                
                ctx.beginPath();
                ctx.moveTo(conn.nodeA.x, conn.nodeA.y);
                ctx.lineTo(conn.nodeB.x, conn.nodeB.y);
                ctx.strokeStyle = `rgba(107, 70, 193, ${alpha + pulseAlpha})`;
                ctx.lineWidth = conn.strength * 3;
                ctx.stroke();
                
                conn.pulse += config.pulseSpeed;
            }
        });
        
        // Update and draw nodes
        nodes.forEach(node => {
            // Update position with boundary bounce
            node.x += node.vx;
            node.y += node.vy;
            
            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
            
            // Keep within bounds
            node.x = Math.max(10, Math.min(canvas.width - 10, node.x));
            node.y = Math.max(10, Math.min(canvas.height - 10, node.y));
            
            // Draw node with pulse effect
            const pulseSize = node.radius * (1 + Math.sin(node.pulse) * 0.3);
            
            if (config.glow && node.glow) {
                // Glow effect
                ctx.save();
                ctx.shadowColor = node.color;
                ctx.shadowBlur = 15;
                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else {
                // Regular node
                ctx.fillStyle = node.color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            node.pulse += 0.05;
        });
        
        requestAnimationFrame(animate);
    }
    
    // Handle resize
    function resize() {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            
            // Reposition nodes if canvas size changed significantly
            const scaleX = canvas.width / (canvas.dataset.lastWidth || canvas.width);
            const scaleY = canvas.height / (canvas.dataset.lastHeight || canvas.height);
            
            nodes.forEach(node => {
                node.x *= scaleX;
                node.y *= scaleY;
            });
            
            canvas.dataset.lastWidth = canvas.width;
            canvas.dataset.lastHeight = canvas.height;
        }
    }
    
    // Initialize
    window.addEventListener('resize', resize);
    resize();
    
    // Start animation
    animate();
    
    // Return controller object
    return {
        nodes,
        connections,
        updateConfig: (newConfig) => {
            Object.assign(config, newConfig);
        },
        destroy: () => {
            window.removeEventListener('resize', resize);
        }
    };
}

// Simple loading animation for the loading screen
function createSimpleNeuralLoader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Add CSS for connections
    const style = document.createElement('style');
    style.textContent = `
        .neural-connection {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, transparent, #6B46C1, transparent);
            transform-origin: 0 0;
            animation: neuralFlow 4s infinite linear;
        }
        
        @keyframes neuralFlow {
            0% { opacity: 0; transform: scaleX(0); }
            50% { opacity: 1; transform: scaleX(1); }
            100% { opacity: 0; transform: scaleX(0); }
        }
    `;
    document.head.appendChild(style);
    
    // Create connections between nodes
    const nodes = container.querySelectorAll('.neural-node');
    nodes.forEach((nodeA, i) => {
        nodes.forEach((nodeB, j) => {
            if (i < j && Math.random() > 0.7) {
                const rectA = nodeA.getBoundingClientRect();
                const rectB = nodeB.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                const x1 = rectA.left - containerRect.left + rectA.width / 2;
                const y1 = rectA.top - containerRect.top + rectA.height / 2;
                const x2 = rectB.left - containerRect.left + rectB.width / 2;
                const y2 = rectB.top - containerRect.top + rectB.height / 2;
                
                const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                
                const connection = document.createElement('div');
                connection.className = 'neural-connection';
                connection.style.width = `${distance}px`;
                connection.style.left = `${x1}px`;
                connection.style.top = `${y1}px`;
                connection.style.transform = `rotate(${angle}deg)`;
                connection.style.animationDelay = `${Math.random() * 2}s`;
                
                container.appendChild(connection);
            }
        });
    });
}

// Export functions for global use
window.createNeuralNetwork = createNeuralNetwork;
window.createSimpleNeuralLoader = createSimpleNeuralLoader;

// Auto-initialize if on hero section
document.addEventListener('DOMContentLoaded', () => {
    const neuralCanvas = document.getElementById('neural-canvas');
    if (neuralCanvas) {
        setTimeout(() => {
            createNeuralNetwork('neural-canvas');
        }, 1000);
    }
    
    // Initialize simple loader for loading screen
    const neuralLoader = document.querySelector('.neural-loader');
    if (neuralLoader) {
        createSimpleNeuralLoader('neural-loader');
    }
});
