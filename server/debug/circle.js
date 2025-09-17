const CAPACITY = 3;
let buffer = new Array(CAPACITY);
let head = 0, size = 0;
function push(value) {
    const idx = (head +size) % CAPACITY;
}