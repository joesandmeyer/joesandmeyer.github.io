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
    let targetPositions = {}; // Target positions after layout update
    let animationStartTimes = {}; // When each node starts moving
    let animationDuration = 500; // Duration of the animation in milliseconds
    const staggerTime = 10; // Delay between each node's movement start in milliseconds

    const infoDiv = document.getElementById('info');
    let layoutType = "grid";
    let showSolutionPath = true;
    
    var audio_cd = false; // audio cooldown to prevent speaker damage
    const audio_cooldown = 90;
    
    const frameRateCap = 60; // 30 FPS
    
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
            if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
                return; // Skip drawing nodes outside the canvas
            }

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
        const now = performance.now(); // Get the current time
        let animationOffset = 0; //Allows staggering to account for invisible nodes;

        // Calculate target positions based on the chosen layout
        if (layoutType == "ring") {
            const numNodes = Object.keys(nodes).length;
            const angleStep = 2 * Math.PI / numNodes;
            Object.keys(nodes).forEach((key, index) => {
              
                //check node visibility
                if (!elementStates[nodes[key].element]) {
                    
                }
              
                const angle = angleStep * index;
                const radius = 280;
                const x = canvas.width / 2 + radius * Math.cos(angle);
                const y = canvas.height / 2 + radius * Math.sin(angle);
                targetPositions[key] = { x, y };
                animationStartTimes[key] = now + index * staggerTime; // Stagger start time
            });
        } else if (layoutType == "spiral") {
            const numNodes = Object.keys(nodes).length;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxRadius = Math.min(centerX, centerY) - 50;
            const angleStep = 0.1;
            const radiusStep = maxRadius / numNodes;

            let i = 511;
            Object.keys(nodes).forEach((key) => {
                if (key > 99) return;
                const angle = angleStep * i;
                const radius = radiusStep * i;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                targetPositions[key] = { x, y };
                animationStartTimes[key] = now + i * staggerTime;
                i--;
            });
            Object.keys(nodes).forEach((key) => {
                if (key < 100) return;
                const angle = angleStep * i;
                const radius = radiusStep * i;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                targetPositions[key] = { x, y };
                animationStartTimes[key] = now + i * staggerTime;
                i--;
            });
        } else if (layoutType == "hexagram") {
            const hexagramWidth = 80;
            const hexagramHeight = 120;
            const margin = 30;

            function getHexagram(roomId) {
                return roomId % 64;
            }

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

            Object.keys(hexagramGroups).forEach((hexagram, groupIndex) => {
                let extra_offset = 20;
                if (groupIndex % 2 == 0) extra_offset = -20;
                const group = hexagramGroups[hexagram];
                group.forEach((key, index) => {
                    const col = index % 6;
                    const row = Math.floor(index / 6);
                    const x = xOffset + col * (hexagramWidth / 6);
                    const y = yOffset + row * (hexagramHeight / 6) + extra_offset;
                    targetPositions[key] = { x, y };
                    animationStartTimes[key] = now + (groupIndex * group.length + index) * staggerTime;
                });
                xOffset += hexagramWidth + margin;
                if (xOffset + hexagramWidth > canvas.width) {
                    xOffset = margin;
                    yOffset += hexagramHeight + margin;
                }
            });
        } else {
            const numNodes = Object.keys(nodes).length;
            const cols = Math.ceil(Math.sqrt(numNodes));
            const rows = Math.ceil(numNodes / cols);

            const cellWidth = (canvas.width - margin * 2) / cols;
            const cellHeight = (canvas.height - margin * 2) / rows;

            Object.keys(nodes).forEach((key, index) => {
                const paddedKey = key.padStart(3, '0');
                const n = parseInt(paddedKey, 10);

                const row = Math.floor(n / cols);
                const col = n % cols;

                const x = margin + col * cellWidth + (row % 2 === 0 ? 0 : cellWidth / 2);
                const y = margin + row * cellHeight + cellHeight / 2;
                targetPositions[key] = { x, y };
                animationStartTimes[key] = now + index * staggerTime;
            });
        }

        animateNodes();
    }

    let lastFrameTime = 0;
    const nodeKeys = Object.keys(nodes); // Cache keys for performance

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    function animateNodes(timestamp) {
        let nodeAnimationComplete = {};
        
        if (timestamp - lastFrameTime < 1000 / frameRateCap) {
            requestAnimationFrame(animateNodes);
            return;
        }
        lastFrameTime = timestamp;

        const now = performance.now();
        let allNodesReached = true;

        for (let i = 0; i < nodeKeys.length; i++) {
            const key = nodeKeys[i];
            if (nodeAnimationComplete[key]) continue;
            
            const startX = positions[key].x;
            const startY = positions[key].y;
            const targetX = targetPositions[key].x;
            const targetY = targetPositions[key].y;
            const startTime = animationStartTimes[key];

            if (now < startTime) {
                allNodesReached = false;
                continue;
            }

            const elapsedTime = Math.min(now - startTime, animationDuration);
            
            if (elapsedTime >= animationDuration) {
                nodeAnimationComplete[key] = true;
                continue;
            }
            const t = elapsedTime / animationDuration;
            
            positions[key].x = lerp(startX, targetX, t);
            positions[key].y = lerp(startY, targetY, t);
            if (t < 1) {
                allNodesReached = false;
            }
        }

        drawAll();

        if (!allNodesReached) {
            requestAnimationFrame(animateNodes);
        }
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
                // The text to be displayed with line breaks
                // The text to be displayed with line breaks
                const poem = highlightedNode.description;

                // Create a copy of highlightedNode excluding the 'description' field
                const { description, ...highlightedNodeWithoutDescription } = highlightedNode;

                // Format JSON as a string and replace new lines for HTML
                const formattedJson = JSON.stringify(highlightedNodeWithoutDescription, null, 2)
                    .replace(/\n/g, '<br>')
                    .replace(/ /g, '&nbsp;');

                // Set HTML content including formatted JSON and the text
                infoDiv.innerHTML = `
                    <strong>Room id:</strong> ${highlightedNodeId}
                    <pre style="white-space: pre-wrap; margin-top: -5px;">${poem}</pre>
                    <hr>
                    <pre style="margin-bottom: -5px;">${formattedJson}</pre>
                `;

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
