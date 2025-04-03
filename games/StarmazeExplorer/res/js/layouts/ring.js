function generateRingLayout(now) {
    let num_nodes = Object.keys(nodes).length;
    let angle_step = 2 * Math.PI / num_nodes;
    Object.keys(nodes).forEach((key, index) => {
        let angle = angle_step * index;
        let radius = 280;
        let x = canvas.width / 2 + radius * Math.cos(angle);
        let y = canvas.height / 2 + radius * Math.sin(angle);
        window.target_positions[key] = { x, y };
        window.animation_start_times[key] = now + index * window.stagger_time;
    });
}
