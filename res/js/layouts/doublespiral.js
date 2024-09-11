function generateDoubleSpiralLayout(now) {
    // function doubleSpiralLayout(now);
    
const spacing = 0.2; // Adjust to control the distance between nodes
const radius = 5; // Base radius for the spirals
const canvasWidth = 800; // Replace with actual canvas width
const canvasHeight = 600; // Replace with actual canvas height
const canvasCenterX = canvasWidth / 2;
const canvasCenterY = canvasHeight / 2;
let node_index = 0;
const numNodes = 512; // Number of nodes

for (let i = 0; i < numNodes; i++) {
    const angle = i * spacing; // Increment angle by spacing factor
    const spiralDirection = 1; // Use a consistent direction

    // Calculate node position
    const x = spiralDirection * radius * angle * Math.cos(angle);
    const y = radius * angle * Math.sin(angle);

    // Offset position to center it on the canvas
    window.layout[node_index] = { x: canvasCenterX + x, y: canvasCenterY - y };
    node_index++;
}

// Set positions and animation start times for each node
Object.keys(nodes).forEach((key, index) => {
    if (window.layout[index]) { // Use index instead of key
        window.target_positions[key] = window.layout[index];
        window.animation_start_times[key] = now + index * window.stagger_time;
    }
});
}
