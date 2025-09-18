/** @param {CanvasRenderingContext2D} ctx */
export const render_box = (ctx, x, y, w, h, color, fill_color, border_size = 1) => {
    const old_stroke_style = ctx.strokeStyle;
    const old_line_width = ctx.lineWidth;
    const old_fill_style = ctx.fillStyle;

    ctx.lineWidth = border_size;

    if (fill_color) {
        ctx.fillStyle = fill_color;
        ctx.fillRect(x, y, w, h);
    }

    if (color) {
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, w, h);
    }

    // reset
    ctx.strokeStyle = old_stroke_style;
    ctx.fillStyle = old_fill_style;
    ctx.lineWidth = old_line_width;
};