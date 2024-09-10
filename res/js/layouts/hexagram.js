function generateHexagramLayout(now) {
    let hexagram_width = 80;
    let hexagram_height = 120;
    let margin = 30;
    let stagger_time = window.stagger_time;

    function getHexagram(room_id) {
        return room_id % 64;
    }

    let hexagram_groups = {};
    Object.keys(nodes).forEach((key) => {
        let hexagram = getHexagram(parseInt(key, 10));
        if (!hexagram_groups[hexagram]) {
            hexagram_groups[hexagram] = [];
        }
        hexagram_groups[hexagram].push(key);
    });

    let x_offset = margin;
    let y_offset = margin + 50;

    Object.keys(hexagram_groups).forEach((hexagram, group_index) => {
        let n_pad = 20;
        if (group_index % 2 == 0) n_pad = -20;
        let group = hexagram_groups[hexagram];
        enableHexagramSymbol(x_offset, y_offset + n_pad, group_index);
        group.forEach((key, index) => {
            let col = index % 6;
            let row = Math.floor(index / 6);
            let x = x_offset + col * (hexagram_width / 6);
            let y = y_offset + row * 25 + n_pad;
            window.target_positions[key] = { x, y };
            let stag = (group_index * group.length + index);
            window.animation_start_times[key] = now + stag * stagger_time;

        });
        x_offset += hexagram_width + margin;
        if (x_offset + hexagram_width > canvas.width) {
            x_offset = margin;
            y_offset += hexagram_height + margin;
        }
    });
}
