import { Node } from "../index.js";
import { BaseRenderer } from "../renderer/renderer.js";

export class BoxWidget extends Node {
    constructor(w, h) {
        super();
        this.w = w || 20;
        this.h = h || 20;
    }

    /** @param {BaseRenderer} renderer */
    render(renderer, dt) {
        if (!this.visible) return;

        const style = this.get_style();
        const box_id = `${this.id}_box_widget`;
        
        // render item
        renderer.render_box(
            box_id,
            this.x, 
            this.y, 
            this.w, 
            this.h,
            style
        );
    }
};