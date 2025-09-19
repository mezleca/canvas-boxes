import { StyleData, PADDING_POSITIONS } from "./style.js";
import { cursor, update_viewport, keys } from "../events/events.js";
import { render_box } from "./renderer.js";

export class Node extends StyleData {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.events = new Map();
        this.id = crypto.randomUUID();
        this.children = [];
        this.parent = null;
        this.visible = true;
        this.resizable = true;
        this.holding = false;
        this.text = "";
    }

    add(child) {
        child.parent = this;
        this.children.push(child);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render(ctx, dt) {
        if (!this.visible) return;

        this.draw(ctx);

        // always render children (this fixes nested layouts)
        for (const child of this.children) {
            child.render(ctx, dt);
        }
    }

    draw(ctx) { }

    update_pos(x, y) {
        if (x != undefined) this.x = x;
        if (y != undefined) this.y = y;
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
            const callback = this.events.get("mouseover");
            if (callback) callback(this);
        }
        
        // send mouse leave
        if (!is_hovered && this.hovering) {
            this.hovering = false;
            const callback = this.events.get("mouseleave");
            if (callback) callback(this);
        }

        // send mouse down
        if (is_hovered && !this.holding && keys.has("m1")) {
            this.holding = true;
            const callback = this.events.get("mousedown");
            if (callback) callback(this);
        }

        // cancel click
        if (!is_hovered && this.holding && !keys.has("m1")) {
            this.holding = false;
            const callback = this.events.get("mouseup");
            if (callback) callback(this);
        }

        // send both click and mouse up
        if (is_hovered && this.holding && !keys.has("m1")) {
            this.holding = false;

            const mu_callback = this.events.get("mouseup");
            if (mu_callback) mu_callback(this);

            const cl_callback = this.events.get("click");
            if (cl_callback) cl_callback(this);
        }
    }

    on(event_name, callback) {
        this.events.set(event_name, callback);
    }

    set_id(id) {
        this.id = id;
    }

    set_visible(value) {
        this.visible = value;
    }

    set_text(value) {
        this.text = value;
    }

    set_resizable(value) {
        this.resizable = value;
    }
};

export class Layout extends Node {
    constructor(w, h) {
        super();
        this.type = "default";
        this.visible = true;
        this.w = w;
        this.h = h;
    }

    set_type(type) {
        this.type = type;
    }

    remove(id) {
        this.children = this.children.filter((c) => c.id != id);
    }

    draw(ctx) {
        // render background/border first
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.background_color, this.border_size, this.border_radius);

        switch (this.type) {
            case "free":
                this.layout_free();
                break;
            case "default":
                this.layout_default();
                break;
        }
    }

    layout_free() {
        for (const child of this.children) {
            // check events
            if (child.visible) {
                child.update();
            }
        }
    }

    layout_default() {
        // layout padding
        const l_pr = this.padding[PADDING_POSITIONS.RIGHT] || 0;
        const l_pl = this.padding[PADDING_POSITIONS.LEFT] || 0;
        const l_pt = this.padding[PADDING_POSITIONS.TOP] || 0;
        const l_pb = this.padding[PADDING_POSITIONS.BOTTOM] || 0;

        let acc = l_pl;
        let row = 0;
        let current_row_height = 0;
        let total_rows_height = 0;

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];

            // item padding
            const i_pr = child.padding[PADDING_POSITIONS.RIGHT] || 0;
            const i_pl = child.padding[PADDING_POSITIONS.LEFT] || 0;
            const i_pt = child.padding[PADDING_POSITIONS.TOP] || 0;
            const i_pb = child.padding[PADDING_POSITIONS.BOTTOM] || 0;

            const item_total_width = i_pl + child.w + i_pr + this.spacing;
            const full_x = acc + item_total_width;
            const available_width = this.w - l_pr;

            // check if fits in current row
            if (full_x > available_width) {
                // check if we can resize the window
                const new_width = available_width + (full_x - available_width);
                
                // if we cant do shit just go to the next row
                if (!this.resizable || !new_width || new_width > screen.width) {
                    total_rows_height += current_row_height;
                    row++;
                    acc = l_pl;
                    current_row_height = 0;
                } else {
                    this.w = new_width;
                }
            }

            const target_x = this.x + acc + i_pl;
            const target_y = this.y + l_pt + total_rows_height + i_pt;

            // current_y + child height + child bottom padding
            const full_y = target_y + child.h + i_pb;
            const available_height = this.y + this.h - l_pb;

            // check y overflow
            if (full_y > available_height) {
                // check if we can resize the window
                const new_height = available_height + (full_y - available_height);

                if (!this.resizable || !new_height || new_height > screen.height) {
                    child.set_visible(false);
                    // update accumulator
                    acc += item_total_width;
                    continue;
                }

                this.h = new_height;
            }

            // update position
            child.set_visible(true);
            child.update_pos(target_x, target_y);

            // check for events
            child.update();
            
            // track max height for current row
            current_row_height = Math.max(current_row_height, child.h + i_pt + i_pb);

            // update accumulator
            acc += item_total_width;
        }
    }
};

export class UI {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
        if (!canvas) {
            throw new Error("missing canvas element");
        }

        this.canvas = canvas;
        this.delta_time = 0;
        this.last_time = 0;
        this.fps = 0;
        this.last_fps_update = 0;
        this.frame_count = 0;
        this.ctx = canvas.getContext("2d");
        this.root = new Node();
    }

    add(node) {
        this.root.add(node);
    }

    render() {
        // update viewport
        update_viewport(this.canvas);

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.root.render(this.ctx, this.delta_time);
    }

    // called on loop
    update(current_time) {
        this.delta_time = (current_time - this.last_time) / 1000;
        this.last_time = current_time;

        // skip if delta time is too high
        if (this.delta_time > 0.1) {
            return;
        }

        this.frame_count++;

        if (current_time - this.last_fps_update >= 1000) {
            this.fps = Math.round(this.frame_count * 1000 / (current_time - this.last_fps_update));
            this.frame_count = 0;
            this.last_fps_update = current_time;
        }
    }
};