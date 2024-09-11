// canvas "mousedown" event listener
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

// canvas "mousemove" event listener
canvas.addEventListener("mousemove", (event) => {
    if (dragging_node) {
        const rect = canvas.getBoundingClientRect();
        const mouse_x = event.clientX - rect.left;
        const mouse_y = event.clientY - rect.top;
        
        //if (show_hexagram_symbols == true)
        disableHexagramSymbols();

        // update node position based on mouse movement
        positions[dragging_node].x = mouse_x - drag_offset_x;
        positions[dragging_node].y = mouse_y - drag_offset_y;

        drawAll();
    } else {
        // hide references div
        if (!canvas_awake) { 
            document.getElementById("ref").remove();
            canvas_awake = true;
        }
      
        // show node info on hover
        const rect = canvas.getBoundingClientRect();
        const mouse_x = event.clientX - rect.left;
        const mouse_y = event.clientY - rect.top;

        let highlighted_node = null;
        let highlighted_node_id = null;
        let hexagram_hovered = false;
        
        if (show_hexagram_symbols) {
        Object.keys(hex_positions).forEach(key => {
            const x = hex_positions[key][0]; // x position of the hexagram
            const y = hex_positions[key][1] - 54; // Adjusted y position of the hexagram

            const hexagramWidth = 40;
            const hexagramHeight = 40;

            // check if mouse is within the bounds of the hexagram rect
            if (mouse_x >= x && mouse_x <= x + hexagramWidth &&
                mouse_y >= y && mouse_y <= y + hexagramHeight) {
                highlighted_node_id = key;

                info_div.textContent = `\n\t\tHexagram ${key}\t\t\t\t\n\t`;
                canvas.style.cursor = "help";
                hexagram_hovered = true;
            }
        });

        }

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
        
        if (hexagram_hovered) return;
            
        if (!mousedown && n_id && element_states[nodes[n_id].element]) {
            const poem = highlighted_node.description;
            canvas.style.cursor = "grab";
            
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
    disableHexagramSymbols();
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