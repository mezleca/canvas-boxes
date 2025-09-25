import { Node } from "../index.js";
import { PADDING_POSITIONS } from "../style.js";
import { BaseRenderer } from "../renderer/renderer.js";

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

    /** @param {BaseRenderer} renderer */
    calculate(renderer) {
        const style = this.get_style();
        const text_metrics = renderer.measure_text(this.text, style);

        const desired_text_w = text_metrics.width * 2;
        const desired_text_h = text_metrics.height * 2;

        const pads_w = style.padding.value[PADDING_POSITIONS.LEFT] + style.padding.value[PADDING_POSITIONS.RIGHT];
        const pads_h = style.padding.value[PADDING_POSITIONS.TOP] + style.padding.value[PADDING_POSITIONS.BOTTOM];

        this.w = pads_w + desired_text_w;
        this.h = pads_h + desired_text_h;
    }

    /** @param {BaseRenderer} renderer */
    render(renderer) {
        if (!this.visible) return;

        const style = this.get_style();
        const box_id = `${this.id}_button_box_widget`;
        const text_id = `${this.id}_button_text_widget`;

        // render button box
        renderer.render_box(box_id, this.x, this.y, this.w, this.h, style);

        // render centered text
        renderer.render_text(
            text_id,
            this.x + this.w / 2,
            this.y + this.h / 2,
            this.text,
            style
        );
    }
};