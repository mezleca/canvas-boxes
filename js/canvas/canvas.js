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
    render(ctx) {
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
            case "default":
                this.draw_default(ctx);
                break;
            case "flex":
                break;
        }
    }

    draw_default(ctx) {
        // layout padding
        const l_pr = this.padding[PADDING_POSITIONS.RIGHT] || 0;
        const l_pl = this.padding[PADDING_POSITIONS.LEFT] || 0;
        const l_pt = this.padding[PADDING_POSITIONS.TOP] || 0;
        const l_pb = this.padding[PADDING_POSITIONS.BOTTOM] || 0;

        let acc = l_pl;
        let row = 0;

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];

            // item padding
            const i_pr = child.padding[PADDING_POSITIONS.RIGHT];
            const i_pl = child.padding[PADDING_POSITIONS.LEFT];
            const i_pt = child.padding[PADDING_POSITIONS.TOP];
            const i_pb = child.padding[PADDING_POSITIONS.BOTTOM];

            let target_x = i_pl + acc;
            
            // prevent x overflow (x_pos + width + layout_left_padding)
            if (target_x + child.w + l_pr > this.w) {
                row++;
                acc = l_pl;    

                // recalculate x pos
                target_x = i_pl + acc;
            }

            let target_y = l_pt + row * (child.h + i_pt + i_pb);

            // prevent y overflow (not ideal)
            if (target_y + l_pb > this.h) {
                break;
            }

            // update position
            child.update_pos(target_x, target_y);

            // check for events
            child.update();

            // add extra padding if necessary
            acc += i_pl + child.w + i_pr;
        }

        // render border
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.border_size);
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

    render() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.root.render(this.ctx);
    }
};