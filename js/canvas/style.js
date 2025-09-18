export const PADDING_POSITIONS = {
    "LEFT": 0,
    "TOP": 1,
    "RIGHT": 2,
    "BOTTOM": 3
};

export class StyleData {
    constructor() {
        this.border_size = 1;
        this.border_color = "";
        this.background_color = "";
        this.padding = [0, 0, 0, 0]; // top, right, bottom, left
    }

    set_background_color(value) {
        this.background_color = value;
    }

    set_border(size, color) {
        this.border_size = size;
        this.border_color = color;
    }

    set_padding(...values) {
        if (values.length === 1) {
            this.padding = [values[0], values[0], values[0], values[0]];
        } else {
            for (let i = 0; i < values.length; i++) {
                this.padding[i] = values[i];
            }
        }
    }

    set_padding_left(value) {
        this.padding[PADDING_POSITIONS.LEFT] = value;
    }

    set_padding_right(value) {
        this.padding[PADDING_POSITIONS.RIGHT] = value;
    }

    set_padding_top(value) {
        this.padding[PADDING_POSITIONS.TOP] = value;
    }

    set_padding_bottom(value) {
        this.padding[PADDING_POSITIONS.BOTTOM] = value;
    }
};