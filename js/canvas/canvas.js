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

        ctx.save();

        if (this.has_overflow) {
            // create clip mask
            if (this.border_radius > 0) {
                const x = this.x;
                const y = this.y;
                const w = this.w;
                const h = this.h;
                const r = this.border_radius;

                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.arcTo(x + w, y, x + w, y + h, r);
                ctx.arcTo(x + w, y + h, x, y + h, r);
                ctx.arcTo(x, y + h, x, y, r);
                ctx.arcTo(x, y, x + w, y, r);
                ctx.closePath();
            } else {
                ctx.beginPath();
                ctx.rect(this.x, this.y, this.w, this.h);
            }

            ctx.clip();
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

        ctx.restore();
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

    update_recursive() {
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
                    child.update_recursive();
                }
                child.y = original_y;
            } else {
                child.update_recursive();
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

export class Layout extends Node {
    constructor(w, h) {
        super();
        this.type = "default";
        this.visible = true;
        this.w = w;
        this.h = h;
        this.layout_dirty = true;
        this.has_overflow = true;
    }

    // override
    add(child) {
        child.parent = this;
        this.layout_dirty = true;
        this.children.push(child);
    }

    set_type(type) {
        this.type = type;
    }

    remove(id) {
        this.children = this.children.filter((c) => c.id != id);
        this.layout_dirty = true;
    }

    draw(ctx) {
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.background_color, this.border_size, this.border_radius);
    }

    calculate_layout() {
        if (!this.layout_dirty) {
            return;
        }

        // first calculate element position
        switch (this.type) {
            case "free": this.calculate_free_layout(); break;
            case "default": this.calculate_default_layout(); break;
        }

        this.layout_dirty = false;
    }

    calculate_free_layout() {
        let content_bottom = 0;

        for (const child of this.children) {
            const display_y = child.y - this.scroll_top;
            const is_visible = display_y + child.h >= this.y && display_y <= this.y + this.h;
            child.set_visible(is_visible);
            content_bottom = Math.max(content_bottom, child.y - this.y + child.h);
        }

        this.content_height = content_bottom;
    }

    calculate_default_layout() {
        // layout padding
        const l_pr = this.padding[PADDING_POSITIONS.RIGHT] || 0;
        const l_pl = this.padding[PADDING_POSITIONS.LEFT] || 0;
        const l_pt = this.padding[PADDING_POSITIONS.TOP] || 0;
        const l_pb = this.padding[PADDING_POSITIONS.BOTTOM] || 0;

        let current_x = l_pl;
        let current_y = l_pt;
        let row_height = 0;
        let content_height = l_pt;

        const available_width = this.w - l_pl - l_pr;

        for (const child of this.children) {
            // item padding
            const i_pr = child.padding[PADDING_POSITIONS.RIGHT] || 0;
            const i_pl = child.padding[PADDING_POSITIONS.LEFT] || 0;
            const i_pt = child.padding[PADDING_POSITIONS.TOP] || 0;
            const i_pb = child.padding[PADDING_POSITIONS.BOTTOM] || 0;

            const child_total_width = i_pl + child.w + i_pr;
            const child_total_height = i_pt + child.h + i_pb;

            // check if needs new row
            if (current_x + child_total_width > available_width && current_x > l_pl) {
                current_x = l_pl;
                current_y += row_height + this.spacing;
                row_height = 0;
            }

            // update item position
            const target_x = this.x + current_x + i_pl;
            const target_y = this.y + current_y + i_pt;

            child.update_pos(target_x, target_y);

            // set visibility based on scrolled position
            const display_y = target_y - this.scroll_top;
            const is_visible = display_y + child.h >= this.y && display_y <= this.y + this.h;
            child.set_visible(is_visible);

            // update position for next item
            current_x += child_total_width + this.spacing;
            row_height = Math.max(row_height, child_total_height);
            content_height = Math.max(content_height, current_y + child_total_height);
        }

        // store for scroll check
        this.content_height = content_height + l_pb;
    }

    update_recursive() {
        // update scroll position
        const scroll_updated = this.handle_scroll();

        if (scroll_updated) {
            this.layout_dirty = true;
        }

        this.calculate_layout();
        super.update();

        for (const child of this.children) {
            const original_y = child.y;
            child.y -= this.scroll_top;
            if (child.visible) {
                child.update_recursive();
            }
            child.y = original_y;
        }
    }

    render(ctx, dt) {
        if (!this.visible) {
            return;
        }

        // render background / border
        this.draw(ctx);

        // render scrollbar if needed
        if (this.max_scroll > 0) {
            this.render_scrollbar(ctx);
        }

        ctx.save();

        // create clip mask
        if (this.border_radius > 0) {
            const x = this.x;
            const y = this.y;
            const w = this.w;
            const h = this.h;
            const r = this.border_radius;

            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        } else {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.w, this.h);
        }

        ctx.clip();

        for (const child of this.children) {
            const original_y = child.y;
            child.y -= this.scroll_top;
            if (child.visible) {
                child.render(ctx, dt);
            }
            child.y = original_y;
        }

        ctx.restore();
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

        this.root.update_recursive();
        this.frame_count++;

        if (current_time - this.last_fps_update >= 1000) {
            this.fps = Math.round(this.frame_count * 1000 / (current_time - this.last_fps_update));
            this.frame_count = 0;
            this.last_fps_update = current_time;
        }
    }
};