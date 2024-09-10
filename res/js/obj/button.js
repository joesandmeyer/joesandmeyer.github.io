const Button = {};

///////
// functions
/////

function toggleLayout() {
    if (!page_muted) playSound(tap_noise); //play "tap" sound
    layout_index = (layout_index + 1) % layout_list.length;
    layout_type = layout_list[layout_index];
    if (layout_type != "hexagram") disableHexagramSymbols();
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
if (toggle_layout_btn)
    toggle_layout_btn.addEventListener('click', toggleLayout);
if (toggle_solution_btn)
    toggle_solution_btn.addEventListener('click', toggleSolutionPath);
if (toggle_mute_btn)
    toggle_mute_btn.addEventListener('click', toggleMuteUnmute);