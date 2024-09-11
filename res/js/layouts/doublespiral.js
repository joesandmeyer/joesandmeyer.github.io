function generateDoubleSpiralLayout(now) {
    const spacing = 0.12; // Adjust to control the distance between nodes
    const radius = 5; // Base radius for the spirals
    const canvasWidth = canvas.width; // Use actual canvas width
    const canvasHeight = canvas.height; // Use actual canvas height
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const numNodes = 512; // Number of nodes
    let flipflop = false

    const layout = {};

    for (let i = 0; i < numNodes; i++) {
        const angle = i * spacing; // Increment angle by spacing factor
        const spiralDirection = i % 2 === 0 ? 1 : -1; // Alternate between spirals

        // Calculate node position
        const x = spiralDirection * radius * angle * Math.cos(angle);
        const y = radius * angle * Math.sin(angle);

        // Offset position to center it on the canvas
        layout[i] = { x: canvasCenterX + x, y: canvasCenterY - y }; // Subtract y for canvas coordinate system
    }

    // Set positions and animation start times for each node
    Object.keys(nodes).forEach((key, index) => {
        if (layout[index]) { // Ensure layout[index] exists
            window.target_positions[key] = layout[index];
            window.animation_start_times[key] = now + index * window.stagger_time;
        }
    });
}
