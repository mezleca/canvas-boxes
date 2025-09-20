import { Node } from "../canvas/canvas.js";
import { render_image } from "../canvas/renderer.js";

export class ImageWidget extends Node {
    constructor(img, w, h) {
        super();
        /** @type {HTMLImageElement} */
        this.image = img;
        this.w = w || 0;
        this.h = h || 0;
    }

    render(ctx, dt) {
        // attempt to get image width & height
        if (this.w == 0 || this.h == 0) {
            this.w = this.image.width || -1;
            this.h = this.image.height || -1;
        }

        // dont render invalid images
        if (this.w == -1 || this.h == -1) {
            console.log("invalid image...");
            return;
        }

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        // this.rotate += 5 * dt;

        if (this.rotate != 0) {
            ctx.rotate(this.rotate);
        }

        render_image(ctx, this.image, -this.w / 2, -this.h / 2, this.w, this.h, this.radius);
        ctx.restore();
    }
};