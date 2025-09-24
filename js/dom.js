export const keys = new Set();
export const screen = { w: 1920, h: 1080 };
export const cursor = { x: 0, y: 0, delta_y: 0, delta_x: 0 };

const MBUTTON_NAMES = {
    0: "mouse1",
    1: "mouse3",
    2: "mouse2"
};

const registered_uis = new Set();

export const register_ui = (ui) => {
    registered_uis.add(ui);
};

export const unregister_ui = (ui) => {
    registered_uis.delete(ui);
};

const update_uis = (event_name, data) => {
    for (const ui of registered_uis) {
        if (ui[event_name]) {
            ui[event_name](data);
        }
    }
};

window.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    
    update_uis("on_mouse_move", { x: cursor.x, y: cursor.y });
});

window.addEventListener("wheel", (e) => {
    cursor.delta_y = e.deltaY;
    cursor.delta_x = e.deltaX;
    
    update_uis("on_wheel", { delta_x: cursor.delta_x, delta_y: cursor.delta_y });
});

window.addEventListener("mousedown", (e) => {
    const name = MBUTTON_NAMES[e.button];
    if (name) {
        keys.add(name);
        update_uis("on_key_press", { key: name, type: "mouse" });
    }
});

window.addEventListener("mouseup", (e) => {
    const name = MBUTTON_NAMES[e.button];
    if (name) {
        keys.delete(name);
        update_uis("on_key_release", { key: name, type: "mouse" });
    }
});

window.addEventListener("keydown", (e) => {
    if (!keys.has(e.code)) {
        keys.add(e.code);
        update_uis("on_key_press", { key: e.code, type: "keyboard" });
    }
});

window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
    update_uis("on_key_release", { key: e.code, type: "keyboard" });
});

window.addEventListener("resize", () => {
    update_uis("on_resize", { width: window.innerWidth, height: window.innerHeight });
});

window.addEventListener("blur", () => {
    keys.clear();
    update_uis("on_blur", {});
});