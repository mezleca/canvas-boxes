import { NodeStyle, StyleState } from "./style.js";
import { cursor, update_viewport, keys, screen } from "../events/dom.js";
import { render_box } from "./renderer.js";

export class Node {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.events = new Map();
        this.id = crypto.randomUUID();
        this.children = [];
        this.parent = null;
        this.visible = true;
        this.has_overflow = false;
        this.holding = false;
        this.text = "";
        this.scroll_top = 0;
        this.max_scroll = 0;
        this.content_height = 0;
        this.is_ghost = false; // element that takes up space but will not  be rendered (spacer)
        this.is_dirty = true; // needs to be calculated somewhere
        this.holding_scrollbar = false;
        this.style = new NodeStyle(this);
    }

    add(child) {
        child.parent = this;
        this.is_dirty = true;
        this.children.push(child);
        return this;
    }

    /** @returns {StyleState} */
    get_style() {
        return this.style.get_current();
    }

    _update_style_state(is_hovered, is_active) {
        let new_state = "default"; 

        if (is_active) {
            new_state = "active";
        } else if (is_hovered) {
            new_state = "hover";
        } else {
            new_state = "default";
        }

        if (new_state != this.style.current_state) {
            this.style.set_current_state(new_state);
            this.is_dirty = true;
        }
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

    get_parent_bounds() {
        if (this.parent && this.parent.w && this.parent.h) {
            return { w: this.parent.w, h: this.parent.h };
        }
        
        // fallback to screen
        return { w: screen.w, h: screen.h };
    }

    update() {
        const is_hovered = this.is_hovered();
        const has_m1_pressed = keys.has("mouse1");

        // updat style state
        this._update_style_state(is_hovered, has_m1_pressed && this.holding);

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

        if (this.holding && !has_m1_pressed) {
            this.holding = false;
        }
    }

    handle_scroll() {
        const style = this.get_style();
        this.max_scroll = Math.max(0, this.content_height - this.h);
        let updated = false;

        if (this.max_scroll > 0) {
            const is_hovered = this.is_hovered();

            // wheel scroll on the whole node
            if (is_hovered && cursor.delta_y != 0) {
                const old_scroll = this.scroll_top;

                if (cursor.delta_y > 0) {
                    this.scroll_top = Math.min(this.scroll_top + Math.abs(cursor.delta_y), this.max_scroll);
                } else if (cursor.delta_y < 0) {
                    this.scroll_top = Math.max(this.scroll_top - Math.abs(cursor.delta_y), 0);
                }

                if (old_scroll != this.scroll_top) {
                    updated = true;
                }

                cursor.delta_y = 0;
            }

            // drag
            const scrollbar_x = this.x + this.w - style.scrollbar_width;
            const is_holding = keys.has("mouse1");

            // @TODO: naming
            const should_enable_thumb_move = this._is_hovered(scrollbar_x, this.y, style.scrollbar_width, this.h) &&
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
        const style = this.get_style();
        const scrollbar_x = this.x + this.w - this.scrollbar_width;

        // render background
        render_box(ctx,
            scrollbar_x,
            this.y,
            style.scrollbar_width,
            this.h,
            null,
            style.scrollbar_background_color,
            null,
            0
        );

        // render thumb
        const view_ratio = this.h / this.content_height;
        const thumb_height = Math.max(20, this.h * view_ratio);
        const max_scroll = Math.max(1, this.content_height - this.h);
        const scroll_frac = this.scroll_top / max_scroll;
        const available_space = this.h - thumb_height;
        const thumb_y = this.y + scroll_frac * available_space;

        render_box(ctx,
            scrollbar_x,
            thumb_y,
            style.scrollbar_thumb_width,
            thumb_height,
            null,
            style.scrollbar_thumb_color,
            null,
            style.border_radius
        );
    }

    update_recursive(ctx) {
        this.update();

        let scroll_updated = false;
        if (this.has_overflow) {
            scroll_updated = this.handle_scroll();
        }

        if (scroll_updated) {
            this.is_dirty = true;
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
        return this;
    }

    on_click(cb) {
        if (cb) this.events.set("click", cb);
        return this;
    }

    on_hover(cb) {
        if (cb) this.events.set("mouseover", cb);
        return this;
    }

    on_mouseleave(cb) {
        if (cb) this.events.set("mouseleave", cb);
        return this;
    }

    set_id(id) {
        if(id && id != "") this.id = id;
        return this;
    }

    set_visible(value) {
        this.visible = value;
        return this;
    }

    set_text(value) {
        this.text = value;
        // force render
        this.is_dirty = true;
        return this;
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