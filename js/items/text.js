import { Node } from "../canvas/canvas.js";
import { get_text_metrics, render_box, render_text } from "../canvas/renderer.js";

export class TextWidget extends Node {
    constructor(text = "") {
        super();
        if (text != "") this.text = text;

        // hack
        this.set_padding_top(10);
    }

    render(ctx) {
        if (!this.visible || this.text == "") return;

        const metrics = get_text_metrics(ctx, this.text, `${this.font_size}px ${this.font}`);

        // render text
        render_text(ctx, this.x, this.y + metrics.height, this.text, this.font, this.font_size, this.font_color);

        // render border
        if (this.border_size && this.border_color != "") {
            render_box(ctx, this.x, this.y, metrics.width, this.font_size, this.border_color, null, this.border_size);
        }

        // update width / height
        this.w = metrics.width;
        this.h = metrics.height;
    }
};