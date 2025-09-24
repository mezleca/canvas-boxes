import { NodeStyle, StyleState } from "./style.js";
import { PADDING_POSITIONS } from "./style.js";
import { CanvasRenderer } from "./renderer/canvas.js";
import { register_ui, unregister_ui } from "./events/dom.js";

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
        this.is_ghost = false; // element that takes up space but will not be rendered (spacer)
        this.is_dirty = true; // needs to be calculated somewhere
        this.holding_scrollbar = false;
        this.style = new NodeStyle(this);
        this.ui = null;
    }

    add(child) {
        child.parent = this;
        child._propagate_ui_reference(this.ui);
        this.mark_dirty();
        this.children.push(child);
        return this;
    }

    mark_dirty() {
        this.is_dirty = true;
        let parent = this.parent;
        while (parent) {
            parent.is_dirty = true;
            parent = parent.parent;
        }
    }

    get_input_state() {
        return this.ui.get_input_state();
    }

    /** @returns {StyleState} */
    get_style() {
        return this.style.get_current();
    }

    _propagate_ui_reference(ui) {
        this.ui = ui;
        for (const child of this.children) {
            child._propagate_ui_reference(ui);
        }
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
            this.mark_dirty();
        }
    }

    render(renderer, dt) {
        if (!this.visible) return;

        // only render if needed
        if (renderer.should_render(this)) {
            this.draw(renderer);
            renderer.mark_rendered(this);
        }

        if (this.has_overflow && this.max_scroll > 0) {
            this.render_scrollbar(renderer);
        }

        // render children with clipping if needed
        if (this.has_overflow) {
            renderer.set_clip(this.x, this.y, this.w, this.h);
        }

        for (const child of this.children) {
            if (this.has_overflow) {
                const original_y = child.y;
                child.y -= this.scroll_top;
                if (child.visible) {
                    child.render(renderer, dt);
                }
                child.y = original_y;
            } else {
                child.render(renderer, dt);
            }
        }

        if (this.has_overflow) {
            renderer.restore_clip();
        }
    }

    draw(renderer) {
        const style = this.get_style();
        renderer.render_box(this.id, this.x, this.y, this.w, this.h, style);
    }

    update_pos(x, y) {
        if (x != undefined) this.x = x;
        if (y != undefined) this.y = y;
    }

    _is_hovered(x, y, w, h) {
        const input = this.get_input_state();
        const x1 = x;
        const x2 = x + w;
        const y1 = y;
        const y2 = y + h;
        return input.cursor.x > x1 && input.cursor.x < x2 && input.cursor.y > y1 && input.cursor.y < y2;
    }

    is_hovered() {
        return this._is_hovered(this.x, this.y, this.w, this.h);
    }

    get_parent_bounds() {
        if (this.parent && this.parent.w && this.parent.h) {
            return { w: this.parent.w, h: this.parent.h };
        }
        
        const input = this.get_input_state();

        // fallback to screen
        return { w: input.screen.w, h: input.screen.h };
    }

    get_content_bounds() {
        const style = this.get_style();
        const border = style.border_size || 0;
        
        const padding_top = style.padding[PADDING_POSITIONS.TOP] || 0;
        const padding_right = style.padding[PADDING_POSITIONS.RIGHT] || 0;
        const padding_bottom = style.padding[PADDING_POSITIONS.BOTTOM] || 0;
        const padding_left = style.padding[PADDING_POSITIONS.LEFT] || 0;
        
        return {
            x: this.x + border + padding_left,
            y: this.y + border + padding_top,
            w: this.w - (border * 2) - padding_left - padding_right,
            h: this.h - (border * 2) - padding_top - padding_bottom,
            padding: {
                top: padding_top,
                right: padding_right,
                bottom: padding_bottom,
                left: padding_left
            },
            border: border
        };
    }

    update() {
        const input = this.get_input_state();
        const is_hovered = this.is_hovered();
        const has_m1_pressed = input.keys.has("mouse1");

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
        const input = this.get_input_state();
        const style = this.get_style();
        this.max_scroll = Math.max(0, this.content_height - this.h);
        let updated = false;

        if (this.max_scroll > 0) {
            const is_hovered = this.is_hovered();

            // wheel scroll on the whole node
            if (is_hovered && input.cursor.delta_y != 0) {
                const old_scroll = this.scroll_top;

                if (input.cursor.delta_y > 0) {
                    this.scroll_top = Math.min(this.scroll_top + Math.abs(input.cursor.delta_y), this.max_scroll);
                } else if (input.cursor.delta_y < 0) {
                    this.scroll_top = Math.max(this.scroll_top - Math.abs(input.cursor.delta_y), 0);
                }

                if (old_scroll != this.scroll_top) {
                    updated = true;
                }
            }

            // drag
            const scrollbar_x = this.x + this.w - style.scrollbar_width;
            const is_holding = input.keys.has("mouse1");

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
                const relative_y = input.cursor.y - this.y;
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

        if (updated) {
            this.mark_dirty();
        }

        return updated;
    }

    render_scrollbar(renderer) {
        const style = this.get_style();
        const scrollbar_x = this.x + this.w - style.scrollbar_width;
        const scrollbar_id = `${this.id}_scrollbar_bg`;

        // render background
        renderer.render_box(
            scrollbar_id,
            scrollbar_x,
            this.y,
            style.scrollbar_width,
            this.h,
            { background_color: style.scrollbar_background_color, border_size: style.scrollbar_width, border_radius: style.scrollbar_thumb_radius }
        );

        // render thumb
        const view_ratio = this.h / this.content_height;
        const thumb_height = Math.max(20, this.h * view_ratio);
        const max_scroll = Math.max(1, this.content_height - this.h);
        const scroll_frac = this.scroll_top / max_scroll;
        const available_space = this.h - thumb_height;
        const thumb_y = this.y + scroll_frac * available_space;

        const scrollbar_thumb_id = `${this.id}_scrollbar_thumb`;

        renderer.render_box(
            scrollbar_thumb_id,
            scrollbar_x,
            thumb_y,
            style.scrollbar_thumb_width,
            thumb_height,
            { background_color: style.scrollbar_thumb_color, border_size: style.scrollbar_thumb_width, border_radius: style.scrollbar_thumb_radius }
        );
    }

    update_recursive() {
        this.update();

        if (this.has_overflow) {
            this.handle_scroll();
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
        if(id && id != "") {
            this.id = id;
            this.mark_dirty();
        }
        return this;
    }

    set_visible(value) {
        if (this.visible != value) {
            this.visible = value;
            this.mark_dirty();
        }
        return this;
    }

    set_text(value) {
        if (this.text != value) {
            this.text = value;
            this.mark_dirty();
        }
        return this;
    }
};

export class UI {
    constructor(renderer) {
        if (!renderer) {
            throw new Error("missing renderer");
        }

        this.renderer = renderer;
        this.delta_time = 0;
        this.last_time = 0;
        this.fps = 0;
        this.last_fps_update = 0;
        this.frame_count = 0;
        this.root = new Node();
        this.root.ui = this;
        this.all_nodes = new Set();
        this.should_render = false;
        this.current_dpr = window.devicePixelRatio || 1;
        this.current_width = 0;
        this.current_height = 0;
        this.viewport_dirty = true;

        this.input_state = {
            keys: new Set(),
            cursor: { x: 0, y: 0, delta_y: 0, delta_x: 0 },
            screen: { w: window.innerWidth, h: window.innerHeight }
        };

        register_ui(this);
    }

    add(node) {
        node.ui = this;
        this.root.add(node);
        this._collect_all_nodes();
    }

    get_input_state() {
        return this.input_state;
    }

    on_mouse_move(data) {
        this.input_state.cursor.x = data.x;
        this.input_state.cursor.y = data.y;
    }

    on_wheel(data) {
        this.input_state.cursor.delta_y = data.delta_y;
        this.input_state.cursor.delta_x = data.delta_x;
    }

    on_key_press(data) {
        this.input_state.keys.add(data.key);
    }

    on_key_release(data) {
        this.input_state.keys.delete(data.key);
    }

    on_resize(data) {
        this.input_state.screen.w = data.width;
        this.input_state.screen.h = data.height;
        this.viewport_dirty = true;
        this.should_render = true;
    }

    on_blur() {
        this.input_state.keys.clear();
        this.should_render = true;
    }
    
    _collect_all_nodes() {
        this.all_nodes.clear();
        
        const collect_recursive = (node) => {
            this.all_nodes.add(node);
            for (const child of node.children) {
                collect_recursive(child);
            }
        };
        
        collect_recursive(this.root);
    }
    
    update_viewport() {
        if (!(this.renderer instanceof CanvasRenderer)) {
            return false;
        }

        const screen_w = window.innerWidth;
        const screen_h = window.innerHeight;
        const device_pixel_rate = window.devicePixelRatio || 1;

        // check if we actually need to update
        const needs_update = 
            this.viewport_dirty ||
            this.current_width != screen_w ||
            this.current_height != screen_h ||
            this.current_dpr != device_pixel_rate;

        if (!needs_update) {
            return false;
        }

        // store current values
        this.current_width = screen_w;
        this.current_height = screen_h;
        this.current_dpr = device_pixel_rate;
        this.viewport_dirty = false;

        // update screen size
        screen.w = screen_w;
        screen.h = screen_h;

        this.renderer.canvas.width = screen_w * device_pixel_rate;
        this.renderer.canvas.height = screen_h * device_pixel_rate;
        this.renderer.canvas.style.width = screen_w + "px";
        this.renderer.canvas.style.height = screen_h + "px";

        // reset transform and use new scaling
        this.renderer.ctx.setTransform(device_pixel_rate, 0, 0, device_pixel_rate, 0, 0);
        return true;
    }

    async render(current_time) {
        const viewport_changed = this.update_viewport();
        const has_dirty_nodes = Array.from(this.all_nodes).some((node) => node.is_dirty);
        
        if (this.should_render || has_dirty_nodes || viewport_changed) {
            this.renderer.clear();
            this.root.render(this.renderer, this.delta_time);
            
            // cleanup unused cached elements
            this.renderer.cleanup_unused(Array.from(this.all_nodes));
            this.should_render = false;
            
            // mark all nodes as clean after render
            for (const node of this.all_nodes) {
                node.is_dirty = false;
            }
        }

        this.update(current_time);
    }

    update(current_time) {
        this.delta_time = (current_time - this.last_time) / 1000;
        this.last_time = current_time;

        // Skip if delta time is too high (prevents jumps after tab focus)
        if (this.delta_time > 0.1) {
            return;
        }

        this.root.update_recursive();
        this._collect_all_nodes();

        // reset wheel delta
        this.input_state.cursor.delta_y = 0;
        this.input_state.cursor.delta_x = 0;

        this.frame_count++;

        if (current_time - this.last_fps_update >= 1000) {
            this.fps = Math.round(this.frame_count * 1000 / (current_time - this.last_fps_update));
            this.frame_count = 0;
            this.last_fps_update = current_time;
        }
    }

    destroy() {
        unregister_ui(this);
    }
};