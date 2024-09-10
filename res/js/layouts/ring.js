function ringLayout() {
    const angle_step = 2 * Math.PI / num_nodes;
    Object.keys(nodes).forEach((key, index) => {
      
        const angle = angle_step * index;
        const radius = 280;
        const x = canvas.width / 2 + radius * Math.cos(angle);
        const y = canvas.height / 2 + radius * Math.sin(angle);
        target_positions[key] = { x, y };
        animation_start_times[key] = now + index * stagger_time;
    });
}