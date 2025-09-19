import { Node } from "../canvas/canvas.js";
import { render_box, render_text } from "../canvas/renderer.js";
import { PADDING_POSITIONS } from "../canvas/style.js";

export class TextWidget extends Node {
    constructor(text = "") {
        super();
        if (text != "") this.text = text;

        // hack
        this.set_padding_top(10);
    }

    render(ctx) {
        if (!this.visible || this.text == "") return;
        
        // render text
        const size = render_text(ctx, this.x, this.y, this.text, this.font, this.font_size, this.font_color);

        // render border
        if (this.border_size && this.border_color != "") {
            const padding_top = this.padding[PADDING_POSITIONS.TOP];

            // HACK WARNING!!!!!!!!!!!!!!!
            render_box(ctx, this.x, this.y - padding_top - 5, size.width, this.font_size, this.border_color, null, this.border_size);
        }

        // update width / height
        this.w = size.width;
        this.h = this.font_size;
    }
};