import { Node } from "../canvas/canvas.js";
import { PADDING_POSITIONS } from "../canvas/style.js";

// spacer: fill rows, make custom spaces between items, etc...  
export class Spacer extends Node {
    constructor(ammount) {
        super();
        this.ammount = typeof ammount == "number" ? ammount : "100%";
        this.is_ghost = true;
    }

    _parse_ammount() {
        if (!this.ammount) return;

        if (typeof this.ammount == "number") {
            return { type: "number", value: this.ammount };
        } else if (this.ammount.includes("%")) {
            const value = Number(this.ammount.split("%")[0]);
            return { type: "percentage", value: value };
        }

        return false;
    }

    calculate(ctx) {
        const data = this._parse_ammount();

        if (!data) {
            return;
        }

        const parent_style = this.parent?.get_style();
        const l_pl = parent_style ? parent_style.padding[PADDING_POSITIONS.LEFT] : 0;
        const l_pr = parent_style ? parent_style.padding[PADDING_POSITIONS.RIGHT] : 0;

        switch (data.type) {
            case "number": {
                this.w = data.value;
                console.log("number", this.w);
                break;
            }
            case "percentage": {
                const bounds = this.get_parent_bounds(); 
                const cw = bounds.w - l_pl - l_pr;
                this.w = cw / 100 * data.value;
                console.log("percentage", cw / 100 * data.value);
                break;
            }
        }
    }

    render(ctx) { }
};