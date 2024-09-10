const Arrow = {};

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








function enableHexagramSymbol(x, y, num) {
    hex_positions[num] = [x, y];
    show_hexagram_symbols = true;
}

function disableHexagramSymbols() {
    show_hexagram_symbols = false;
}