const route = "./res/js/layouts/";
for (const layout of layout_list) loadScript(route + layout + ".js");

function updateLayout() {
    const now = performance.now(); // Get the current time
    let animation_offset = 0; // Staggering to account for invisible nodes

    if (layout_type === "text") {
        const text_layout = generateTextLayout(text_string, total_nodes);

        // Set positions and animation start times
        Object.keys(nodes).forEach((key, index) => {
            if (text_layout[index]) {
                target_positions[key] = text_layout[index];
                animation_start_times[key] = now + index * stagger_time;
            }
        });
    }

    else if (layout_type == "ring") {
        const num_nodes = Object.keys(nodes).length;
        const angle_step = 2 * Math.PI / num_nodes;
        Object.keys(nodes).forEach((key, index) => {
          
            const angle = angle_step * index;
            const radius = 280;
            const x = canvas.width / 2 + radius * Math.cos(angle);
            const y = canvas.height / 2 + radius * Math.sin(angle);
            target_positions[key] = { x, y };
            animation_start_times[key] = now + index * stagger_time;
        });
    } else if (layout_type == "spiral") {
        const num_nodes = Object.keys(nodes).length;
        const center_x = canvas.width / 2;
        const center_y = canvas.height / 2;
        const max_radius = Math.min(center_x, center_y) - 50;
        const angle_step = 0.1;
        const radius_step = max_radius / num_nodes;

        let i = 511;
        Object.keys(nodes).forEach((key) => {
            if (key > 99) return;
            const angle = angle_step * i;
            const radius = radius_step * i;
            const x = center_x + radius * Math.cos(angle);
            const y = center_y + radius * Math.sin(angle);
            target_positions[key] = { x, y };
            animation_start_times[key] = now + i * stagger_time;
            i--;
        });
        Object.keys(nodes).forEach((key) => {
            if (key < 100) return;
            const angle = angle_step * i;
            const radius = radius_step * i;
            const x = center_x + radius * Math.cos(angle);
            const y = center_y + radius * Math.sin(angle);
            target_positions[key] = { x, y };
            animation_start_times[key] = now + i * stagger_time;
            i--;
        });
    } else if (layout_type == "hexagram") {

        const hexagram_width = 80;
        const hexagram_height = 120;
        const margin = 30;

        function getHexagram(room_id) {
            return room_id % 64;
        }

        const hexagram_groups = {};
        Object.keys(nodes).forEach((key) => {
            const hexagram = getHexagram(parseInt(key, 10));
            if (!hexagram_groups[hexagram]) {
                hexagram_groups[hexagram] = [];
            }
            hexagram_groups[hexagram].push(key);
        });

        let x_offset = margin;
        let y_offset = margin + 50;

        Object.keys(hexagram_groups).forEach((hexagram, group_index) => {
            let n_pad = 20;
            if (group_index % 2 == 0) n_pad = -20;
            const group = hexagram_groups[hexagram];
            enableHexagramSymbol(x_offset, y_offset + n_pad, group_index);
            group.forEach((key, index) => {
                const col = index % 6;
                const row = Math.floor(index / 6);
                const x = x_offset + col * (hexagram_width / 6);
                const y = y_offset + row * (hexagram_height / 6) + n_pad;
                target_positions[key] = { x, y };
                const stag = (group_index * group.length + index);
                animation_start_times[key] = now + stag * stagger_time;

            });
            x_offset += hexagram_width + margin;
            if (x_offset + hexagram_width > canvas.width) {
                x_offset = margin;
                y_offset += hexagram_height + margin;
            }
        });
    } else { //grid layout
        const num_nodes = Object.keys(nodes).length;
        const cols = Math.ceil(Math.sqrt(num_nodes));
        const rows = Math.ceil(num_nodes / cols);

        const cell_width = (canvas.width - 100) / cols;
        const cell_height = (canvas.height - 100) / rows;

        Object.keys(nodes).forEach((key, index) => {
            const padded_key = key.padStart(3, '0');
            const n = parseInt(padded_key, 10);

            const row = Math.floor(n / cols);
            const col = n % cols;

            const grid_x_pad = (row % 2 === 0 ? 0 : cell_width / 2);
            
            const x = 50 + col * cell_width + grid_x_pad;
            const y = 50 + row * cell_height + cell_height / 2;
            target_positions[key] = { x, y };
            animation_start_times[key] = now + index * stagger_time;
        });
    }

    animateNodes();
}