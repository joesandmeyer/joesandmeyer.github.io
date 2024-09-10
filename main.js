function startVisualizer() {
    updateLayout(); // located in layouts.js
    drawAll(); // located in node.js
}

// listens for custom event 'loadComplete' (located in load_resources.js)
document.addEventListener('DOMContentLoaded', (event) => {
    document.addEventListener('loadComplete', (event) => {
        startVisualizer();
    });
});