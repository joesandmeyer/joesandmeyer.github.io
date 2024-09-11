const layouts_path = "./res/js/layouts/";
window.layout = {};

function loadLayout(k) {
    loadScript(layouts_path + layout_list[k] + ".js", (n) => {
        if (k >= layout_list.length - 1) {
            
            updateLayout = function (n) {
                layout_type = layout_list[n];
                //console.log("Layout type: " + layout_type);
                const now = performance.now(); // get the current time

                if (layout_type === "text") {
                    generateTextLayout(text_string, now, nodes);
                } else if (layout_type == "ring") {
                    generateRingLayout(now);
                } else if (layout_type == "spiral") {
                    generateSpiralLayout(now);
                } else if (layout_type == "doublespiral") {
                  generateDoubleSpiralLayout(now);
                } else if (layout_type == "hexagram") {
                    generateHexagramLayout(now);
                } else { //grid layout
                    generateGridLayout(now);
                }
                animateNodes();
            }
            
            const event = new CustomEvent('layoutsLoaded', { });
            document.dispatchEvent(event);
            
            return;
        }
        
        loadLayout(k + 1);
    });
}

loadLayout(0);