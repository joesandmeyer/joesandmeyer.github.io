const HexagramLabel = {};

function getHexagramLines(hex_id) {
    return Array(6).fill(0).map((_, i) => (hex_id & (1<<i))?1:0).reverse();
}

function enableHexagramSymbol(x, y, num) {
    hex_positions[num] = [x, y];
    show_hexagram_symbols = true;
}

function disableHexagramSymbols() {
    show_hexagram_symbols = false;
}