const layout_list = ["grid", "doublespiral", "ring", "spiral", "hexagram",
                     "text"];
let updateLayout;
let layout_index = 0;

function startVisualizer() {
    updateLayout(layout_index); // located in layouts.js
    drawAll(); // located in node.js
}

// listens for custom event 'loadComplete' (located in load_resources.js)
document.addEventListener('DOMContentLoaded', (event) => {
    document.addEventListener('loadComplete', (event) => {
        startVisualizer();
    });
});