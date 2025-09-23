import { Node } from "../canvas/canvas.js";
import { get_text_metrics, render_box, render_text } from "../canvas/renderer.js";
import { PADDING_POSITIONS } from "../canvas/style.js";

export class ButtonWidget extends Node {
    constructor(text, w, h) {
        super();
        this.w = w || 0;
        this.h = h || 0;
        this.text = text;

        // set style
        this.style.background_color({ r: 58, g: 58, b: 58 });
        this.style.font("Arial", 20, { r: 220, g: 220, b: 220 });
        this.style.border(2);
        this.style.text_align("center");
        this.style.text_baseline("middle");
        this.style.border_color({ r: 30, g: 30, b: 30 });
        this.style.border_radius({ r: 120, g: 120, b: 120 }, "hover");

        // style for hover
        this.style.background_color({ r: 60, g: 60, b: 60, a: 255 }, "hover");
    }

    calculate(ctx) {
        const style = this.get_style();
        const text_metrics = get_text_metrics(ctx, this.text, style.text_align, style.text_baseline, `${style.font_size}px ${style.font}`);

        const desired_text_w = text_metrics.width * 2;
        const desired_text_h = text_metrics.height * 2;

        const pads_w = style.padding[PADDING_POSITIONS.LEFT] + style.padding[PADDING_POSITIONS.RIGHT];
        const pads_h = style.padding[PADDING_POSITIONS.TOP] + style.padding[PADDING_POSITIONS.BOTTOM];

        this.w = pads_w + desired_text_w;
        this.h = pads_h + desired_text_h;

        this.is_dirty = false;
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
            `${style.font_size}px ${style.font}`,
            style.font_color,
            style.text_align,
            style.text_baseline,
        );

        ctx.restore();
    }
};