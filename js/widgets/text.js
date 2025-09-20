import { Node } from "../canvas/canvas.js";
import { get_text_metrics, render_box, render_text } from "../canvas/renderer.js";

export class TextWidget extends Node {
    constructor(text = "") {
        super();
        if (text != "") this.text = text;
        this.text_baseline = "middle";
    }

    calculate(ctx) {
        ctx.save();
        const metrics = get_text_metrics(ctx, this.text, `${this.font_size}px ${this.font}`);
        this.w = metrics.width;
        this.h = metrics.height;
        ctx.restore();
    }

    render(ctx) {
        if (!this.visible || this.text == "") return;

        ctx.save();

        // render text
        render_text(
            ctx, 
            this.x, 
            this.y + this.h, 
            this.text, 
            this.font, 
            this.font_size, 
            this.font_color, 
            this.text_align, 
            this.text_baseline
        );

        // render border
        if (this.border_size && this.border_color != "") {
            render_box(ctx, this.x, this.y, this.w, this.font_size, this.border_color, null, this.border_size);
        }

        ctx.restore();
    }
};