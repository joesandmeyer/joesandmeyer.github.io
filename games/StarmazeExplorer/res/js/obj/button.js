const Button = {};

///////
// functions
/////

function nextLayout() {
    layout_index = (layout_index + 1) % layout_list.length;
    if (layout_list[layout_index] != "hexagram") disableHexagramSymbols();
    updateLayout(layout_index);
}

function toggleLayout() {
    if (!page_muted) playSound(tap_noise); //play "tap" sound
    nextLayout();
}

const auto_anim_switch = document.getElementById('auto');
// Add an event listener for the 'change' event
auto_anim_switch.addEventListener('change', function() {
    if (!page_muted) playSound(tap_noise); //play "tap" sound
    if (this.checked) {
        window.auto_animate = true;
        if (!window.animating) nextLayout();
        return;
    }
    window.auto_animate = false;
});

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

const input_element = document.getElementById('numberInput');
input_element.old_val = input_element.value;
input_element.addEventListener('input', (event) => {
  let current_val = event.target.value;
  const validPattern = /^(\d+(\.5)?|\.\d)$/;
  if (validPattern.test(current_val)) {
    current_val = Number(current_val);
    if (current_val > 10) {
      current_val = 10;
    }
    if (current_val < 0.5) {
      current_val = 0.5;
    }
    window.stagger_time = 10 - current_val;
    input_element.value = current_val;
    input_element.old_val = current_val;
  } else {
    event.target.value = input_element.old_val;
  }
});

// ensure elements exist before adding event listeners
const toggle_layout_btn = document.getElementById('toggleLayout');
const toggle_solution_btn = document.getElementById('toggleSolutionPath');
const toggle_mute_btn = document.getElementById('muteUnmute');
if (toggle_layout_btn)
    toggle_layout_btn.addEventListener('click', toggleLayout);
if (toggle_solution_btn)
    toggle_solution_btn.addEventListener('click', toggleSolutionPath);
if (toggle_mute_btn)
    toggle_mute_btn.addEventListener('click', toggleMuteUnmute);