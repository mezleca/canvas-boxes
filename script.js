/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/*  TODO LIST
    - [x] layout/container
    - [ ] nested layouts
    - [x] render items on default layout mode
    - [ ] render items on flex layout mode
    - [ ] mouseup / mousedown events
    - [x] mouseover / mouseleave events
    - [ ] click event
    - [x] padding for container / items
    - [x] box item
    - [ ] spacer item
    - [ ] text item
    - [ ] checkbox item
*/

let lastTime, deltaTime;

const screen = { w: 1920, h: 1080 };
const cursor = { x: 0, y: 0 };

const PADDING_POSITIONS = {
    "LEFT": 0,
    "TOP": 1,
    "RIGHT": 2,
    "BOTTOM": 3
};

const render_box = (x, y, w, h, color, border_size = 1) => {
    const old_style = ctx.strokeStyle;
    const old_line_width = ctx.lineWidth;

    if (color) {
        ctx.strokeStyle = color;
    }

    ctx.lineWidth = border_size;

    ctx.beginPath();
    ctx.moveTo(x, y);

    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y);

    // render 
    ctx.stroke();

    // reset
    ctx.strokeStyle = old_style;
    ctx.lineWidth = old_line_width;
};

class StyleData {
    constructor() {
        this.border_size = "1";
        this.border_color = "rgb(120, 120, 120)";
        this.padding = [0, 0, 0, 0];
    }

    set_border(size, color) {
        this.border_size = size;
        this.border_color = color;
    }

    set_padding(...values) {
        if (values.length == 1) {
            for (let i = 0; i < 4; i++) {
                this.padding[i] = values[0];
            }
        }

        for (let i = 0; i < values.length; i++) {
            this.padding[i] = values[i];
        }
    }

    set_padding_left(value) {
        this.padding[PADDING_POSITIONS.LEFT] = value;
    }

    set_padding_right(value) {
        this.padding[PADDING_POSITIONS.RIGHT] = value;
    }

    set_padding_top(value) {
        this.padding[PADDING_POSITIONS.TOP] = value;
    }

    set_padding_bottom(value) {
        this.padding[PADDING_POSITIONS.BOTTOM] = value;
    }
};

class Item extends StyleData {
    constructor() {
        super();
        this.hovering = false;
        this.id = crypto.randomUUID();
        this.events = new Map();
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
    }

    set_id(id) {
        this.id = id;
    }

    update_pos(x, y) {
        if (x != undefined) this.x = x;
        if (y != undefined) this.y = y;
    }

    render() {
        throw new Error("not implemented yet");
    }

    is_hovered() {
        const x1 = this.x;
        const x2 = this.x + this.w;
        const y1 = this.y;
        const y2 = this.y + this.h;
        return cursor.x > x1 && cursor.x < x2 && cursor.y > y1 && cursor.y < y2;
    }

    update() {
        const is_hovered = this.is_hovered();

        // update hovered state
        if (is_hovered && !this.hovering) {
            this.hovering = true;
        
            // callback if possible
            const callback = this.events.get("mouseover");
            if (callback) callback(this);
        }
        
        if (!is_hovered && this.hovering) {
            this.hovering = false;

            // callback if possible
            const callback = this.events.get("mouseleave");
            if (callback) callback(this);
        }
    }

    on(event_name, callback) {
        this.events.set(event_name, callback);
    }
};

class Layout extends StyleData {
    constructor(w, h) {
        super();
        this.x = 0;
        this.y = 0;
        this.w = w || 0;
        this.h = h || 0;
        this.type = "default";
        this.items = [];
    }

    add(widget) {
        if (!widget instanceof Item) {
            throw new Error("widget needs to be an instance of Item");
        }

        this.items.push(widget);
    }

    render() {
        // first render the items 
        switch (this.type) {
            case "default":
                this.render_default();
                break;
            case "flex":
                break;
        }

        // now render the layout border
        render_box(this.x, this.y, this.w, this.h, this.border_color, this.border_size);
    }

    render_default() {
        // layout padding
        const l_pr = this.padding[PADDING_POSITIONS.RIGHT];
        const l_pl = this.padding[PADDING_POSITIONS.LEFT];
        const l_pt = this.padding[PADDING_POSITIONS.TOP];
        const l_pb = this.padding[PADDING_POSITIONS.BOTTOM];

        let acc = l_pl;
        let row = 0;

        // first render the items
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];

            // item padding
            const i_pr = item.padding[PADDING_POSITIONS.RIGHT];
            const i_pl = item.padding[PADDING_POSITIONS.LEFT];
            const i_pt = item.padding[PADDING_POSITIONS.TOP];
            const i_pb = item.padding[PADDING_POSITIONS.BOTTOM];

            let target_x = i_pl + acc;
            
            // prevent x overflow (x_pos + width + layout_left_padding)
            if (target_x + item.w + l_pr > this.w) {
                row++;
                acc = l_pl;    

                // recalculate x pos
                target_x = i_pl + acc;
            }

            let target_y = l_pt + row * (item.h + i_pt + i_pb);

            // prevent y overflow (not ideal)
            if (target_y + l_pb > this.h) {
                break;
            }

            item.update_pos(target_x, target_y);
            item.render();
            item.update();

            // add extra padding if necessary
            acc += i_pl + item.w + i_pr;
        }
    }

    update_size(w, h) {
        if (w != undefined && w <= screen.w) this.w = w;
        if (h != undefined && h <= screen.h) this.h = h;
    }
};

class Box extends Item {
    constructor(w, h) {
        super();
        this.w = w ?? 80;
        this.h = h ?? 80;
    }

    render() {
        render_box(this.x, this.y, this.w, this.h, this.border_color);
    }
};

class Text extends Item {

};

class Button extends Item {

};

const update_viewport = () => {
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

const layout = new Layout(800, 600);

for (let i = 0; i < 20; i++) {
    const box = new Box();
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    box.set_border(5, `rgb(${r}, ${g}, ${b})`);
    box.set_padding_bottom(10);
    box.set_padding_right(10);
    box.set_id(i);
    box.on("mouseover", (data) => {
        console.log("hovering", data.id);
    });
    box.on("mouseleave", (data) => {
        console.log("leaving", data.id);
    });
    layout.add(box);
}

layout.set_padding(10);
layout.set_border(3, "rgb(30, 150, 200)");

const update = (currentTime) => {
    if (!lastTime) {
        lastTime = currentTime;
    }

    deltaTime = currentTime - lastTime;

    // ensure screen pos is right
    update_viewport();

    layout.render();

    // next frame :D
    requestAnimationFrame(update);
};

// start
requestAnimationFrame(update);

window.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY; 
});