function to9BitBinary(num) {
    if (num < 0 || num > 511) {
        throw new Error('Number must be between 0 and 511');
    }
    // Convert to binary and ensure it is in 9-bit format by using bitwise operations
    return (num & 0x1FF).toString(2).padStart(9, '0');
}

document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const margin = 50;
    const extraRightMargin = 100;
    const extraBottomMargin = 200;
    const width = window.innerWidth - margin - extraRightMargin;
    const height = window.innerHeight - margin - extraBottomMargin;
    const nodes = smData;
    let positions = {};
    const infoDiv = document.getElementById('info');
    let layoutType = "grid";
    let showSolutionPath = false;
    
    var audio_cd = false; // audio cooldown to prevent speaker damage
    const audio_cooldown = 90;
    
    const notes = [
        new Audio('audio/A.ogg'),
        new Audio('audio/B.ogg'),
        new Audio('audio/C.ogg'),
        new Audio('audio/D.ogg'),
        new Audio('audio/E.ogg'),
        new Audio('audio/G.ogg')
    ];

    let lastnode = -1; //for audio on hover

    // Solution path (node IDs in sequence)
    const solutionPath = [
        '016', '325', '484', '238', '123', '010', '344', '013', '273', '027', '186', '495'
    ];

    // Canvas size
    canvas.width = width;
    canvas.height = height;

    // Initialize houseStates and elementStates
    const houseStates = {};
    const elementStates = {};

    // House colors
    const houseColors = {
        'words': '#FF4500',        // Vibrant
        'sand': '#D2B48C',         // Beige
        'time': '#6A5ACD',         // Slate Blue
        'numbers': '#FF8C00',      // Bold
        'bones': '#8B4513',        // Earthy
        'birds': '#1E90FF',        // Clear
        'dreams': '#DA70D6',       // Dreamy
        'rain': '#20B2AA',         // Cool
        'desire': '#FF1493',       // Intense
        'laughter': '#FFD700',     // Bright
        'innocence': '#FFB6C1',    // Soft
        'rumor': '#B22222',        // Deep
        'darkness': '#555555',     // Dim
        'lamentation': '#800080',  // Rich
        'whispers': '#D3D3D3',     // Light
        'judgement': '#8B0000'     // Strong
    };

    // Element colors
    const elementColors = {
        'wood': '#00FF00',
        'fire': '#FF0000',
        'water': '#0000FF',
        'earth': '#FFFF00',
        'metal': '#B0B0B0',
        'emptiness': '#FFFFFF'
    };

    // Rank sizes
    const rankSizes = {
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
    function isOverlapping(x, y, radius, existingPositions) {
        return Object.values(existingPositions).some(pos => {
            const dx = x - pos.x;
            const dy = y - pos.y;
            return Math.sqrt(dx * dx + dy * dy) < radius * 2;
        });
    }

    // Sort nodes by ID
    const sortedNodeKeys = Object.keys(nodes).sort((a, b) => {
        return paddedIdToNumber(a) - paddedIdToNumber(b);
    });

    // Calculate grid dimensions
    const numNodes = sortedNodeKeys.length;
    const cols = Math.ceil(Math.sqrt(numNodes));
    const rows = Math.ceil(numNodes / cols);

    const cellWidth = (width - margin * 2) / cols;
    const cellHeight = (height - margin * 2) / rows;

    // Generate staggered grid positions for nodes
    // Generate grid positions for nodes
    sortedNodeKeys.forEach((key, index) => {
        const row = Math.floor(index / cols); // Determine the row based on index
        const col = index % cols;            // Determine the column based on index
        const radius = rankSizes[nodes[key].rank] || 15;

        // Calculate x and y positions
        const x = margin + col * cellWidth;
        const y = margin + row * cellHeight;

        // Assign calculated position to node
        positions[key] = { x, y };
    });
    
    // Create house legend
    const houseLegendDiv = document.querySelector('.house-legend');
    Object.keys(houseColors).forEach(house => {
        const color = houseColors[house];
        const legendItem = document.createElement('div');
        legendItem.innerHTML = `<span style="background-color: ${color}; color: black">${house}</span>`;
        houseStates[house] = true;

        // Add click event listener for toggling visibility
        legendItem.addEventListener('click', () => {
            houseStates[house] = !houseStates[house];
            drawAll();
        });

        houseLegendDiv.appendChild(legendItem);
    });

    // Create element legend
    const elementLegendDiv = document.querySelector('.element-legend');
    Object.keys(elementColors).forEach(element => {
        const color = elementColors[element];
        const legendItem = document.createElement('div');
        legendItem.innerHTML = `<span style="background-color: ${color}; color: black">${element}</span>`;
        elementStates[element] = true;
        
        if (element == "emptiness") {
                  legendItem.innerHTML = `<span style="outline: 1px solid lightgray;background-color: ${color}; color: black">${element}</span>`;
        }

        // Add click event listener for toggling visibility
        legendItem.addEventListener('click', () => {
            elementStates[element] = !elementStates[element];
            drawAll();
        });

        elementLegendDiv.appendChild(legendItem);
    });

    let draggingNode = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function drawArrows() {
        Object.keys(nodes).forEach(key => {
            const node = nodes[key];
            const houseColor = houseColors[node.house];
            const radius = rankSizes[node.rank] || 15;
            if (node.doors && node.doors.length > 0 && houseStates[node.house]) {
                node.doors.forEach(door => {
                    const doorkey = door.toString().padStart(3, '0'); // Define doorkey here
                    if (positions[doorkey] && elementStates[nodes[doorkey].element] && elementStates[nodes[key].element]) {
                        const doorRadius = rankSizes[nodes[doorkey].rank] || 15;
                        drawArrow(positions[key].x, positions[key].y, positions[doorkey].x, positions[doorkey].y, houseColor, radius, doorRadius);
                    }
                });
            }
        });
    }

    function drawArrow(x1, y1, x2, y2, houseColor, startRadius, endRadius) {
        const headLength = 10;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

        // Adjust start and end points based on node radius
        const adjustedStartX = x1 + (startRadius / Math.sqrt(dx * dx + dy * dy)) * dx;
        const adjustedStartY = y1 + (startRadius / Math.sqrt(dx * dx + dy * dy)) * dy;
        const adjustedEndX = x2 - (endRadius / Math.sqrt(dx * dx + dy * dy)) * dx;
        const adjustedEndY = y2 - (endRadius / Math.sqrt(dx * dx + dy * dy)) * dy;

        ctx.beginPath();
        ctx.moveTo(adjustedStartX, adjustedStartY);
        ctx.lineTo(adjustedEndX, adjustedEndY);
        ctx.strokeStyle = houseColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(adjustedEndX, adjustedEndY);
        ctx.lineTo(adjustedEndX - headLength * Math.cos(angle - Math.PI / 6), adjustedEndY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(adjustedEndX - headLength * Math.cos(angle + Math.PI / 6), adjustedEndY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(adjustedEndX, adjustedEndY);
        ctx.fillStyle = houseColor;
        ctx.fill();
    }


    function drawSolutionPath() {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 10]); // Create dotted line effect

        ctx.strokeStyle = 'black'; // Color of the solution path

        for (let i = 0; i < solutionPath.length - 1; i++) {
            const start = positions[solutionPath[i]];
            const end = positions[solutionPath[i + 1]];

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
        const { x, y } = positions[key];
        const node = nodes[key];
        const radius = rankSizes[node.rank] || 15;
        const color = houseColors[node.house] || 'gray';
        const elementColor = elementColors[node.element] || 'white';

        if (elementStates[node.element]) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, radius * 0.8, 0, 2 * Math.PI);
            ctx.fillStyle = elementColor;
            ctx.fill();

            // Draw numbers in 'dais' and 'seat' nodes
            if (node.rank === 'dais' || node.rank === 'seat' || node.rank === 'step') {
                drawNumber(x, y, paddedIdToNumber(key));
            }
        }
    });
    
    if (showSolutionPath) {
        drawSolutionPath();
    }
}

    
    function drawNumber(x, y, number) {
        ctx.font = `$14px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(number, x, y);
    }

    function updateLayout() {
        if (layoutType == "ring") {
            // Implement the ring layout logic here
            const numNodes = Object.keys(nodes).length;
            const angleStep = 2 * Math.PI / numNodes;
            Object.keys(nodes).forEach((key, index) => {
                const angle = angleStep * index;
                const radius = 280;
                const x = canvas.width / 2 + radius * Math.cos(angle);
                const y = canvas.height / 2 + radius * Math.sin(angle);
                positions[key] = { x, y };
            });
        } else if (layoutType == "spiral") {
            // Implement the spiral layout logic here
            const numNodes = Object.keys(nodes).length;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxRadius = Math.min(centerX, centerY) - 50; // To ensure nodes stay within canvas bounds
            const angleStep = 0.1; // Determines the tightness of the spiral
            const radiusStep = maxRadius / numNodes; // Determines the spacing of the spiral

            Object.keys(nodes).forEach((key, index) => {
                const angle = angleStep * index;
                const radius = radiusStep * index;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                positions[key] = { x, y };
            });
        } else if (layoutType == "hexagram") {
            const numNodes = Object.keys(nodes).length;
            const hexagramWidth = 80; // Width of each hexagram rectangle (reduced)
            const hexagramHeight = 120; // Height of each hexagram rectangle (reduced)
            const margin = 30; // Margin between hexagrams (reduced)

            // Function to get the hexagram for a room ID
            function getHexagram(roomId) {
                // Compute hexagram index based on room ID
                // For simplicity, assuming hexagrams are directly mapped to room IDs
                // Replace with actual calculation or mapping if needed
                return roomId % 64; // Example mapping
            }

            // Group nodes by hexagram
            const hexagramGroups = {};
            Object.keys(nodes).forEach((key) => {
                const hexagram = getHexagram(parseInt(key, 10));
                if (!hexagramGroups[hexagram]) {
                    hexagramGroups[hexagram] = [];
                }
                hexagramGroups[hexagram].push(key);
            });

            let xOffset = margin;
            let yOffset = margin + 50;

            Object.keys(hexagramGroups).forEach((hexagram, index) => {
                let extra_offset = 20;
                if (index % 2 == 0) extra_offset = -20;
                const group = hexagramGroups[hexagram];
                group.forEach((key, index) => {
                    const col = index % 6; // Assuming 6 columns per hexagram
                    const row = Math.floor(index / 6); // Rows in each hexagram
                    const x = xOffset + col * (hexagramWidth / 6);
                    const y = yOffset + row * (hexagramHeight / 6) + extra_offset;
                    positions[key] = { x, y };
                });
                xOffset += hexagramWidth + margin; // Move to next column for the next hexagram
                if (xOffset + hexagramWidth > canvas.width) {
                    xOffset = margin; // Reset xOffset and move down to the next row
                    yOffset += hexagramHeight + margin;
                }
            });
        } else {
            // Grid layout
            const numNodes = Object.keys(nodes).length;
            const cols = Math.ceil(Math.sqrt(numNodes));
            const rows = Math.ceil(numNodes / cols);

            const cellWidth = (canvas.width - margin * 2) / cols;
            const cellHeight = (canvas.height - margin * 2) / rows;
            Object.keys(nodes).forEach((key) => {
              const paddedKey = key.padStart(3, '0'); // Ensure key is padded to 3 digits
              const index = paddedKey; // Use the padded key as index for calculation

              const row = Math.floor(paddedKey / cols);
              const col = paddedKey % cols;
              const radius = rankSizes[nodes[key].rank] || 15;
              const x = margin + col * cellWidth + (row % 2 === 0 ? 0 : cellWidth / 2);
              const y = margin + row * cellHeight + cellHeight / 2;
              
              positions[key] = { x, y };
          });
        }

        drawAll();
    }

    // Add drag-related event listeners
    canvas.addEventListener('mousedown', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Check if a node is clicked
        Object.keys(positions).forEach(key => {
            const { x, y } = positions[key];
            const radius = rankSizes[nodes[key].rank] || 15;
            const dx = mouseX - x;
            const dy = mouseY - y;
            if (Math.sqrt(dx * dx + dy * dy) < radius) {
                draggingNode = key;
                dragOffsetX = mouseX - x;
                dragOffsetY = mouseY - y;
            }
        });
    });
    
    function playNoteForNode(nodeId) {
        if (audio_cd) return;
        if (!elementStates[nodes[nodeId].element]) return;
        audio_cd = true;
        setTimeout(() => {
          audio_cd = false;
        },audio_cooldown);
        const noteIndex = parseInt(nodeId, 10) % notes.length; // Map nodeId to note index
        notes[noteIndex].pause(); // Pause the note
        notes[noteIndex].currentTime = 0; // Reset playback position
        notes[noteIndex].play(); // Play the corresponding note
        lastnode = nodeId; // Update lastNodeId
    }

    canvas.addEventListener('mousemove', (event) => {
        if (draggingNode) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Update node position based on mouse movement
            positions[draggingNode].x = mouseX - dragOffsetX;
            positions[draggingNode].y = mouseY - dragOffsetY;

            drawAll();
        } else {
            // Show node info on hover
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            let highlightedNode = null;
            let highlightedNodeId = null;

            Object.keys(positions).forEach(key => {
                const { x, y } = positions[key];
                const radius = rankSizes[nodes[key].rank] || 15;
                const dx = mouseX - x;
                const dy = mouseY - y;
                if (Math.sqrt(dx * dx + dy * dy) < radius) {
                    highlightedNode = nodes[key];
                    highlightedNodeId = key;
                }
            });
            
            if (highlightedNodeId != lastnode && highlightedNodeId != null) {
                lastnode = highlightedNodeId;
                playNoteForNode(lastnode);
            }
                
            if (highlightedNodeId && elementStates[nodes[highlightedNodeId].element]) {
                infoDiv.innerHTML = `<strong><br>Room id:</strong> ${highlightedNodeId}<strong></strong><pre>${JSON.stringify(highlightedNode, null, 2)}</pre>`;
            } else {
                infoDiv.innerHTML = '';
                lastnode = -1;
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        draggingNode = null;
    });

    function toggleLayout() {
        if (layoutType == "grid") layoutType = "ring";
        else if (layoutType == "ring") layoutType = "spiral";
        else if (layoutType == "spiral") layoutType = "hexagram";
        else if (layoutType == "hexagram") layoutType = "grid";
        updateLayout();
    }

    function toggleSolutionPath() {
        showSolutionPath = !showSolutionPath;
        drawAll();
    }

    // Ensure elements exist before adding event listeners
    const toggleLayoutButton = document.getElementById('toggleLayout');
    const toggleSolutionPathButton = document.getElementById('toggleSolutionPath');

    if (toggleLayoutButton) {
        toggleLayoutButton.addEventListener('click', toggleLayout);
    }

    if (toggleSolutionPathButton) {
        toggleSolutionPathButton.addEventListener('click', toggleSolutionPath);
    }

    // Initial drawing
    updateLayout();
    drawAll();
});
