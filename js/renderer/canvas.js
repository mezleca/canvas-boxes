import { NodeStyle, StyleState } from "../style.js";
import { BaseRenderer } from "./renderer.js";

export class CanvasRenderer extends BaseRenderer {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
    }

    initialize(settings) {
        const new_canvas = document.createElement("canvas");
        new_canvas.width = settings.width || 800;
        new_canvas.height = settings.height || 800;
        new_canvas.style.background = settings.background || "black";
        this.canvas = new_canvas;
        this.ctx = new_canvas.getContext("2d");
        document.body.appendChild(new_canvas);
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /** @param {StyleState} style */
    render_box(id, x, y, w, h, style) {
        const ctx = this.ctx;

        if (style.border_radius.value > 0) {
            this._draw_rounded_rect(ctx, x, y, w, h, style.border_radius.value);
        } else {
            ctx.beginPath();
            ctx.rect(x, y, w, h);
        }
        
        if (style.background_color.value) {
            const c = style.background_color.value;
            ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
            ctx.fill();
        }
        
        if (style.border_color.value && style.border_size.value > 0) {
            const c = style.border_color.value;
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
            ctx.lineWidth = style.border_size.value;
            ctx.stroke();
        }
    }
    
    /** @param {StyleState} style */
    render_text(id, x, y, text, style) {
        const ctx = this.ctx;
        
        if (style?.font.value) ctx.font = `${style.font_size.value}px ${style.font.value}`;
        if (style?.text_align.value) ctx.textAlign = style.text_align.value;
        if (style?.text_baseline.value) ctx.textBaseline = style.text_baseline.value;
        
        if (style?.font_color) {
            const c = style?.font_color.value;
            ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
            ctx.fillText(text, x, y);
        }
    }

    /** @param {StyleState} style */
    measure_text(text, style) {
        const ctx = this.ctx;
        
        if (style?.font.value) ctx.font = `${style.font_size.value}px ${style.font.value}`;
        if (style?.text_align.value) ctx.textAlign = style.text_align.value;
        if (style?.text_baseline.value) ctx.textBaseline = style.text_baseline.value;
        
        const metrics = ctx.measureText(text);
        
        return {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        };
    }
    
    /** @param {StyleState} style */
    render_image(id, x, y, w, h, image, style) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        if (style.rotate.value > 0) {
            const deg = style.rotate.value * Math.PI / 180;
            ctx.rotate(deg);
        }
        
        if (style?.border_radius.value > 0) {
            ctx.save();
            this._draw_rounded_rect(ctx, x, y, w, h, style.border_radius.value);
            ctx.clip();
        }
        
        ctx.drawImage(image, -w / 2, -h / 2, w, h);
        ctx.restore();
    }
    
    set_clip(x, y, w, h) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.clip();
    }
    
    restore_clip() {
        this.ctx.restore();
    }

    push_transform() {
        this.ctx.save();
    }

    pop_transform() {
        this.ctx.restore();
    }

    translate(x, y) {
        this.ctx.translate(x, y);
    }

    scale(x, y = x) {
        this.ctx.scale(x, y);
    }
    
    _draw_rounded_rect(ctx, x, y, w, h, radius) {
        if (w < 2 * radius) radius = w / 2;
        if (h < 2 * radius) radius = h / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }
};