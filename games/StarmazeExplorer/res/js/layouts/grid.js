function generateGridLayout(now) {
    let num_nodes = Object.keys(nodes).length;
    let cols = Math.ceil(Math.sqrt(num_nodes));
    let rows = Math.ceil(num_nodes / cols);
    let stagger_time = window.stagger_time;

    let cell_width = (canvas.width - 100) / cols;
    let cell_height = (canvas.height - 100) / rows;

    Object.keys(nodes).forEach((key, index) => {
        let padded_key = key.padStart(3, '0');
        let n = parseInt(padded_key, 10);

        let row = Math.floor(n / cols);
        let col = n % cols;

        let grid_x_pad = (row % 2 === 0 ? 0 : cell_width / 2);
        
        let x = 50 + col * cell_width + grid_x_pad;
        let y = 50 + row * cell_height + cell_height / 2;
        window.target_positions[key] = { x, y };
        window.animation_start_times[key] = now + index * stagger_time;
    });
}
