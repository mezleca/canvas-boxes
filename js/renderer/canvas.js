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
    
    render_box(id, x, y, w, h, style) {
        const ctx = this.ctx;

        if (style.border_radius > 0) {
            this._draw_rounded_rect(ctx, x, y, w, h, style.border_radius);
        } else {
            ctx.beginPath();
            ctx.rect(x, y, w, h);
        }
        
        if (style.background_color) {
            const c = style.background_color;
            ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
            ctx.fill();
        }
        
        if (style.border_color && style.border_size > 0) {
            const c = style.border_color;
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
            ctx.lineWidth = style.border_size;
            ctx.stroke();
        }
    }
    
    render_text(id, x, y, text, style) {
        const ctx = this.ctx;
        
        if (style.font) ctx.font = `${style.font_size}px ${style.font}`;
        if (style.text_align) ctx.textAlign = style.text_align;
        if (style.text_baseline) ctx.textBaseline = style.text_baseline;
        
        if (style.font_color) {
            const c = style.font_color;
            ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
            ctx.fillText(text, x, y);
        }
    }

    measure_text(text, style) {
        const ctx = this.ctx;
        
        if (style.font) ctx.font = `${style.font_size}px ${style.font}`;
        if (style.text_align) ctx.textAlign = style.text_align;
        if (style.text_baseline) ctx.textBaseline = style.text_baseline;
        
        const metrics = ctx.measureText(text);
        
        return {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        };
    }
    
    render_image(id, x, y, w, h, image, style) {
        const ctx = this.ctx;
        ctx.translate(x + w / 2, y + h / 2);
        
        if (style.border_radius > 0) {
            ctx.save();
            this._draw_rounded_rect(ctx, x, y, w, h, style.border_radius);
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

    rotate(angle) {
        this.ctx.rotate(angle);
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