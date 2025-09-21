/** @param {CanvasRenderingContext2D} ctx */
const draw_rect = (ctx, x, y, width, height, radius) => {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
};

/** @param {CanvasRenderingContext2D} ctx */
export const render_box = (ctx, x, y, w, h, color, fill_color, border_size = 1, radius = 0) => {
    ctx.lineWidth = border_size;
    draw_rect(ctx, x, y, w, h, radius);

    if (fill_color) {
        ctx.fillStyle = fill_color;
        ctx.fill();
    }

    if (color) {
        ctx.strokeStyle = color;
        ctx.stroke();
    }
};

/** @param {CanvasRenderingContext2D} ctx */
export const render_image = (ctx, image, x, y, w, h, r) => {
    render_box(ctx, x, y, w, h, "rgb(0,0,0,0)", "rgb(0,0,0,0)", 0, r);
    ctx.clip();
    ctx.drawImage(image, x, y, w, h);
};

/** @param {CanvasRenderingContext2D} ctx */
export const get_text_metrics = (ctx, text, align, baseline, font) => {
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    const metrics = ctx.measureText(text);
    const text_width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const text_height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    return { ...metrics, width: text_width, height: text_height };
};

/** @param {CanvasRenderingContext2D} ctx */
export const render_text = (ctx, x, y, text, font = "Arial", size = 16, color = "rgb(255, 255, 255)", align, baseline) => {
    ctx.font = `${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    
    ctx.fillText(text, x, y);
};