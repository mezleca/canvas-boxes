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

        const style = this.get_style();
        
        // render item
        render_box(
            ctx, 
            this.x, 
            this.y, 
            this.w, 
            this.h, 
            style.border_color, 
            style.background_color, 
            style.border_size, 
            style.border_radius, 
            this.has_overflow
        );
    }
};