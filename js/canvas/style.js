export const PADDING_POSITIONS = {
    "TOP": 0,
    "RIGHT": 1,
    "BOTTOM": 2,
    "LEFT": 3
};

const DEFAULT_COLOR_OBJECT = { r: 255, g: 255, b: 255, a: 255 };

export class StyleState {
    constructor() {
        // text
        this.text_align = "left";
        this.text_baseline = "alphabetic";
        this.font = "Arial";
        this.font_size = 12;
        this.font_color = DEFAULT_COLOR_OBJECT;

        // layout related
        this.spacing = 10;
        this.horizontal_justify = "left";
        this.vertical_justify = "top";

        this.border_size = 1;
        this.border_radius = 0;
        this.border_color = { r: 120, g: 120, b: 120, a: 120 };
        this.background_color = DEFAULT_COLOR_OBJECT;

        // scrollbar
        this.scrollbar_width = 12;
        this.scrollbar_thumb_width = 12;
        this.scrollbar_background_color = { r: 0, g: 0, b: 0, a: 0 };
        this.scrollbar_thumb_color = { r: 160, g: 160, b: 160, a: 120 };
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
    constructor(element) {
        this.states = {
            default: new StyleState(),
            hover: new StyleState(),
            active: new StyleState(),
            disabled: new StyleState()
        };
        this.current_state = "default";
        this.element = element;
    }

    done() {
        this.element.is_dirty = true;
        return this.element;
    }

    get_current() {
        return this.states[this.current_state] || this.states.default;
    }

    set_current_state(state_name) {
        if (this.states[state_name]) {
            this.current_state = state_name;
        }
        return this;
    }

    get current() {
        return this.get_current();
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

        this.element.is_dirty = true;
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
    
    get text_align_value() { return this.get_current().text_align; }
    get text_baseline_value() { return this.get_current().text_baseline; }
    get font_value() { return this.get_current().font; }
    get font_size_value() { return this.get_current().font_size; }
    get font_color_value() { return this.get_current().font_color; }
    get spacing_value() { return this.get_current().spacing; }
    get border_size_value() { return this.get_current().border_size; }
    get border_color_value() { return this.get_current().border_color; }
    get border_radius_value() { return this.get_current().border_radius; }
    get background_color_value() { return this.get_current().background_color; }
    get scrollbar_width_value() { return this.get_current().scrollbar_width; }
    get scrollbar_thumb_width_value() { return this.get_current().scrollbar_thumb_width; }
    get scrollbar_height_value() { return this.get_current().scrollbar_height; }
    get scrollbar_color_value() { return this.get_current().scrollbar_color; }
    get scrollbar_background_color_value() { return this.get_current().scrollbar_background_color; }
    get scrollbar_thumb_color_value() { return this.get_current().scrollbar_thumb_color; }
    get padding_value() { return this.get_current().padding; }
    get rotate_value() { return this.get_current().rotate; }
    get horizontal_justify_value() { return this.get_current().horizontal_justify; }
    get vertical_justify_value() { return this.get_current().vertical_justify; }

    text_align(value, states = null) {
        this._apply_to_states({ text_align: value }, states);
        return this;
    }

    text_baseline(value, states = null) {
        this._apply_to_states({ text_baseline: value }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} color */
    font(font, size = null, color, states = null) {
        const props = { font };
        if (size != null) props.font_size = size;
        if (color != null) props.font_color = { ...DEFAULT_COLOR_OBJECT, ...color };
        this._apply_to_states(props, states);
        return this;
    }

    font_size(value, states = null) {
        this._apply_to_states({ font_size: value }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} value */
    font_color(value, states = null) {
        this._apply_to_states({ font_color: { ...DEFAULT_COLOR_OBJECT, ...value } }, states);
        return this;
    }

    spacing(value, states = null) {
        this._apply_to_states({ spacing: value }, states);
        return this;
    }

    rotate(value, states = null) {
        this._apply_to_states({ rotate: value }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} color */
    border(size, color, states = null) {
        this._apply_to_states({ 
            border_size: size, 
            border_color: { ...DEFAULT_COLOR_OBJECT, ...color }
        }, states);
        return this;
    }

    border_size(value, states = null) {
        this._apply_to_states({ border_size: value }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} value */
    border_color(value, states = null) {
        console.log("setting border", value, states);
        this._apply_to_states({ border_color: { ...DEFAULT_COLOR_OBJECT, ...value } }, states);
        return this;
    }

    border_radius(value, states = null) {
        this._apply_to_states({ border_radius: value }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} value */
    background_color(value, states = null) {
        this._apply_to_states({ background_color: { ...DEFAULT_COLOR_OBJECT, ...value } }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} value */
    background(value, states = null) {
        return this.background_color(value, states);
    }

    scrollbar_width(value, states = null) {
        this._apply_to_states({ scrollbar_width: value }, states);
        return this;
    }

    scrollbar_thumb_width(value, states = null) {
        this._apply_to_states({ scrollbar_thumb_width: value }, states);
        return this;
    }

    scrollbar_height(value, states = null) {
        this._apply_to_states({ scrollbar_height: value }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} value */
    scrollbar_color(value, states = null) {
        this._apply_to_states({ scrollbar_color: { ...DEFAULT_COLOR_OBJECT, ...value } }, states);
        return this;
    }

    /** @param {DEFAULT_COLOR_OBJECT} value */
    scrollbar_background_color(value, states = null) {
        this._apply_to_states({ scrollbar_background_color: { ...DEFAULT_COLOR_OBJECT, ...value } }, states);
        return this;
    }

    scrollbar_thumb_color(value, states = null) {
        this._apply_to_states({ scrollbar_thumb_color: { ...DEFAULT_COLOR_OBJECT, ...value } }, states);
        return this;
    }

    horizontal_justify(value, states = null) {
        this._apply_to_states({ horizontal_justify: value }, states);
        return this;
    }

    vertical_justify(value, states = null) {
        this._apply_to_states({ vertical_justify: value }, states);
        return this;
    }

    padding(...values) {
        const padding = values.length == 1 
            ? [values[0], values[0], values[0], values[0]]
            : values;
        this._apply_to_states({ padding: [...padding] });
        return this;
    }

    padding_left(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.LEFT, value, states);
        return this;
    }

    padding_right(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.RIGHT, value, states);
        return this;
    }

    padding_top(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.TOP, value, states);
        return this;
    }

    padding_bottom(value, states = null) {
        this._update_padding_position(PADDING_POSITIONS.BOTTOM, value, states);
        return this;
    }
};