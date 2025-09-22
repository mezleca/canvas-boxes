import { Node } from "../canvas/canvas.js";
import { get_text_metrics, render_box, render_text } from "../canvas/renderer.js";

export class TextWidget extends Node {
    constructor(text = "") {
        super();
        if (text != "") this.text = text;
        
        // set default text style
        this.style.set_font("Arial", 20, "white");
    }

    calculate(ctx) {
        ctx.save();
        const style = this.get_style();
        const metrics = get_text_metrics(ctx, this.text, style.text_align, style.text_baseline, `${style.font_size}px ${style.font}`);
        this.w = metrics.width;
        this.h = metrics.height;
        ctx.restore();

        this.is_dirty = false;
    }

    render(ctx) {
        if (!this.visible || this.text == "") return;

        const style = this.get_style();

        ctx.save();

        // render text
        render_text(
            ctx, 
            this.x, 
            this.y + this.h, 
            this.text,
            `${style.font_size}px ${style.font}`,
            style.font_color, 
            style.text_align, 
            style.text_baseline
        );

        // render border
        if (style.border_size && style.border_color != "") {
            render_box(ctx, this.x, this.y, this.w, this.h, style.border_color, null, style.border_color, style.border_radius);
        }

        ctx.restore();
    }
};