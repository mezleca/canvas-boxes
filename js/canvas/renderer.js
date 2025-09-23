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
        ctx.fillStyle = `rgb(${fill_color.r}, ${fill_color.g}, ${fill_color.b}, ${fill_color.a / 255})`;
        ctx.fill();
    }

    if (color) {
        ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
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
    if (font) ctx.font = font;
    if (align) ctx.textAlign = align;
    if (baseline) ctx.textBaseline = baseline;
    const metrics = ctx.measureText(text);
    metrics.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    return metrics;
};

/** @param {CanvasRenderingContext2D} ctx */
export const render_text = (ctx, x, y, text, font, color, align, baseline) => {
    if (font) ctx.font = font;
    if (color) ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
    if (align) ctx.textAlign = align;
    if (baseline) ctx.textBaseline = baseline;
    
    ctx.fillText(text, x, y);
};