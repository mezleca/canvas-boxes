export const keys = new Set();
export const screen = { w: 1920, h: 1080 };
export const cursor = { x: 0, y: 0, delta_y: 0, delta_x: 0 };

const MBUTTON_NAMES = {
    0: "mouse1",
    1: "mouse3",
    2: "mouse2"
};

window.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY; 
});

window.addEventListener("wheel", (e) => {
    cursor.delta_y = e.deltaY;
    cursor.delta_x = e.deltaX;
});

window.addEventListener("mousedown", (e) => {
    const name = MBUTTON_NAMES[e.button];
    if (name) keys.add(name);
});

window.addEventListener("mouseup", (e) => {
    const name = MBUTTON_NAMES[e.button];
    if (name) keys.delete(name);
});

window.addEventListener("blur", () => {
    keys.clear();
});

export const update_viewport = (canvas) => {
    const screen_w = window.innerWidth;
    const screen_h = window.innerHeight;
    
    if (screen.w == screen_w && screen.h == screen_h) {
        return;
    }

    screen.w = screen_w;
    screen.h = screen_h;

    canvas.width = screen_w;
    canvas.height = screen_h;
};