import { Node } from "../canvas/canvas.js";
import { get_text_metrics, render_box, render_text } from "../canvas/renderer.js";
import { PADDING_POSITIONS } from "../canvas/style.js";

export class ButtonWidget extends Node {
    constructor(text, w, h) {
        super();
        this.w = w || 0;
        this.h = h || 0;
        this.text = text;

        // style for all states
        this.style.set_background_color("rgba(58, 58, 58, 1)");
        this.style.set_font("Arial", 20, "rgb(220, 220, 220)");
        this.style.set_border(2);
        this.style.set_text_align("center");
        this.style.set_text_baseline("middle");

        // style for hover
        this.style.set_background_color("rgba(83, 83, 83, 1)", "hover");

        // style for active
        this.style.set_border_color("rgba(255, 255, 255)", "active");
    }

    calculate(ctx) {
        const style = this.get_style();
        const text_metrics = get_text_metrics(ctx, this.text, style.text_align, style.text_baseline, `${style.font_size}px ${style.font}`);

        const desired_text_w = text_metrics.width * 2;
        const desired_text_h = text_metrics.height * 2;

        const pads_w = (style.padding[PADDING_POSITIONS.LEFT] || 0) + (style.padding[PADDING_POSITIONS.RIGHT] || 0);
        const pads_h = (style.padding[PADDING_POSITIONS.TOP] || 0) + (style.padding[PADDING_POSITIONS.BOTTOM] || 0);

        this.w = pads_w + desired_text_w;
        this.h = pads_h + desired_text_h;

        console.log(this.w, this.h, pads_w, pads_h, desired_text_w, desired_text_h);
    }

    render(ctx) {
        if (!this.visible) return;

        const style = this.get_style();

        ctx.save();

        // render button box
        render_box(ctx, this.x, this.y, this.w, this.h, style.border_color, style.background_color, style.border_size, style.border_radius);

        // render centered text
        render_text(
            ctx,
            this.x + this.w / 2,
            this.y + this.h / 2,
            this.text,
            style.font,
            style.font_size,
            style.font_color,
            style.text_align,
            style.text_baseline,
        );

        ctx.restore();
    }
};