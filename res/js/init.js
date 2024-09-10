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
    new Audio('res/audio/A.ogg'),
    new Audio('res/audio/B.ogg'),
    new Audio('res/audio/C.ogg'),
    new Audio('res/audio/D.ogg'),
    new Audio('res/audio/E.ogg'),
    new Audio('res/audio/G.ogg')
];

const tap_noise = new Audio('res/audio/btn.ogg');

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
        if (!page_muted) playSound(tap_noise); //play tap noise if page is not muted

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
        if (!page_muted) playSound(tap_noise); //play tap noise if page is not muted

      
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