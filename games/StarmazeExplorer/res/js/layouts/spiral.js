function generateSpiralLayout(now) {
    let num_nodes = Object.keys(nodes).length;
    let center_x = canvas.width / 2;
    let center_y = canvas.height / 2;
    let max_radius = Math.min(center_x, center_y) - 50;
    let angle_step = 0.1;
    let radius_step = max_radius / num_nodes;

    let i = 511;
    Object.keys(nodes).forEach((key) => {
        if (key > 99) return;
        let angle = angle_step * i;
        let radius = radius_step * i;
        let x = center_x + radius * Math.cos(angle);
        let y = center_y + radius * Math.sin(angle);
        window.target_positions[key] = { x, y };
        window.animation_start_times[key] = now + i * window.stagger_time;
        i--;
    });
    Object.keys(nodes).forEach((key) => {
        if (key < 100) return;
        let angle = angle_step * i;
        let radius = radius_step * i;
        let x = center_x + radius * Math.cos(angle);
        let y = center_y + radius * Math.sin(angle);
        window.target_positions[key] = { x, y };
        window.animation_start_times[key] = now + i * window.stagger_time;
        i--;
    });
}
