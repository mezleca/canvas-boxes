import { Node } from "../canvas/canvas.js";
import { PADDING_POSITIONS } from "../canvas/style.js";
import { render_box } from "../canvas/renderer.js";

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

    draw(ctx) {
        const style = this.get_style();
        render_box(ctx, this.x, this.y, this.w, this.h, style.border_color, style.background_color, style.border_size, style.border_radius, true);
    }

    calculate(ctx) { 
        this.is_dirty = false;
    }

    get_available_width() {
        const parent_bounds = this.get_parent_bounds();
        return { width: parent_bounds.w - this.x, height: parent_bounds.h - this.y };
    }

    render(ctx, dt) {
        if (!this.visible) {
            return;
        }

        // render background / border
        ctx.save();
        this.draw(ctx);
        ctx.clip();

        this.calculate(ctx);

        for (const child of this.children) {
            const original_y = child.y;
            child.y -= this.scroll_top;
            if (child.visible) {
                child.render(ctx, dt);
            }
            child.y = original_y;
        }

        // render scrollbar if needed
        if (this.max_scroll > 0) {
            this.render_scrollbar(ctx);
        }

        ctx.restore();
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

        // layout padding
        const l_pr = style.padding[PADDING_POSITIONS.RIGHT] || 0;
        const l_pl = style.padding[PADDING_POSITIONS.LEFT] || 0;
        const l_pt = style.padding[PADDING_POSITIONS.TOP] || 0;
        const l_pb = style.padding[PADDING_POSITIONS.BOTTOM] || 0;
        
        const h_justify = style.horizontal_justify;
        const v_justify = style.vertical_justify;
        const spacing = style.spacing;

        const available_size = this.get_available_width();
        const inner_width = this.w - l_pl - l_pr;
        
        // clear previous row data
        this.rows = [];
        
        let current_row = {
            children: [],
            width: 0,
            height: 0,
            y: this.y + l_pt
        };

        let current_x = l_pl;
        let total_height = l_pt;

        // first pass: organize children into rows
        for (const child of this.children) {
            // calculate position if needed
            if (child.is_dirty && child.calculate) child.calculate(ctx);

            const child_width = child.w + (child.is_ghost ? 0 : spacing);
            const needs_new_row = current_x + child_width > inner_width && current_row.children.length > 0;

            if (needs_new_row) {
                this.rows.push(current_row);
                total_height += current_row.height + spacing;

                // start new row
                current_row = {
                    children: [],
                    width: 0,
                    height: 0,
                    y: this.y + total_height
                };
                current_x = l_pl;
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
        const available_content_height = this.h - l_pt - l_pb;
        let vertical_offset = 0;
        
        if (v_justify == "center") {
            vertical_offset = Math.max(0, (available_content_height - (total_height - l_pt)) / 2);
        } else if (v_justify == "bottom") {
            vertical_offset = Math.max(0, available_content_height - (total_height - l_pt));
        }

        // second pass: update position based on justify mode
        for (const row of this.rows) {
            let start_x = this.x + l_pl;
            
            if (h_justify == "center") {
                start_x += (inner_width - row.width) / 2;
            } else if (h_justify == "right") {
                start_x += inner_width - row.width;
            }

            let current_x = start_x;
            
            for (const child of row.children) {
                const child_style = child.get_style();
                const child_v_justify = child_style.vertical_justify;

                let child_y = row.y + vertical_offset;

                if (child_v_justify == "center") {
                    child_y += Math.max(0, (row.height - child.h) / 2);
                } else if (child_v_justify == "bottom") {
                    child_y += Math.max(0, row.height - child.h);
                }

                child.update_pos(current_x, child_y);
                current_x += child.w + (child.is_ghost ? 0 : spacing);
            }
        }

        this.content_height = total_height + l_pb;
        this.is_dirty = false;

        // check if we need to resize height
        if (this.auto_resize_height) {
            const required_h = this.content_height;
            if (required_h > this.h) {
                const new_h = Math.min(required_h, available_size.height);
                this.h = Math.max(this.min_height, new_h);
            }
        }

        this.max_scroll = Math.max(0, this.content_height - this.h);

        // update visibility
        this.update_visibility();
    }

    update_visibility() {
        for (const child of this.children) {
            const display_y = child.y - this.scroll_top;
            const is_visible = display_y + child.h >= this.y && display_y <= this.y + this.h;
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
        let content_bottom = this.y;

        for (const child of this.children) {
            // calculate position if possible
            if (child.is_dirty && child.calculate) child.calculate(ctx);

            // fallback to layout position
            if (child.x == 0) child.x = this.x;
            if (child.y == 0) child.y = this.y;

            const child_bottom = child.y + child.h;
            content_bottom = Math.max(content_bottom, child_bottom);
        }

        this.content_height = content_bottom - this.y;
        this.is_dirty = false;

        // update visibility
        const view_top = this.y + this.scroll_top;
        const view_bottom = this.y + this.h + this.scroll_top;

        for (const child of this.children) {
            const child_top = child.y;
            const child_bottom = child.y + child.h;

            const is_visible = child_bottom >= view_top && child_top <= view_bottom;
            child.set_visible(is_visible);
        }

        this.max_scroll = Math.max(0, this.content_height - this.h);
    }
};