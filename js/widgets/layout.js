import { Node } from "../canvas/canvas.js";
import { PADDING_POSITIONS } from "../canvas/style.js";
import { render_box } from "../canvas/renderer.js";

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
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.background_color, this.border_size, this.border_radius, true);
    }

    calculate_layout(ctx) {
        if (!this.layout_dirty) {
            return;
        }

        // first calculate element position
        switch (this.type) {
            case "free": this.calculate_free_layout(ctx); break;
            case "default": this.calculate_default_layout(ctx); break;
        }

        this.layout_dirty = false;
    }

    calculate_free_layout(ctx) {
        let content_bottom = 0;

        for (const child of this.children) {
            const display_y = child.y - this.scroll_top;
            const is_visible = display_y + child.h >= this.y && display_y <= this.y + this.h;
            child.set_visible(is_visible);
            content_bottom = Math.max(content_bottom, child.y - this.y + child.h);
        }

        this.content_height = content_bottom;
    }

    calculate_default_layout(ctx) {
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
            // calculate position if possible
            if (child.calculate) child.calculate(ctx);

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

    update_recursive(ctx) {
        // update scroll position
        const scroll_updated = this.handle_scroll();

        if (scroll_updated) {
            this.layout_dirty = true;
        }

        this.calculate_layout(ctx);
        super.update();

        for (const child of this.children) {
            const original_y = child.y;
            child.y -= this.scroll_top;
            if (child.visible) {
                child.update_recursive(ctx);
            }
            child.y = original_y;
        }
    }

    render(ctx, dt) {
        if (!this.visible) {
            return;
        }

        // render background / border
        ctx.save();
        this.draw(ctx);
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

        // render scrollbar if needed
        if (this.max_scroll > 0) {
            this.render_scrollbar(ctx);
        }
    }
};