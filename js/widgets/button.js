import { Node } from "../canvas/canvas.js";
import { get_text_metrics, render_box, render_text } from "../canvas/renderer.js";
import { PADDING_POSITIONS } from "../canvas/style.js";

export class ButtonWidget extends Node {
    constructor(text, w, h) {
        super();
        this.w = w || 0;
        this.h = h || 0;

        // button default style
        this.font_color = "black";
        this.text = text;
        this.text_align = "center";
        this.text_baseline = "middle";
        this.set_background_color("rgba(255, 255, 255, 1)");
        this.set_border(2, "rgb(120, 120, 120)");
    }

    calculate(ctx) {
        const text_metrics = get_text_metrics(ctx, this.text, `${this.font_size}px ${this.font}`);

        const desired_text_w = text_metrics.width * 2;
        const desired_text_h = text_metrics.height * 2;

        const pads_w = (this.padding[PADDING_POSITIONS.LEFT] || 0) + (this.padding[PADDING_POSITIONS.RIGHT] || 0);
        const pads_h = (this.padding[PADDING_POSITIONS.TOP] || 0) + (this.padding[PADDING_POSITIONS.BOTTOM] || 0);

        this.w = pads_w + desired_text_w;
        this.h = pads_h + desired_text_h;
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.save();

        // render button box
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.background_color, this.border_size, this.border_radius);

        // render centered text
        render_text(
            ctx,
            this.x + this.w / 2,
            this.y + this.h / 2,
            this.text,
            this.font,
            this.font_size,
            this.font_color,
            this.text_align,
            this.text_baseline,
        );

        ctx.restore();
    }
};