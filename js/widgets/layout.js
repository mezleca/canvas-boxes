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
        this.layout_dirty = true;
        this.has_overflow = true;
    }

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
        const style = this.get_style();
        render_box(ctx, this.x, this.y, this.w, this.h, style.border_color, style.background_color, style.border_size, style.border_radius, true);
    }

    calculate(ctx) { }

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
        this.style.set_spacing(10);

        // resize options
        this.auto_resize_width = false;
        this.auto_resize_height = false;
        this.min_width = this.w || 0;
        this.min_height = this.h || 0;
    }

    set_auto_resize(width = false, height = false) {
        this.auto_resize_width = width;
        this.auto_resize_height = height;
        this.layout_dirty = true;
    }

    calculate(ctx) {
        if (!this.layout_dirty && !this.auto_resize_height && !this.auto_resize_width) {
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

        const parent_bounds = this.get_parent_bounds();
        const max_expandable_width = parent_bounds.w - this.x;
        const max_expandable_height = parent_bounds.h - this.y;

        if (this.layout_dirty) {
            let current_x = l_pl;
            let current_y = l_pt;
            let row_height = 0;
            let content_height = l_pt;
            let available_right = this.w - l_pr;

            for (const child of this.children) {
                // calculate position if possible
                if (child.calculate) child.calculate(ctx);

                const child_total_width = child.w;
                const child_total_height = child.h;

                // check if we need to resize width
                if (this.auto_resize_width && current_x + child_total_width > available_right) {
                    const needed_width = current_x + child_total_width + l_pr;
            
                    if (needed_width <= max_expandable_width) {
                        this.w = needed_width;
                        available_right = this.w - l_pr;
                    }
                }

                // check if needs new row
                if (current_x + child_total_width > available_right && current_x > l_pl) {
                    current_x = l_pl;
                    current_y += row_height + style.spacing;
                    row_height = 0;
                }

                // update item position
                const target_x = this.x + current_x;
                const target_y = this.y + current_y;

                child.update_pos(target_x, target_y);

                // update position for next item
                current_x += child_total_width;

                // dont add spacing for ghost elements
                if (!child.is_ghost) {
                    current_x += style.spacing;
                }

                row_height = Math.max(row_height, child_total_height);
                content_height = Math.max(content_height, current_y + child_total_height);
            }

            this.content_height = content_height + l_pb;
            this.layout_dirty = false;
        }

        // check if we need to resize height
        if (this.auto_resize_height) {
            const required_h = this.content_height;
            if (required_h > this.h) {
                const new_h = Math.min(required_h, max_expandable_height);
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
        if (this.layout_dirty) {
            let content_bottom = this.y;

            for (const child of this.children) {
                // calculate position if possible
                if (child.calculate) child.calculate(ctx);

                // fallback to layout position
                if (child.x == 0) child.x = this.x;
                if (child.y == 0) child.y = this.y;

                const child_bottom = child.y + child.h;
                content_bottom = Math.max(content_bottom, child_bottom);
            }

            this.content_height = content_bottom - this.y;
            this.layout_dirty = false;
        }

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