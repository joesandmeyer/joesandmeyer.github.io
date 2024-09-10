const layouts_path = "./res/js/layouts/";

function loadLayout(k) {
    loadScript(layouts_path + layout_list[k] + ".js", (n) => {
        if (k >= layout_list.length - 1) {
            
            updateLayout = function (n) {
                layout_type = layout_list[n];
                //console.log("Layout type: " + layout_type);
                const now = performance.now(); // get the current time
                let animation_offset = 0; // staggering to account for invisible nodes

                if (layout_type === "text") {
                    const text_layout = generateTextLayout(text_string, total_nodes);

                    // Set positions and animation start times
                    Object.keys(nodes).forEach((key, index) => {
                        if (text_layout[index]) {
                            window.target_positions[key] = text_layout[index];
                            window.animation_start_times[key] = now + index * stagger_time;
                        }
                    });
                }
                else if (layout_type == "ring") {
                    generateRingLayout(now);
                } else if (layout_type == "spiral") {
                    generateSpiralLayout();
                    
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
                        target_positions[key] = { x, y };
                        animation_start_times[key] = now + i * stagger_time;
                        i--;
                    });
                    Object.keys(nodes).forEach((key) => {
                        if (key < 100) return;
                        let angle = angle_step * i;
                        let radius = radius_step * i;
                        let x = center_x + radius * Math.cos(angle);
                        let y = center_y + radius * Math.sin(angle);
                        target_positions[key] = { x, y };
                        animation_start_times[key] = now + i * stagger_time;
                        i--;
                    });
                } else if (layout_type == "hexagram") {
                    generateHexagramLayout();
                    
                    let hexagram_width = 80;
                    let hexagram_height = 120;
                    let margin = 30;

                    function getHexagram(room_id) {
                        return room_id % 64;
                    }

                    let hexagram_groups = {};
                    Object.keys(nodes).forEach((key) => {
                        let hexagram = getHexagram(parseInt(key, 10));
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
                        let group = hexagram_groups[hexagram];
                        enableHexagramSymbol(x_offset, y_offset + n_pad, group_index);
                        group.forEach((key, index) => {
                            let col = index % 6;
                            let row = Math.floor(index / 6);
                            let x = x_offset + col * (hexagram_width / 6);
                            let y = y_offset + row * (hexagram_height / 6) + n_pad;
                            target_positions[key] = { x, y };
                            let stag = (group_index * group.length + index);
                            animation_start_times[key] = now + stag * stagger_time;

                        });
                        x_offset += hexagram_width + margin;
                        if (x_offset + hexagram_width > canvas.width) {
                            x_offset = margin;
                            y_offset += hexagram_height + margin;
                        }
                    });
                } else { //grid layout
                    generateGridLayout();
                    
                    let num_nodes = Object.keys(nodes).length;
                    let cols = Math.ceil(Math.sqrt(num_nodes));
                    let rows = Math.ceil(num_nodes / cols);

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
                        target_positions[key] = { x, y };
                        animation_start_times[key] = now + index * stagger_time;
                    });
                }

                animateNodes();
            }
            
            const event = new CustomEvent('layoutsLoaded', { });
            document.dispatchEvent(event);
            
            return;
        }
        
        loadLayout(k + 1);
    });
}

loadLayout(0);