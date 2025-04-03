// convert from int to 9-digit binary witth with zeroes
function to9BitBinary(num) {
    if (num < 0 || num > 511) {
        throw new Error('Number must be between 0 and 511');
    }
    return (num & 0x1FF).toString(2).padStart(9, '0');
}

// convert from 9-digit padded binary to int
function paddedIdToNumber(id) {
    return parseInt(id, 10); 
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

// approximate atan2
function fastAtan2(y, x) {
    const abs_y = Math.abs(y) + 1e-10; // Prevent division by zero
    let angle;

    const pi_4th = Math.PI/4;
    if (x >= 0) {
        const r = (x - abs_y) / (x + abs_y);
        angle = pi_4th - pi_4th * r;
    } else {
        const r = (x + abs_y) / (abs_y - x);
        angle = 3 * pi_4th - pi_4th * r;
    }

    return y < 0 ? -angle : angle;
}

// play sound
function playSound(snd) {
    try {
        if (snd.play) {
            snd.play().catch(e => {
            });
        } else {
            throw new Error('Audio element does not support play!');
        }
    } catch (e) {
        console.error('An error occurred while trying to play audio:', e);
    }
}

// helper function for visually representing the state of legend elements
html_snippets = {
    legend_element: [[`<span style="background-color: `],
        [`; color: `], [`; border: `], [`"><b>`], [`</b></span>`]]
};
function getSnippet(key, bg, txt, border, el) {  
    let snip = "";
    snip += html_snippets[key][0] + bg;
    snip += html_snippets[key][1] + txt;
    snip += html_snippets[key][2] + border;
    snip += html_snippets[key][3] + el;
    snip += html_snippets[key][4];
    return snip;
}

// console command to show node data
function printAllPoems() {
    Object.keys(smData).forEach(key => {
        console.log(smData[key].description);
    });
};