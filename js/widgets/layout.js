import { Node } from "../index.js";
import { BaseRenderer } from "../renderer/renderer.js";

// base: here you will find all of the functions related to (draw bg, add child, update recursive items, etc...) but no calculation is done here
export class BaseLayout extends Node {
    constructor(w, h) {
        super();
        this.type = "default";
        this.visible = true;
        this.w = w;
        this.h = h;
        this.is_dirty = true;
        this.has_overflow = true;
    }

    set_type(type) {
        this.type = type;
    }

    remove(id) {
        this.children = this.children.filter((c) => c.id != id);
        this.is_dirty = true;
    }

    /** @param {BaseRenderer} renderer */
    draw(renderer) {
        const style = this.get_style();
        const id = `${this.id}_background`;
        renderer.render_box(id, 
            this.x, 
            this.y, 
            this.w, 
            this.h, 
            style
        );
    }

    calculate() { }

    get_available_width() {
        const parent_bounds = this.get_parent_bounds();
        return { width: parent_bounds.w - this.x, height: parent_bounds.h - this.y };
    }

    /** @param {BaseRenderer} renderer */
    render(renderer, dt) {
        if (!this.visible) {
            return;
        }

        const style = this.get_style();
        const content_bounds = this.get_content_bounds();

        // render background / border
        this.draw(renderer);

        // set clipping to content area (inside border and padding)
        renderer.set_clip(
            content_bounds.x,
            content_bounds.y,
            content_bounds.w,
            content_bounds.h
        );

        this.calculate(renderer);

        for (const child of this.children) {
            const original_y = child.y;
            child.y -= this.scroll_top;
            if (child.visible) {
                child.render(renderer, dt);
            }
            child.y = original_y;
        }

        renderer.restore_clip();

        // render scrollbar if needed
        if (this.max_scroll > 0) {
            this.render_scrollbar(renderer);
        }
    }
};

// default: items will be placed side by side, you can also enable auto-resize to prevent new rows from being created
export class DefaultLayout extends BaseLayout {
    constructor(w, h) {
        super(w || 0, h || 0);

        // default style for all states
        this.style.spacing(10);

        // resize options
        this.auto_resize_width = false;
        this.auto_resize_height = false;
        this.min_width = this.w || 0;
        this.min_height = this.h || 0;
        this.rows = [];
    }

    set_auto_resize(width = false, height = false) {
        this.auto_resize_width = width;
        this.auto_resize_height = height;
        this.is_dirty = true;
    }

    calculate(ctx) {
        if (!this.is_dirty && !this.auto_resize_height && !this.auto_resize_width) {
            this.update_visibility();
            this.max_scroll = Math.max(0, this.content_height - this.h);
            return;
        }

        const style = this.get_style();
        const content_bounds = this.get_content_bounds();
        
        const h_justify = style.horizontal_justify.value;
        const v_justify = style.vertical_justify.value;
        const spacing = style.spacing.value || 0;

        const available_size = this.get_available_width();
        const inner_width = content_bounds.w;
        
        // clear previous row data
        this.rows = [];

        let current_x = 0;
        let total_height = 0;

        let current_row = {
            children: [],
            width: 0,
            height: 0,
            y: content_bounds.y + total_height
        };

        // first pass: organize children into rows
        for (const child of this.children) {
            // calculate child size if needed
            if (child.is_dirty && child.calculate) {
                child.calculate(ctx);
            }

            const child_width = child.w + (child.is_ghost ? 0 : spacing);
            const needs_new_row = current_x + child_width > inner_width && current_row.children.length > 0;

            if (needs_new_row) {
                // finish current row
                this.rows.push(current_row);
                total_height += current_row.height + spacing;

                // start new row
                current_row = {
                    children: [],
                    width: 0,
                    height: 0,
                    y: content_bounds.y + total_height
                };

                current_x = 0;
            }

            // add child to current row
            current_row.children.push(child);
            current_row.width += child_width;
            current_row.height = Math.max(current_row.height, child.h);
            current_x += child_width;
        }

        // add last row if it has children
        if (current_row.children.length > 0) {
            this.rows.push(current_row);
            total_height += current_row.height;
        }

        // calculate vertical justify offset for all rows
        let vertical_offset = 0;
        
        if (v_justify == "center") {
            vertical_offset = Math.max(0, (content_bounds.h - total_height) / 2);
        } else if (v_justify == "bottom") {
            vertical_offset = Math.max(0, content_bounds.h - total_height);
        }

        // second pass: position children based on justify mode
        for (const row of this.rows) {
            let start_x = content_bounds.x;
            
            const row_width_without_trailing_spacing = row.width - 
                (row.children.length > 0 && !row.children[row.children.length - 1].is_ghost ? spacing : 0);
            
            if (h_justify == "center") {
                start_x += (inner_width - row_width_without_trailing_spacing) / 2;
            } else if (h_justify == "right") {
                start_x += inner_width - row_width_without_trailing_spacing;
            }

            let current_x = start_x;
            
            for (let i = 0; i < row.children.length; i++) {
                const child = row.children[i];
                const child_style = child.get_style();
                const child_v_justify = child_style.vertical_justify.value || "top";

                let child_y = row.y + vertical_offset;

                // vertical alignment within row
                if (child_v_justify == "center") {
                    child_y += Math.max(0, (row.height - child.h) / 2);
                } else if (child_v_justify == "bottom") {
                    child_y += Math.max(0, row.height - child.h);
                }

                // position the child
                child.update_pos(current_x, child_y);
                
                // advance x position
                current_x += child.w + (child.is_ghost ? 0 : spacing);
            }
        }

        // calculate total content height (includes padding in the bounds calculation)
        this.content_height = total_height + content_bounds.padding.top + content_bounds.padding.bottom;

        // check if we need to resize height
        if (this.auto_resize_height) {
            const required_h = this.content_height + (content_bounds.border * 2);
            if (required_h > this.h) {
                const new_h = Math.min(required_h, available_size.height);
                this.h = Math.max(this.min_height, new_h);
            }
        }

        this.max_scroll = Math.max(0, this.content_height - content_bounds.h);

        // update visibility
        this.update_visibility();
    }

    update_visibility() {
        const content_bounds = this.get_content_bounds();
        const view_top = content_bounds.y + this.scroll_top;
        const view_bottom = view_top + content_bounds.h;

        for (const child of this.children) {
            const child_top = child.y;
            const child_bottom = child.y + child.h;
            
            const buffer = 50;
            const is_visible = (child_bottom + buffer) >= view_top && (child_top - buffer) <= view_bottom;
            
            child.set_visible(is_visible);
        }
    }
};

// free: you can place the items anywhere you want (otherwise it will defaults to layout's x,y)
export class FreeLayout extends BaseLayout {
    constructor(w, h) {
        super(w, h);
    }

    calculate(ctx) {
        const content_bounds = this.get_content_bounds();
        let content_bottom = content_bounds.y;

        for (const child of this.children) {
            // calculate position if possible
            if (child.is_dirty && child.calculate) child.calculate(ctx);
            
            // fallback to content position
            if (child.x == 0) child.x = content_bounds.x;
            if (child.y == 0) child.y = content_bounds.y;

            const child_bottom = child.y + child.h;
            content_bottom = Math.max(content_bottom, child_bottom);
        }

        // content height relative to the content area
        this.content_height = content_bottom - content_bounds.y + content_bounds.padding.top + content_bounds.padding.bottom;
        this.is_dirty = false;

        // update visibility
        this.update_visibility();
        this.max_scroll = Math.max(0, this.content_height - content_bounds.h);
    }

    update_visibility() {
        const content_bounds = this.get_content_bounds();
        const view_top = content_bounds.y + this.scroll_top;
        const view_bottom = view_top + content_bounds.h;

        for (const child of this.children) {
            const child_top = child.y;
            const child_bottom = child.y + child.h;

            const is_visible = child_bottom >= view_top && child_top <= view_bottom;
            child.set_visible(is_visible);
        }
    }
};