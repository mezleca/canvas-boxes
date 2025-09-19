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
    ctx.save();

    ctx.lineWidth = border_size;

    if (fill_color) {
        ctx.fillStyle = fill_color;
        draw_rect(ctx, x, y, w, h, radius);
        ctx.fill();
    }

    if (color) {
        ctx.strokeStyle = color;
        draw_rect(ctx, x, y, w, h, radius);
        ctx.stroke();
    }

    ctx.restore();
};

/** @param {CanvasRenderingContext2D} ctx */
export const get_text_metrics = (ctx, text, font) => {
    ctx.save();
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const text_width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const text_height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    ctx.restore();
    return { ...metrics, width: text_width, height: text_height };
};

/** @param {CanvasRenderingContext2D} ctx */
export const render_text = (ctx, x, y, text, font = "Arial", size = 16, color = "rgb(255, 255, 255)") => {
    ctx.save();
    
    ctx.font = `${size}px ${font}`;
    ctx.fillStyle = color;
    
    ctx.fillText(text, x, y);
    ctx.restore();
};