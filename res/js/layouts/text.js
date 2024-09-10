const total_nodes = 512;
const text_string = "STARMAZE"; // The text to spell out

function generateTextLayout(text, now, nodes) {
    const layout = {};
    const nodes_per_cell = 2; // Nodes per grid cell, scaled for all nodes
    let node_index = 0;
    const char_spacing = 100; // Spacing between characters for larger text

    const frame_width = 800;
    const frame_height = 600;
    const char_width = 50;
    const char_height = 100;
    
    const stagger_time = window.stagger_time;

    // Mapping of characters to 5x5 bitmaps
    const character_map = {
        'S': [
            [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'T': [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'A': [
            [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 1, 1, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'R': [
            [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
            [1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 1, 1, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 1, 1, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'M': [
            [1, 0, 0, 1, 0, 1, 0, 0, 0, 0],
            [1, 1, 0, 1, 1, 0, 1, 1, 0, 0],
            [1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'E': [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        'Z': [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        ' ': [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ]
    };
    
    const x_margin = Math.ceil(canvas.width/3) - 320;
    const y_margin = 200;

    for (let char_index = 0; char_index < text.length; char_index++) {
        const char = text[char_index];
        const char_map = character_map[char];
        const x_start = char_index * (char_width + char_spacing) + x_margin;
        const y_start = y_margin;
        for (let row = 0; row < char_map.length; row++) {
            for (let col = 0; col < char_map[row].length; col++) {
                if (char_map[row][col] === 1) {
                    for (let n = 0; n < nodes_per_cell; n++) {
                        if (node_index < total_nodes) {
                            // Place each node sequentially, no randomness
                            const x = x_start + col * (char_width / 5); 
                            const y = y_start + row * (char_height / 5);
                            layout[node_index] = { x, y };
                            node_index++;
                        }
                    }
                }
            }
        }
    }

    // assign leftover nodes in sequence at the last valid position
    while (node_index < total_nodes) {
        const last_x = layout[node_index - 1].x;
        const last_y = layout[node_index - 1].y;
        layout[node_index] = { x: last_x, y: last_y };
        node_index++;
    }

    Object.keys(nodes).forEach((key, index) => {
        if (layout[index]) {
            window.target_positions[key] = layout[index];
            window.animation_start_times[key] = now + index * stagger_time;
        }
    });
}