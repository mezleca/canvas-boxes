import { Node } from "../index.js";
import { BaseRenderer } from "../renderer/renderer.js";

export class ImageWidget extends Node {
    constructor(img, w, h) {
        super();
        /** @type {HTMLImageElement} */
        this.image = img;
        this.texture = null;
        this.w = w || 0;
        this.h = h || 0;
    }

    set_image(image) {
        this.image = image;
        this.mark_dirty();
    }

    /** @param {BaseRenderer} renderer */
    async render(renderer, dt) {
        if (!this.visible) {
            return;
        }

        if (this.w == 0 || this.h == 0) {
            this.w = this.image.naturalWidth || this.image.width;
            this.h = this.image.naturalHeight || this.image.height;
        }

        const style = this.get_style();
        const id = `${this.id}_image`;

        renderer.push_transform();

        if (style.rotate) {
            renderer.rotate(style.rotate);
        }

        renderer.render_image(id, this.x, this.y, this.w, this.h, this.image, style);
        renderer.pop_transform();
    }
};