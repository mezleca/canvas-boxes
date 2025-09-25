import { Node } from "../index.js";
import { BaseRenderer } from "../renderer/renderer.js";

export class TextWidget extends Node {
    constructor(text) {
        super();
        if (text != "") this.set_text(text);
        
        // set default text style
        this.style.font("Arial", 20, { r: 255, g: 225, b: 255 });
    }

    /** @param {BaseRenderer} renderer */
    calculate(renderer) {
        const style = this.get_style();
        const metrics = renderer.measure_text(this.text, style);
        this.w = metrics.width;
        this.h = metrics.height;
    }

    /** @param {BaseRenderer} renderer */
    render(renderer) {
        if (!this.visible || this.text == "") {
            return;
        }

        const style = this.get_style();
        const text_id = `${this.id}_text`;
        const outline_id = `${this.id}_outline`;

        // render text
        renderer.render_text(
            text_id, 
            this.x, 
            this.y + this.h, 
            this.text,
            style
        );

        // render border
        if (style.border_size.value) {
            renderer.render_box(outline_id, this.x, this.y, this.w, this.h, { border_size: style.border_size, border_color: style.border_color, border_radius: style.border_radius });
        }
    }
};