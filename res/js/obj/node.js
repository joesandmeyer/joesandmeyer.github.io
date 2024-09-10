const Node = {};

///////
// motion functions
/////

// checks if a node overlaps with existing nodes
function isOverlapping(x, y, radius, existing_positions) {
    return Object.values(existing_positions).some(pos => {
        const dx = x - pos.x;
        const dy = y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) < radius * 2;
    });
}

// animate nodes
let last_frame_time = 0;
const node_keys = Object.keys(nodes); // Cache keys for performance
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

///////
// sound functions
/////

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

///////
// drawing functions
/////

function drawNumber(x, y, num) {
    ctx.font = `$14px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(num, x, y);
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