export const PADDING_POSITIONS = {
    "TOP": 0,
    "RIGHT": 1,
    "BOTTOM": 2,
    "LEFT": 3
};

const COLOR_OBJECT = { r: 255, g: 255, b: 255, a: 255 };

class StyleProperty {
    constructor(initial_value, options = {}) {
        this._value = initial_value;
        this._default = initial_value;
        this._min = options.min;
        this._max = options.max;
        this._validator = options.validator;
        this._on_change = options.on_change || (() => {});
    }

    get value() {
        return this._value;
    }

    set value(new_value) {
        // validation
        if (this._validator && !this._validator(new_value)) {
            console.error(`invalid value for property: ${new_value}`);
            return;
        }

        // min / max
        if (typeof new_value == "number") {
            if (this._min != undefined && new_value < this._min) {
                new_value = this._min;
            }
            if (this._max != undefined && new_value > this._max) {
                new_value = this._max;
            }
        }

        const old_value = this._value;
        this._value = new_value;
        
        // notify change
        this._on_change(new_value, old_value);
    }

    reset() {
        this.value = this._default;
        return this;
    }

    animate_to(target_value, duration = 100) {
        console.log("animate_to(): todo");
        return this;
    }

    is_default() {
        return this._value == this._default;
    }

    clone() {
        const cloned = new StyleProperty(this._value, {
            min: this._min,
            max: this._max,
            validator: this._validator,
            on_change: this._on_change
        });
        return cloned;
    }
};

class ColorProperty extends StyleProperty {
    constructor(initial_color = COLOR_OBJECT, options = {}) {
        super(initial_color, {
            ...options,
            validator: (color) => {
                return color && 
                       color.r >= 0 && color.r <= 255 &&
                       color.g >= 0 && color.g <= 255 &&
                       color.b >= 0 && color.b <= 255 &&
                       color.a >= 0 && color.a <= 255;
            }
        });
    }

    /** @type {COLOR_OBJECT} */
    get value() {
        return { ...this._value };
    }

    /** @param {COLOR_OBJECT} color */
    set value(color) {
        super.value = { ...COLOR_OBJECT, ...color };
    }

    // get rgb string
    to_rgb() {
        const { r, g, b, a } = this._value;
        return `rgb(${r}, ${g}, ${b}, ${a / 255})`;
    }
};

export class StyleState {
    constructor() {
        // text
        this.text_align = new StyleProperty("left", {
            validator: (v) => ["left", "center", "right", "start", "end"].includes(v)
        });

        this.text_baseline = new StyleProperty("alphabetic", {
            validator: (v) => ["alphabetic", "top", "hanging", "middle", "ideographic", "bottom"].includes(v)
        });

        this.font = new StyleProperty("Arial");
        this.font_size = new StyleProperty(12, { min: 1, max: 1000 });
        this.font_color = new ColorProperty();

        // layout related
        this.spacing = new StyleProperty(10, { min: 0 });
        this.horizontal_justify = new StyleProperty("left", {
            validator: (v) => ["left", "center", "right"].includes(v)
        });

        this.vertical_justify = new StyleProperty("top", {
            validator: (v) => ["top", "center", "bottom"].includes(v)
        });

        // border
        this.border_size = new StyleProperty(0, { min: 0 });
        this.border_radius = new StyleProperty(0, { min: 0 });
        this.border_color = new ColorProperty({ r: 180, g: 180, b: 180, a: 120 });
        this.background_color = new ColorProperty();

        // scrollbar
        this.scrollbar_width = new StyleProperty(12, { min: 1 });
        this.scrollbar_thumb_width = new StyleProperty(12, { min: 1 });
        this.scrollbar_thumb_radius = new StyleProperty(4, { min: 0 });
        this.scrollbar_background_color = new ColorProperty({ r: 0, g: 0, b: 0, a: 0 });
        this.scrollbar_thumb_color = new ColorProperty({ r: 160, g: 160, b: 160, a: 120 });
        
        // other
        this.padding = new StyleProperty([0, 0, 0, 0], {
            validator: (v) => Array.isArray(v) && v.length == 4 && v.every(n => typeof n == "number" && n >= 0)
        });

        this.rotate = new StyleProperty(0);
    }

    copy() {
        const new_state = new StyleState();

        // clone all properties
        const keys = Object.keys(this);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (this[key] instanceof StyleProperty) {
                new_state[key] = this[key].clone();
            }
        }
        
        return new_state;
    }

    reset_all() {
        const keys = Object.keys(this);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (this[key] instanceof StyleProperty) {
                this[key].reset();
            }
        }
        
        return this;
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

        this._setup_change_listeners();
    }

    _setup_change_listeners() {
        const states_values = Object.values(this.states);
        for (let i = 0; i < states_values.length; i++) {
            const state = states_values[i];
            const state_values = Object.values(state);
            for (let j = 0; j < state_values.length; j++) {
                const prop = state_values[j];
                if (prop instanceof StyleProperty) {
                    const original_on_change = prop._on_change;
                    prop._on_change = (new_value, old_value) => {
                        this.element.is_dirty = true;
                        original_on_change(new_value, old_value);
                    };
                }
            }
        }
    }

    get current() {
        return this.get_current();
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

    _apply_to_states(property_updates, states = null) {
        const target_states = states == null 
            ? Object.values(this.states)
            : Array.isArray(states) 
                ? states.map((s) => this.states[s]).filter(Boolean)
                : [this.states[states]].filter(Boolean);

        for (let i = 0; i < target_states.length; i++) {
            const state = target_states[i];
            const entries = Object.entries(property_updates);
            for (let j = 0; j < entries.length; j++) {
                const [key, value] = entries[j];
                if (state[key] instanceof StyleProperty) {
                    if (!value) continue;
                    state[key].value = value;
                }
            }
        }

        this.element.is_dirty = true;
    }

    _update_padding_position(position, value, states = null) {
        const target_states = states == null 
            ? Object.values(this.states)
            : Array.isArray(states) 
                ? states.map((s) => this.states[s]).filter(Boolean)
                : [this.states[states]].filter(Boolean);

        for (let i = 0; i < target_states.length; i++) {
            const state = target_states[i];
            const current_padding = [...state.padding.value];
            current_padding[position] = value;
            state.padding.value = current_padding;
        }
    }

    get text_align_value() { return this.get_current().text_align.value; }
    get text_baseline_value() { return this.get_current().text_baseline.value; }
    get font_value() { return this.get_current().font.value; }
    get font_size_value() { return this.get_current().font_size.value; }
    get font_color_value() { return this.get_current().font_color.value; }
    get spacing_value() { return this.get_current().spacing.value; }
    get border_size_value() { return this.get_current().border_size.value; }
    get border_color_value() { return this.get_current().border_color.value; }
    get border_radius_value() { return this.get_current().border_radius.value; }
    get background_color_value() { return this.get_current().background_color.value; }
    get scrollbar_width_value() { return this.get_current().scrollbar_width.value; }
    get scrollbar_thumb_radius_value() { return this.get_current().scrollbar_thumb_radius.value; }
    get scrollbar_thumb_width_value() { return this.get_current().scrollbar_thumb_width.value; }
    get scrollbar_background_color_value() { return this.get_current().scrollbar_background_color.value; }
    get scrollbar_thumb_color_value() { return this.get_current().scrollbar_thumb_color.value; }
    get padding_value() { return this.get_current().padding.value; }
    get rotate_value() { return this.get_current().rotate.value; }
    get horizontal_justify_value() { return this.get_current().horizontal_justify.value; }
    get vertical_justify_value() { return this.get_current().vertical_justify.value; }

    text_align(value, states = null) {
        this._apply_to_states({ text_align: value }, states);
        return this;
    }

    text_baseline(value, states = null) {
        this._apply_to_states({ text_baseline: value }, states);
        return this;
    }

    /** @param {COLOR_OBJECT} color */
    font(font, size = null, color, states = null) {
        const props = { font };
        if (size != null) props.font_size = size;
        if (color != null) props.font_color = color;
        this._apply_to_states(props, states);
        return this;
    }

    font_size(value, states = null) {
        this._apply_to_states({ font_size: value }, states);
        return this;
    }

    /** @param {COLOR_OBJECT} value */
    font_color(value, states = null) {
        this._apply_to_states({ font_color: value }, states);
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

    /** @param {COLOR_OBJECT} color */
    border(size, color, states = null) {
        this._apply_to_states({ 
            border_size: size, 
            border_color: color
        }, states);
        return this;
    }

    border_size(value, states = null) {
        this._apply_to_states({ border_size: value }, states);
        return this;
    }

    /** @param {COLOR_OBJECT} value */
    border_color(value, states = null) {
        console.log("trying to update border", value);
        this._apply_to_states({ border_color: value }, states);
        return this;
    }

    border_radius(value, states = null) {
        this._apply_to_states({ border_radius: value }, states);
        return this;
    }

    /** @param {COLOR_OBJECT} value */
    background_color(value, states = null) {
        this._apply_to_states({ background_color: value }, states);
        return this;
    }

    /** @param {COLOR_OBJECT} value */
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

    scrollbar_thumb_radius(value, states = null) {
        this._apply_to_states({ scrollbar_thumb_radius: value }, states);
        return this;
    }

    /** @param {COLOR_OBJECT} value */
    scrollbar_background_color(value, states = null) {
        this._apply_to_states({ scrollbar_background_color: value }, states);
        return this;
    }

    scrollbar_thumb_color(value, states = null) {
        this._apply_to_states({ scrollbar_thumb_color: value }, states);
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
        // temp
        if (Array.isArray(values) && values.length == 0) return this;
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