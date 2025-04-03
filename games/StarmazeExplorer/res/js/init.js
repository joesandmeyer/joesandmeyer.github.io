//declare vars

const body = document.body;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const width = window.innerWidth - 150;
const height = window.innerHeight - 250;
const nodes = smData; //loaded from json file
let positions = {};
let hex_positions = {}; //hexagram symbol positions
window.target_positions = {}; // Node destination position after layout update
window.animation_start_times = {}; // When each node starts moving
window.anim_duration = 500; // Duration of the animation in ms
window.stagger_time = 6; // Delay between each node's movement start in ms
window.auto_animate = false;
window.animating = false;
const info_div = document.getElementById('info');
let show_solution_path = true;
let canvas_awake = false; // Used to hide references div
let show_hexagram_symbols = false;
let page_muted = true;
var audio_cd = false; // audio cooldown to prevent speaker damage
const audio_cooldown = 90;
let mousedown = false;
const framerate_cap = 60; // fps
let dragging_node = null;
let lastnode = -1; //for audio on hover
let drag_offset_x = 0;
let drag_offset_y = 0;
const house_states = {};   // Initialize house_states 
const element_states = {};//                          and element_states

// init collections

const notes = [
    new Audio('res/audio/A.ogg'),
    new Audio('res/audio/B.ogg'),
    new Audio('res/audio/C.ogg'),
    new Audio('res/audio/D.ogg'),
    new Audio('res/audio/E.ogg'),
    new Audio('res/audio/G.ogg')
];

const tap_noise = new Audio('res/audio/btn.ogg');

const rank_sizes = {
    'seat': 24,
    'dais': 18,
    'step': 14,
    'foundation': 10,
    'terminus': 6
};

let now = performance.now();

canvas.width = width;
canvas.height = height;