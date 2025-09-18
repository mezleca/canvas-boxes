import { StyleData, PADDING_POSITIONS } from "./style.js";
import { cursor } from "../events/events.js";
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
    }

    add(child) {
        child.parent = this;
        this.children.push(child);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render(ctx, dt) {
        if (!this.visible) return;

        this.draw(ctx);

        for (const child of this.children) {
            child.render(ctx);
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

    set_id(id) {
        this.id = id;
    }

    set_visible(value) {
        this.visible = value;
    }
};

export class Layout extends Node {
    constructor(w, h) {
        super();
        this.type = "default";
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
        switch (this.type) {
            case "free":
                this.draw_free(ctx);
                break;
            case "default":
                this.draw_default(ctx);
                break;
            case "flex":
                this.draw_flex(ctx);
                break;
        }
    }

    draw_free(ctx) {
        for (const child of this.children) {
            // check events
            if (child.visible) {
                child.update();
            }
        }

        // render border if needed
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.background_color, this.border_size);
    }

    draw_flex(ctx) {
        throw new Error("not implemented yet");
    }

    draw_default(ctx) {
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

            const item_total_width = i_pl + child.w + i_pr;

            // check if fits in current row
            if (acc + item_total_width > this.w - l_pr) {
                total_rows_height += current_row_height;
                row++;
                acc = l_pl;
                current_row_height = 0;
            }

            const target_x = this.x + acc + i_pl;
            const target_y = this.y + l_pt + total_rows_height + i_pt;

            // check y overflow
            if (target_y + child.h + i_pb > this.y + this.h - l_pb) {
                child.set_visible(false);
            } else {
                child.set_visible(true);
                
                // update position
                child.update_pos(target_x, target_y);
                
                // check for events
                child.update();
                
                // track max height for current row
                current_row_height = Math.max(current_row_height, child.h + i_pt + i_pb);
            }

            // update accumulator
            acc += item_total_width;
        }

        // render border
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.background_color, this.border_size);
    }
};

export class UI {
    /** @param {HTMLCanvasElement} canvas */
    constructor(canvas) {
        if (!canvas) {
            throw new Error("missing canvas element");
        }

        this.ctx = canvas.getContext("2d");
        this.root = new Node();
    }

    add(node) {
        this.root.add(node);
    }

    render(dt) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.root.render(this.ctx, dt);
    }
};