import { Node } from "../canvas/canvas.js";
import { render_box } from "../canvas/renderer.js";

export class BoxWidget extends Node {
    constructor(w, h) {
        super();
        this.w = w || 20;
        this.h = h || 20;
    }

    render(ctx) {
        if (!this.visible) return;
        
        // render item
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color, this.background_color, this.border_size, this.border_radius);
    }
};