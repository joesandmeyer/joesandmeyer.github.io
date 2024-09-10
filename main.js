function startVisualizer() {

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
}

// Listens for custom event 'loadComplete'
document.addEventListener('DOMContentLoaded', (event) => {
    document.addEventListener('loadComplete', (event) => {
        startVisualizer();
    });
});

const printAllPoems = function() {
    Object.keys(smData).forEach(key => {
        console.log(smData[key].description);
    });
};