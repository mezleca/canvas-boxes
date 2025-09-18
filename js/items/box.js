import { Node } from "../canvas/canvas.js";
import { render_box } from "../canvas/renderer.js";

export class Box extends Node {
    constructor(w, h) {
        super();
        this.w = w || 20;
        this.h = h || 20;
    }

    render(ctx) {
        render_box(ctx, this.x, this.y, this.w, this.h, this.border_color);
    }
};