const Legend = {};

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