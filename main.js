function to9BitBinary(num) {
    if (num < 0 || num > 511) {
        throw new Error('Number must be between 0 and 511');
    }
    return (num & 0x1FF).toString(2).padStart(9, '0');
}

function fastAtan2(y, x) {
    const abs_y = Math.abs(y) + 1e-10; // Prevent division by zero
    let angle;

    if (x >= 0) {
        const r = (x - abs_y) / (x + abs_y);
        angle = Math.PI / 4 - Math.PI / 4 * r;
    } else {
        const r = (x + abs_y) / (abs_y - x);
        angle = 3 * Math.PI / 4 - Math.PI / 4 * r;
    }

    return y < 0 ? -angle : angle;
}

function playSound(snd) {
    try {
        if (snd.play) {
            snd.play().catch(e => {
            });
        } else {
            throw new Error('Audio element does not support play!');
        }
    } catch (e) {
        console.error('An error occurred while trying to play audio:', e);
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    const body = document.body;
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const margin = 50;
    const extra_right_margin = 100;
    const extra_bottom_margin = 200;
    const width = window.innerWidth - margin - extra_right_margin;
    const height = window.innerHeight - margin - extra_bottom_margin;
    const nodes = smData; //loaded from json file
    let positions = {};
    let hex_positions = {}; //hexagram symbol positions
    let target_positions = {}; // Node destination position after layout update
    let animation_start_times = {}; // When each node starts moving
    let anim_duration = 500; // Duration of the animation in ms
    const stagger_time = 10; // Delay between each node's movement start in ms

    const info_div = document.getElementById('info');
    let layout_type = "grid";
    let show_solution_path = true;
    
    let canvas_awake = false; // Used to hide references div
    let show_hexagram_symbols = false;
    
    let page_muted = true;
    var audio_cd = false; // audio cooldown to prevent speaker damage
    const audio_cooldown = 90;
    
    let mousedown = false;
    
    const framerate_cap = 60; // fps
    
    const notes = [
        new Audio('audio/A.ogg'),
        new Audio('audio/B.ogg'),
        new Audio('audio/C.ogg'),
        new Audio('audio/D.ogg'),
        new Audio('audio/E.ogg'),
        new Audio('audio/G.ogg')
    ];
    
    const tap_noise = new Audio('audio/btn.ogg');

    let lastnode = -1; //for audio on hover

    const solution_path = [
        '016', '325', '484', '238',   
        '123', '010', '344', '013',
        '273', '027', '186', '495'
    ];

    canvas.width = width;
    canvas.height = height;

    // Initialize house_states and element_states
    const house_states = {};
    const element_states = {};

    // House colors
    const house_colors = { //                                ________
        'words':       [true,  '#FF4500'],               // Vibrant
        'sand':        [false, '#D2B48C'],              // Beige
        'time':        [true,  '#6A5ACD'],             // Slate Blue
        'numbers':     [false, '#FF8C00'],            // Bold
        'bones':       [true,  '#8B4513'],           // Earthy
        'birds':       [false, '#1E90FF'],          // Clear
        'dreams':      [false, '#DA70D6'],         // Dreamy                   
        'rain':        [false, '#20B2AA'],        // Cool
        'desire':      [true,  '#FF1493'],       // Intense                  /
        'laughter':    [false, '#FFD700'],      // Soft                     /
        'innocence':   [false, '#FFB6C1'],     // Bright                   /
        'rumor':       [true,  '#B22222'],    // Deep                     /
        'darkness':    [true,  '#555555'],   // Dim
        'lamentation': [true,  '#800080'],  // Rich                     / 
        'whispers':    [false, '#D3D3D3'], // Light                    /
        'judgement':   [true,  '#540000'] // Strong                   /
    };                                   //      text-color,  bg     /
    // Element colors                   // key: [bool (b/w),  string] 
    const element_colors = {           
        'wood':        [false, '#00FF00'], /////   5 steps to inverse
        'fire':        [true,  '#FF0000'],///////   7 steps to inverse
        'water':       [true,  '#0000FF'], ///////   9 steps to inverse
        'earth':       [false, '#FFFF00'],  ///////   11 steps to inverse    /
        'metal':       [false, '#B0B0B0'],   ///////   13 steps to inverse  /
        'emptiness':   [false, '#EEEEEE']     ///////   unreachable inverse
    };

    // Rank sizes
    const rank_sizes = {
        'seat': 24,
        'dais': 18,
        'step': 14,
        'foundation': 10,
        'terminus': 6
    };

    function paddedIdToNumber(id) {
        return parseInt(id, 10); // Convert from string to integer
    }

    // Helper function to check if a node overlaps with existing nodes
    function isOverlapping(x, y, radius, existing_positions) {
        return Object.values(existing_positions).some(pos => {
            const dx = x - pos.x;
            const dy = y - pos.y;
            return Math.sqrt(dx * dx + dy * dy) < radius * 2;
        });
    }

    // Sort nodes by ID
    const sorted_node_keys = Object.keys(nodes).sort((a, b) => {
        return paddedIdToNumber(a) - paddedIdToNumber(b);
    });

    // Calculate grid dimensions
    const num_nodes = sorted_node_keys.length;
    const cols = Math.ceil(Math.sqrt(num_nodes));
    const rows = Math.ceil(num_nodes / cols);

    const cell_width = (width - margin * 2) / cols;
    const cell_height = (height - margin * 2) / rows;

    // Generate staggered grid positions for nodes
    sorted_node_keys.forEach((key, index) => {
        const row = Math.floor(index / cols); // Determine row based on index
        const col = index % cols;            // Determine col based on index
        const radius = rank_sizes[nodes[key].rank] || 15;

        // Calculate x and y positions
        const x = margin + col * cell_width;
        const y = margin + row * cell_height;

        // Assign calculated position to node
        positions[key] = { x, y };
    });
    
    html_snippets = {
        legend_element: [[`<span style="background-color: `],
        [`; color: `], [`; border: `], [`"><b>`], [`</b></span>`]]
    };
    
    function getSnippet(key, bg, txt, border, el) {
        if (!page_muted) playSound(tap_noise);
      
        let snip = "";
        snip += html_snippets[key][0] + bg;
        snip += html_snippets[key][1] + txt;
        snip += html_snippets[key][2] + border;
        snip += html_snippets[key][3] + el;
        snip += html_snippets[key][4];
        return snip;
    }
    
    // Create house legend
    const house_legend_div = document.querySelector('.house-legend');
    Object.keys(house_colors).forEach(house => {
        const bg_clr = house_colors[house][1];
        const txt_clr = (house_colors[house][0] ? '#F2FFFF' : 'black');
        const legend_item = document.createElement('div');
        legend_item.innerHTML = getSnippet('legend_element', bg_clr, txt_clr, 
                                                  "1px solid" + bg_clr, house);
        house_states[house] = true;

        // Add click event listener for toggling visibility
        legend_item.addEventListener('click', () => {
            if (house_states[house]) {
                legend_item.innerHTML = getSnippet('legend_element', "white", 
                                          bg_clr, "1px solid" + bg_clr, house);
            } else {
                legend_item.innerHTML = getSnippet('legend_element', bg_clr,
                                         txt_clr, "1px solid" + bg_clr, house);
            }
            
            house_states[house] = !house_states[house];
            drawAll();
        });

        house_legend_div.appendChild(legend_item);
    });

    // Create element legend
    const element_legend_div = document.querySelector('.element-legend');
    Object.keys(element_colors).forEach(element => {
        const txt_clr = (element_colors[element][0] ? '#F5FFFF' : 'black');
        const bg_clr = element_colors[element][1];
        const legend_item = document.createElement('div');
        legend_item.innerHTML = getSnippet('legend_element', bg_clr, txt_clr, 
                                            "1px solid" + bg_clr, element);
        element_states[element] = true;
        
        if (element == "emptiness") {
                  legend_item.innerHTML = getSnippet('legend_element', bg_clr, 
                                txt_clr, "1px solid" + " lightgray", element);
        };

        // Add click event listener for toggling visibility
        legend_item.addEventListener('click', () => {
            if (element_states[element]) {
                if (element == "emptiness") {
                    legend_item.innerHTML = getSnippet('legend_element', 
                        "#FFFFFF", "#bbb", "1px solid" + "#ddd", element);
                } else {
                    legend_item.innerHTML = getSnippet('legend_element', 
                                "#fff", bg_clr, "1px solid" + bg_clr, element);
                }
            }
            else {
                if (element == "emptiness") {
                    legend_item.innerHTML = getSnippet('legend_element', 
                        bg_clr, txt_clr, "1px solid" + " lightgray", element);
                } else {
                    legend_item.innerHTML = getSnippet('legend_element', 
                              bg_clr, txt_clr, "1px solid" + bg_clr, element);
                }
            }
          
            element_states[element] = !element_states[element];
            drawAll();
        });

        element_legend_div.appendChild(legend_item);
    });

    let dragging_node = null;
    let drag_offset_x = 0;
    let drag_offset_y = 0;

    function drawArrows() {
        if (dragging_node) {
            const key = dragging_node;
            const node = nodes[key];
            const house_color = house_colors[node.house][1];
            const radius = rank_sizes[node.rank] || 15;
            if (!node.doors) return;
            if (node.doors.length > 0 && house_states[node.house]) {
                node.doors.forEach(door => {
                    const doorkey = door.toString().padStart(3, '0');
                    if (positions[doorkey] && 
                        element_states[nodes[doorkey].element] && 
                        element_states[nodes[key].element]) {
                          //
                        const door_radius = rank_sizes[nodes[doorkey].rank] 
                                                                     || 15;
                        drawArrow(positions[key].x, positions[key].y,
                            positions[doorkey].x, positions[doorkey].y,
                            house_color, radius, door_radius);
                    }
                });
            }
        } else {
              
            Object.keys(nodes).forEach(key => {
                const node = nodes[key];
                const house_color = house_colors[node.house][1];
                const radius = rank_sizes[node.rank] || 15;
                if (!node.doors) return;
                if (node.doors.length > 0 && house_states[node.house]) {
                    node.doors.forEach(door => {
                        const doorkey = door.toString().padStart(3, '0');
                        if (positions[doorkey] &&
                            element_states[nodes[doorkey].element] &&
                            element_states[nodes[key].element]) {
                            const door_radius = rank_sizes[nodes[doorkey].rank]
                                                                         || 15;
                            drawArrow(positions[key].x, positions[key].y,
                                positions[doorkey].x, positions[doorkey].y,
                                house_color, radius, door_radius);
                        }
                    });
                }
            });
        }
    }
                                                    //radius start & end
    function drawArrow(x1, y1, x2, y2, house_color, r_start, r_end) {
        const head_length = 10;                     
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = fastAtan2(dy, dx);

        // Adjust start and end points based on node radius
        const ajd_start_x = x1 + (r_start / Math.sqrt(dx * dx + dy * dy)) * dx;
        const ajd_start_y = y1 + (r_start / Math.sqrt(dx * dx + dy * dy)) * dy;
        const ajd_end_x =   x2 - (r_end   / Math.sqrt(dx * dx + dy * dy)) * dx;
        const ajd_end_y =   y2 - (r_end   / Math.sqrt(dx * dx + dy * dy)) * dy;
        
        //line segments
        const seg_1 = ajd_end_x - head_length * Math.cos(angle - Math.PI / 6);
        const seg_2 = ajd_end_y - head_length * Math.sin(angle - Math.PI / 6);
        const seg_3 = ajd_end_x - head_length * Math.cos(angle + Math.PI / 6);
        const seg_4 = ajd_end_y - head_length * Math.sin(angle + Math.PI / 6);
        
        ctx.beginPath();
        ctx.moveTo(ajd_start_x, ajd_start_y);
        ctx.lineTo(ajd_end_x, ajd_end_y);
        ctx.strokeStyle = house_color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ajd_end_x, ajd_end_y);
        ctx.lineTo(seg_1, seg_2); //adjusted segments
        ctx.lineTo(seg_3, seg_4); //adjusted segments
        ctx.lineTo(ajd_end_x, ajd_end_y);
        ctx.fillStyle = house_color;
        ctx.fill();
    }

    function getHexagramLines(hex_id) {
        return Array(6).fill(0).map((_, i) => (hex_id & (1<<i))?1:0).reverse();
    }

    function drawSolutionPath() {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 10]); // Create dotted line effect

        ctx.strokeStyle = 'black'; // Color of the solution path

        for (let i = 0; i < solution_path.length - 1; i++) {
            const start = positions[solution_path[i]];
            const end =   positions[solution_path[i + 1]];

            if (start && end) {
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
            }
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
    }

    function drawAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawArrows();

        Object.keys(positions).forEach(key => {
            if (dragging_node) {
                if (dragging_node !== key){
                    drawNode(key);
                }
            } else {
                drawNode(key);
            }
            
        });
        
        if (dragging_node) {
            canvas.style.cursor = "grabbing";
            
            drawArrows();
            drawNode(dragging_node);
        }
        
        if (show_hexagram_symbols) {
            const hexagramWidth = 40; // Width of the hexagram
            const hexagramHeight = 40; // Height of the hexagram
            const lineHeight = 3; // Height of each line
            const lineSpacing = 2; // Spacing between lines

            function drawHexagram(x, y, hexagram) {
                y -= 54;
                ctx.fillStyle = 'white';
                ctx.fillRect(x-5, y-5, 44, 38);
                ctx.fillStyle = 'black';

                // Each hexagram is represented by six lines
                for (let i = 0; i < 6; i++) {
                    const lineY = y + i * (lineHeight + lineSpacing);
                    if (hexagram[i] === 1) {
                        // Unbroken line
                        ctx.fillRect(x, lineY, hexagramWidth/2 + hexagramWidth/3, lineHeight);
                    } else {
                        // Broken line
                        ctx.fillRect(x, lineY, hexagramWidth/3, lineHeight);
                        ctx.fillRect(x + hexagramWidth/2, lineY, hexagramWidth/3, lineHeight);
                    }
                }
            }

            // Draw each hexagram
            for (let i = 0; i < 64; i++) {
                const hexagram = getHexagramLines(i);
                const x = hex_positions[i][0];
                const y = hex_positions[i][1];

                drawHexagram(x, y, hexagram);
            }
        }


        if (show_solution_path) {
            drawSolutionPath();
        }
    }


    function drawNode(key) {
        const { x, y } = positions[key];

        const node = nodes[key];
        const radius = rank_sizes[node.rank] || 15;
        const color = house_colors[node.house][1] || 'gray';
        let element_color = element_colors[node.element][1] || 'white';
        
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
            element_color = 'black';
        }

        if (element_states[node.element]) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, radius * 0.8, 0, 2 * Math.PI);
            ctx.fillStyle = element_color;
            ctx.fill();

            switch (node.rank) { case "dais": case "seat": case "step": 
                drawNumber(x, y, paddedIdToNumber(key));
            }
        }
    }
    
    function drawNumber(x, y, num) {
        ctx.font = `$14px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(num, x, y);
    }
    
    function enableHexagramSymbol(x, y, num) {
        hex_positions[num] = [x, y];
        show_hexagram_symbols = true;
    }
    
    function disableHexagramSymbols() {
        show_hexagram_symbols = false;
    }
    
    
    
    
    
    
    
    
    //////
    ////
    //
    //
         //   WIP CODE
    //
    
    const total_nodes = 512; // Total number of nodes
    const text_string = "STARMAZE"; // The text to spell out

   function generateTextLayout(text) {
    const layout = {};
    const nodes_per_cell = 2; // Nodes per grid cell, scaled for all nodes
    console.log(nodes_per_cell);
    let node_index = 0;
    const char_spacing = 100; // Spacing between characters for larger text

    const canvas_width = 800;
    const canvas_height = 600;
    const char_width = 50; // Width of each character, increased for larger words
    const char_height = 100; // Height of each character

    // Mapping of characters to 5x5 bitmaps
    const character_map = {
    'S': [
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'T': [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
    ],
    'A': [
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 1, 1, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'R': [
        [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
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
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1]
    ],
    'E': [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'Z': [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
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



    const x_origin = Math.ceil(canvas.width/3) - 320;
    const y_origin = 200;

    for (let char_index = 0; char_index < text.length; char_index++) {
        const char = text[char_index];
        const char_map = character_map[char];
        const x_start = char_index * (char_width + char_spacing) + x_origin;
        const y_start = y_origin;

        for (let row = 0; row < char_map.length; row++) {
            for (let col = 0; col < char_map[row].length; col++) {
                if (char_map[row][col] === 1) {
                    for (let n = 0; n < nodes_per_cell; n++) {
                        if (node_index >= total_nodes) return layout;

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

    // If nodes are remaining, continue assigning them in sequence at the last valid position
    while (node_index < total_nodes) {
        const last_x = layout[node_index - 1].x;
        const last_y = layout[node_index - 1].y;
        layout[node_index] = { x: last_x, y: last_y };
        node_index++;
    }

    return layout;
}




    
    
    
    //////
    ////
    //
    //
    
    //
    
    
    
    
    
    

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
        } else {
            const num_nodes = Object.keys(nodes).length;
            const cols = Math.ceil(Math.sqrt(num_nodes));
            const rows = Math.ceil(num_nodes / cols);

            const cell_width = (canvas.width - margin * 2) / cols;
            const cell_height = (canvas.height - margin * 2) / rows;

            Object.keys(nodes).forEach((key, index) => {
                const padded_key = key.padStart(3, '0');
                const n = parseInt(padded_key, 10);

                const row = Math.floor(n / cols);
                const col = n % cols;

                const grid_x_pad = (row % 2 === 0 ? 0 : cell_width / 2);
                
                const x = margin + col * cell_width + grid_x_pad;
                const y = margin + row * cell_height + cell_height / 2;
                target_positions[key] = { x, y };
                animation_start_times[key] = now + index * stagger_time;
            });
        }

        animateNodes();
    }

    let last_frame_time = 0;
    const node_keys = Object.keys(nodes); // Cache keys for performance

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    function animateNodes(timestamp) {
        let node_animation_complete = {};
        
        if (timestamp - last_frame_time < 1000 / framerate_cap) {
            requestAnimationFrame(animateNodes);
            return;
        }
        last_frame_time = timestamp;

        const now = performance.now();
        let all_nodes_reached = true;

        for (let i = 0; i < node_keys.length; i++) {
            const key = node_keys[i];
            if (dragging_node) continue;
            if (node_animation_complete[key]) continue;
            
            const start_x = positions[key].x;
            const start_y = positions[key].y;
            const target_x = target_positions[key].x;
            const target_y = target_positions[key].y;
            const start_time = animation_start_times[key];

            if (now < start_time) {
                all_nodes_reached = false;
                continue;
            }

            const elapsed_time = Math.min(now - start_time, anim_duration);
            
            if (elapsed_time >= anim_duration) {
                node_animation_complete[key] = true;
                continue;
            }
            const t = elapsed_time / anim_duration;
            
            positions[key].x = lerp(start_x, target_x, t);
            positions[key].y = lerp(start_y, target_y, t);
            if (t < 1) {
                all_nodes_reached = false;
            }
        }

        drawAll();

        if (!all_nodes_reached) {
            requestAnimationFrame(animateNodes);
        }
    }

    // Add drag-related event listeners
    canvas.addEventListener('mousedown', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouse_x = event.clientX - rect.left;
        const mouse_y = event.clientY - rect.top;

        // Check if a node is clicked
        Object.keys(positions).forEach(key => {
            const { x, y } = positions[key];
            const radius = rank_sizes[nodes[key].rank] || 15;
            const dx = mouse_x - x;
            const dy = mouse_y - y;
            if (Math.sqrt(dx * dx + dy * dy) < radius) {
                dragging_node = key;
                drag_offset_x = mouse_x - x;
                drag_offset_y = mouse_y - y;
            }
        });
    });
    
    function playNoteForNode(node_id) {
        if (page_muted || audio_cd) return;
        if (!element_states[nodes[node_id].element]) return;
        audio_cd = true;
        
        setTimeout(() => {
          audio_cd = false;
        },audio_cooldown);
        const note_index = parseInt(node_id, 10) % notes.length; // 0-padded id
        notes[note_index].pause();                              // (e.g. "042")
        notes[note_index].current_time = 0;
        
        const audio_element = notes[note_index];
        
        playSound(audio_element);
        
        lastnode = node_id; // Update the lastNodeId --- prevents note spamming
    }
    
    
      ///
     ///  Define callback funcs
    ///
    

    canvas.addEventListener('mousemove', (event) => {
        if (dragging_node) {
            const rect = canvas.getBoundingClientRect();
            const mouse_x = event.clientX - rect.left;
            const mouse_y = event.clientY - rect.top;
            
            //if (show_hexagram_symbols == true)
            disableHexagramSymbols();

            // Update node position based on mouse movement
            positions[dragging_node].x = mouse_x - drag_offset_x;
            positions[dragging_node].y = mouse_y - drag_offset_y;

            drawAll();
        } else {
            // hide references div
            if (!canvas_awake) { 
                document.getElementById("ref").remove();
                canvas_awake = true;
            }
          
            // Show node info on hover
            const rect = canvas.getBoundingClientRect();
            const mouse_x = event.clientX - rect.left;
            const mouse_y = event.clientY - rect.top;

            let highlighted_node = null;
            let highlighted_node_id = null;

            canvas.style.cursor = "grab";

            Object.keys(positions).forEach(key => {
                const { x, y } = positions[key];
                const radius = rank_sizes[nodes[key].rank] || 15;
                const dx = mouse_x - x;
                const dy = mouse_y - y;
                if (Math.sqrt(dx * dx + dy * dy) < radius) {
                    highlighted_node = nodes[key];
                    highlighted_node_id = key;
                }
            });
            
            let n_id = highlighted_node_id;
            if (n_id != lastnode && n_id != null) {
                lastnode = n_id;
                playNoteForNode(lastnode);
            }
                
            if (!mousedown && n_id && element_states[nodes[n_id].element]) {
                const poem = highlighted_node.description;
                
                // Extrapolate data (e.g. house types [districts], from houses)
                    
                let dir = "";      //("N", "S", "E", "W") cardinal direction
                let sect = "";    // ("Deep", "Bastion", ...) temple section
                 
                         // "Temple"    /starmaze/glossary.html#temple
                        // A collection of rooms in the starmaze.
                       //  There is a North, South, East, and West temple.
                      //   Each temple consists of four houses:
                     //       - an underground    <Deep>      which leads up to
                    //        - an outward facing <Bastion>   and
                   //         - an inward-facing  <Courtyard> which in turn
                  //          - lead up to a      <Tower>.
          
                //determine district (direction .. section)
                let haus = highlighted_node["house"];
                
                switch (true) { // The Eastearn Temple overlooks a forest
                    case haus == "words"     || haus == "bones":
                    case haus == "desire"    || haus == "darkness":
                        dir = "Eastern"; 
                        break; // The Southern Temple overlooks a desert
                    case haus == "sand"      || haus == "birds":
                    case haus == "laughter"  || haus == "lamentation":
                        dir = "Southern";
                        break; // The Western Temple overlooks an ocean
                    case haus == "time"      || haus == "dreams":
                    case haus == "innocence" || haus == "whispers":
                        dir = "Western";
                        break; // The Northern Temple overlooks a mountain
                    case haus == "numbers"   || haus == "rain":
                    case haus == "rumor"     || haus == "judgement":
                        dir = "Northern";
                        break;
                    default:
                        dir = "???";
                }
                
                switch (true) {
                    case haus == "words"     || haus == "sand":
                    case haus == "time"      || haus == "numbers":
                        sect = "Bastion";
                        break;
                    case haus == "bones"     || haus == "birds":
                    case haus == "dreams"    || haus == "rain":
                        sect = "Tower";
                        break;
                    case haus == "desire"    || haus == "laughter":
                    case haus == "innocence" || haus == "rumor":
                        sect = "Courtyard";
                        break;
                    case haus == "darkness"  || haus == "lamentation":
                    case haus == "whispers"  || haus == "judgement":
                        sect = "Depths";
                        break;
                    default:
                        sect = "???";
                }
  
                //insert district and re-ordered keys
                let new_highlighted_node = {};
                let newKeyInserted = false;
                for (let key in highlighted_node) {
                    if (!newKeyInserted) {
                        new_highlighted_node["district"] = dir + " " + sect; 
                        newKeyInserted = true;
                    }
                    new_highlighted_node[key] = highlighted_node[key];
                }
                highlighted_node = new_highlighted_node;
  
                 // Create a copy of highlighted_node excluding the 'description'
                const { description, ...no_description } = highlighted_node;

                // Format JSON as a string and replace new lines for HTML
                let formatted_json = JSON.stringify(no_description, null, 2)
                    .replace(/\n/g, '<br>')
                    .replace(/ /g, '&nbsp;');

                // Set HTML content including formatted JSON and the text
                info_div.innerHTML = `
                    Room id: ${highlighted_node_id}
                    <pre id="poetry">${poem}</pre>
                    <hr>
                    <pre style="margin-bottom: -5px;">${formatted_json}</pre>
                `;

            } else {
                canvas.style.cursor = "default";
              
                info_div.innerHTML = '';
                lastnode = -1;
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        canvas.style.cursor = "default";
        dragging_node = null;
        drawAll();
    });
    
    document.addEventListener('mouseup', () => {
        info_div.innerHTML = '';
        mousedown = false;
    });
    
    document.addEventListener('mousedown', () => {
        drawAll();
        mousedown = true;
        //lastnode = -1;   uncomment for node's sound to repeat on click
    });
    
    canvas.addEventListener('mouseleave', function(event) {
        dragging_node = null;
        drawAll();
    });

    function toggleLayout() {
        if (!page_muted) playSound(tap_noise);
      
        if (layout_type == "grid") layout_type = "ring";
        else if (layout_type == "ring") layout_type = "spiral";
        else if (layout_type == "spiral") layout_type = "hexagram";
        else if (layout_type == "hexagram") {
            layout_type = "text";
            disableHexagramSymbols();
        }
        else if (layout_type == "text") layout_type = "grid";
        updateLayout();
    }

    function toggleSolutionPath() {
        if (!page_muted) playSound(tap_noise);

        if (show_solution_path) {
            document.getElementById('toggleSolutionPath').style.color = "#aaa";
        } else {
            document.getElementById('toggleSolutionPath').style.color = "#333";
        }
      
        show_solution_path = !show_solution_path;
        drawAll();
    }
    
    function toggleMuteUnmute() {
        page_muted = !page_muted;
        if (page_muted) {
            document.getElementById("mute").style.display = "none";
            document.getElementById("unmute").style.display = "inline-block";
        } else {
            playSound(tap_noise);
            document.getElementById('mute').style.display = "inline-block";
            document.getElementById('unmute').style.display = "none";
        }
    }

    // Ensure elements exist before adding event listeners
    const toggle_layout_btn = document.getElementById('toggleLayout');
    const toggle_solution_btn = document.getElementById('toggleSolutionPath');
    const toggle_mute_btn = document.getElementById('muteUnmute');

    if (toggle_layout_btn) {
        toggle_layout_btn.addEventListener('click', toggleLayout);
    }

    if (toggle_solution_btn) {
        toggle_solution_btn.addEventListener('click', toggleSolutionPath);
    }
    
    if (toggle_mute_btn) {
        toggle_mute_btn.addEventListener('click', toggleMuteUnmute);
    }

    updateLayout();
    drawAll();
});

const printAllPoems = function() {
    Object.keys(smData).forEach(key => {
        console.log(smData[key].description);
    });
};