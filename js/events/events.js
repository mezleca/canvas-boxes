// DOM events, setup render main loop

export const keys = new Set();
export const screen = { w: 1920, h: 1080 };
export const cursor = { x: 0, y: 0 };

window.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY; 
});

window.addEventListener("mousedown", () => {
    keys.add("m1");
});

window.addEventListener("mouseup", () => {
    keys.delete("m1");
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