import { StyleData } from "./style.js";
import { cursor, update_viewport, keys } from "../events/dom.js";
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
        this.has_overflow = false;
        this.holding = false;
        this.text = "";
        this.scroll_top = 0;
        this.max_scroll = 0;
        this.content_height = 0;
        this.layout_dirty = false;
        this.holding_scrollbar = false;

        // scrollbar default
        this.scrollbar_width = 12;
        this.scrollbar_thumb_width = 12;
        this.scrollbar_thumb_height = 20;
        this.scrollbar_background_width = 12;
        this.scrollbar_background_color = "rgb(0, 0, 0, 0)";
        this.scrollbar_thumb_color = "rgb(160, 160, 160, 0.7)";
    }

    add(child) {
        child.parent = this;
        this.children.push(child);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render(ctx, dt) {
        if (!this.visible) return;

        this.draw(ctx);

        if (this.has_overflow && this.max_scroll > 0) {
            this.render_scrollbar(ctx);
        }

        for (const child of this.children) {
            if (this.has_overflow) {
                const original_y = child.y;
                child.y -= this.scroll_top;
                if (child.visible) {
                    child.render(ctx, dt);
                }
                child.y = original_y;
            } else {
                child.render(ctx, dt);
            }
        }
    }

    draw(ctx) { }

    update_pos(x, y) {
        if (x != undefined) this.x = x;
        if (y != undefined) this.y = y;
    }

    _is_hovered(x, y, w, h) {
        const x1 = x;
        const x2 = x + w;
        const y1 = y;
        const y2 = y + h;
        return cursor.x > x1 && cursor.x < x2 && cursor.y > y1 && cursor.y < y2;
    }

    is_hovered() {
        return this._is_hovered(this.x, this.y, this.w, this.h);
    }

    update() {
        const is_hovered = this.is_hovered();
        const has_m1_pressed = keys.has("mouse1");

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
        if (is_hovered && !this.holding && has_m1_pressed) {
            this.holding = true;
            const callback = this.events.get("mousedown");
            if (callback) callback(this);
        }

        // cancel click
        if (!is_hovered && this.holding && !has_m1_pressed) {
            this.holding = false;
            const callback = this.events.get("mouseup");
            if (callback) callback(this);
        }

        // send both click and mouse up
        if (is_hovered && this.holding && !has_m1_pressed) {
            this.holding = false;

            const mu_callback = this.events.get("mouseup");
            if (mu_callback) mu_callback(this);

            const cl_callback = this.events.get("click");
            if (cl_callback) cl_callback(this);
        }
    }

    handle_scroll() {
        this.max_scroll = Math.max(0, this.content_height - this.h);
        let updated = false;

        if (this.max_scroll > 0) {
            const is_hovered = this.is_hovered();

            // wheel scroll on the whole node
            if (is_hovered && cursor.delta_y != 0) {
                const old_scroll = this.scroll_top;

                if (cursor.delta_y > 0) {
                    this.scroll_top = Math.min(this.scroll_top + 10, this.max_scroll);
                } else if (cursor.delta_y < 0) {
                    this.scroll_top = Math.max(this.scroll_top - 10, 0);
                }

                if (old_scroll != this.scroll_top) {
                    updated = true;
                }

                cursor.delta_y = 0;
            }

            // drag
            const scrollbar_x = this.x + this.w - this.scrollbar_width;
            const is_holding = keys.has("mouse1");

            // @TODO: naming
            const should_enable_thumb_move = this._is_hovered(scrollbar_x, this.y, this.scrollbar_width, this.h) &&
                is_holding;

            // enable drag mode for scrollbar
            if (!this.holding_scrollbar && should_enable_thumb_move) {
                this.holding_scrollbar = true;
            }

            // disable drag mode if we stopped holding ts
            if (this.holding_scrollbar && !is_holding) {
                this.holding_scrollbar = false;
            }

            // update scrollbar position
            if (this.holding_scrollbar) {
                const relative_y = cursor.y - this.y;
                const frac = relative_y / this.h;
                const new_scroll = frac * this.max_scroll;

                if (new_scroll != this.scroll_top) {
                    updated = true;
                }

                this.scroll_top = Math.max(0, Math.min(new_scroll, this.max_scroll));
            }
        } else {
            this.scroll_top = 0;
        }

        return updated;
    }

    render_scrollbar(ctx) {
        const scrollbar_x = this.x + this.w - this.scrollbar_width;

        // render background
        render_box(ctx,
            scrollbar_x,
            this.y,
            this.scrollbar_background_width,
            this.h,
            null,
            this.scrollbar_background_color,
            null,
            0
        );

        // render thumb
        const scroll_frac = this.scroll_top / this.max_scroll;
        const thumb_y = this.y + scroll_frac * (this.h - this.scrollbar_thumb_height);

        render_box(ctx,
            scrollbar_x,
            thumb_y,
            this.scrollbar_thumb_width,
            this.scrollbar_thumb_height,
            null,
            this.scrollbar_thumb_color,
            null,
            this.border_radius
        );
    }

    update_recursive(ctx) {
        this.update();

        let scroll_updated = false;
        if (this.has_overflow) {
            scroll_updated = this.handle_scroll();
        }

        if (scroll_updated) {
            this.layout_dirty = true;
        }

        for (const child of this.children) {
            if (this.has_overflow) {
                const original_y = child.y;
                child.y -= this.scroll_top;
                if (child.visible) {
                    child.update_recursive(ctx);
                }
                child.y = original_y;
            } else {
                child.update_recursive(ctx);
            }
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

    render(currentTime) {
        // update viewport
        update_viewport(this.canvas);

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.root.render(this.ctx, this.delta_time);

        this.update(currentTime);
    }

    // called on loop
    update(current_time) {
        this.delta_time = (current_time - this.last_time) / 1000;
        this.last_time = current_time;

        // skip if delta time is too high
        if (this.delta_time > 0.1) {
            return;
        }

        this.root.update_recursive(this.ctx);
        this.frame_count++;

        if (current_time - this.last_fps_update >= 1000) {
            this.fps = Math.round(this.frame_count * 1000 / (current_time - this.last_fps_update));
            this.frame_count = 0;
            this.last_fps_update = current_time;
        }
    }
};