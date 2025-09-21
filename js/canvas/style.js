export const PADDING_POSITIONS = {
    "TOP": 0,
    "RIGHT": 1,
    "BOTTOM": 2,
    "LEFT": 3
};

export class StyleState {
    constructor() {
        this.text_align = "left";
        this.text_baseline = "alphabetic";
        this.font = "Arial";
        this.font_size = 12;
        this.font_color = "rgb(255,255,255)";
        this.spacing = 10;
        this.border_size = 1;
        this.border_radius = 0;
        this.border_color = "";
        this.background_color = "";
        this.scrollbar_width = 12;
        this.scrollbar_height = 24;
        this.scrollbar_color = "rgba(187, 187, 187, 0.8)";
        this.scrollbar_background_color = "rgb(120, 120, 120, 0.3)";
        this.padding = [0, 0, 0, 0]; // top, right, bottom, left
        this.rotate = 0;
    }

    copy() {
        const new_state = new StyleState();
        Object.assign(new_state, this);
        new_state.padding = [...this.padding];
        return new_state;
    }
};

export class NodeStyle {
    constructor() {
        this.states = {
            default: new StyleState(),
            hover: new StyleState(),
            active: new StyleState(),
            disabled: new StyleState()
        };
        this.current_state = "default";
    }

    get_current() {
        return this.states[this.current_state] || this.states.default;
    }

    set_current_state(state_name) {
        if (this.states[state_name]) {
            this.current_state = state_name;
        }
    }

    _apply_to_states(properties, states = null) {
        if (states == null) {
            Object.values(this.states).forEach((state) => Object.assign(state, properties));
        } else if (Array.isArray(states)) {
            for (const state of states) {
                if (this.states[state]) {
                    Object.assign(this.states[state], properties);
                }
            }
        } else {
            if (this.states[states]) {
                Object.assign(this.states[states], properties);
            }
        }
    }

    _update_padding_position(position, value, states = null) {
        const update = (state) => {
            state.padding[position] = value;
        };

        if (states == null) {
            Object.values(this.states).forEach(update);
        } else if (Array.isArray(states)) {
            for (const state of states) {
                if (this.states[state]) {
                    update(this.states[state]);
                }
            }
        } else {
            if (this.states[states]) {
                update(this.states[states]);
            }
        }
    }

    set_text_align(value, states = null) {
        this._apply_to_states({ text_align: value }, states);
    }

    set_text_baseline(value, states = null) {
        this._apply_to_states({ text_baseline: value }, states);
    }

    set_font(font, size = null, color = null, states = null) {
        const props = { font };
        if (size != null) props.font_size = size;
        if (color != null) props.font_color = color;
        this._apply_to_states(props, states);
    }

    set_font_size(value, states = null) {
        this._apply_to_states({ font_size: value }, states);
    }

    set_font_color(value, states = null) {
        this._apply_to_states({ font_color: value }, states);
    }

    set_spacing(value, states = null) {
        this._apply_to_states({ spacing: value }, states);
    }

    set_rotate(value, states = null) {
        this._apply_to_states({ rotate: value }, states);
    }

    set_border(size, color, states = null) {
        this._apply_to_states({ 
            border_size: size, 
            border_color: color 
        }, states);
    }

    set_border_size(value, states = null) {
        this._apply_to_states({ border_size: value }, states);
    }

    set_border_color(value, states = null) {
        this._apply_to_states({ border_color: value }, states);
    }

    set_border_radius(value, states = null) {
        this._apply_to_states({ border_radius: value }, states);
    }

    set_background_color(value, states = null) {
        this._apply_to_states({ background_color: value }, states);
    }

    set_scrollbar_width(value, states = null) {
        this._apply_to_states({ scrollbar_width: value }, states);
    }

    set_scrollbar_height(value, states = null) {
        this._apply_to_states({ scrollbar_height: value }, states);
    }

    set_scrollbar_color(value, states = null) {
        this._apply_to_states({ scrollbar_color: value }, states);
    }

    set_scrollbar_background_color(value, states = null) {
        this._apply_to_states({ scrollbar_background_color: value }, states);
    }

    set_padding(...values) {
        const padding = values.length == 1 
            ? [values[0], values[0], values[0], values[0]]
            : values;
        this._apply_to_states({ padding: [...padding] });
    }

    set_padding_left(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.LEFT, value, states);
    }

    set_padding_right(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.RIGHT, value, states);
    }

    set_padding_top(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.TOP, value, states);
    }

    set_padding_bottom(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.BOTTOM, value, states);
    }
};