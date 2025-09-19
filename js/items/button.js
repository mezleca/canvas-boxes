import { Node } from "../canvas/canvas.js";
import { get_text_metrics, render_box, render_text } from "../canvas/renderer.js";
import { PADDING_POSITIONS } from "../canvas/style.js";

export class ButtonWidget extends Node {
    constructor(text, w, h) {
        super();
        this.set_background_color("rgba(255, 255, 255, 1)");
        this.set_border(2, "rgb(120, 120, 120)");
        this.font_color = "black";
        this.text = text;
        this.w = w || 0;
        this.h = h || 0;
    }

    render(ctx) {
        const text_metrics = get_text_metrics(ctx, this.text, `${this.font_size}px ${this.font}`);

        if (text_metrics.width * 2 > this.w) {
            this.w = text_metrics.width * 2;
        }

        if (text_metrics.height * 2 > this.h) {
            this.h = text_metrics.height * 2;
        }

        const target_w = this.padding[PADDING_POSITIONS.LEFT] + this.w + this.padding[PADDING_POSITIONS.RIGHT];
        const target_h = this.padding[PADDING_POSITIONS.TOP] + this.h + this.padding[PADDING_POSITIONS.BOTTOM];
        
        // render button box
        render_box(ctx, this.x, this.y, target_w, target_h, this.border_color, this.background_color, this.border_size, this.border_radius);

        // render centered text
        render_text(ctx, this.x + (text_metrics.width) / 2, this.y + (this.h + text_metrics.height) / 2, this.text, this.font, this.font_size, this.font_color);
    }
};