export const render_box = (ctx, x, y, w, h, color, border_size = 1) => {
    const old_style = ctx.strokeStyle;
    const old_line_width = ctx.lineWidth;

    if (color) {
        ctx.strokeStyle = color;
    }

    ctx.lineWidth = border_size;

    ctx.beginPath();
    ctx.moveTo(x, y);

    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y);

    // render 
    ctx.stroke();

    // reset
    ctx.strokeStyle = old_style;
    ctx.lineWidth = old_line_width;
};