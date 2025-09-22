## canvas ui
very basic canvas ui thing

<p align="center">
  <img src="https://github.com/mezleca/canvas-ui/blob/main/static/showcase.png">
</p>

## TODO (if i finish the todo list inside script.js)
- [ ] webgl renderer
- [ ] flex layout
- [ ] element state transitions (hover, click... something decided by the user)

## usage
```js
// create canvas ui and layout (container)
const ui = new UI(canvas);
const layout = new DefaultLayout(800, 400);

// set layout style
layout.style.set_background_color("rgb(30, 30, 30)");
layout.style.set_border(2, "white"); // border size, color
layout.style.set_padding(10); // top, right, bottom, left

// extra layout options
layout.set_auto_resize(false, true); // width, height
layout.x = 100;
layout.y = 50;

// basic widget
const text = new TextWidget("hello im a text");

// show border around text
text.style.set_border(5, "red");

// set text style (all states)
text.style.set_font("Arial", 20, "white"); // font name, size (px), color (rgb or name)

// set text style (hover state)
text.style.set_font("Sans Serif", 20, "red", "hover"); // font name, size (px), color (rgb or name), state (default, hover, active, ...)

// add widget to layout 
layout.add(text);

// add to root
ui.add(layout);

// custom widget example
class CustomWidget extends Node {
    constructor() {
        super();
        
        // add background color for all states (default, hover, active)
        this.style.set_background_color("rgba(120, 120, 120, 1)");
        ...
    }

    // needed if width / height is not defined or updated before render
    calculate() {
        const thing = calculate_thing();
        this.w = thing.w;
        this.h = thing.h;

        // finish calculating by setting item as "not dirty"
        // that means we dont need to calculate the item anymore
        this.is_dirty = false;
    }

    // draw stuff here
    render(ctx) {
        ctx.save();
        render_box(ctx, this.x, this.y, this.w, this.h, ...);
        ctx.restore();
    }
};

// then just call layout.render on a loop
const update = (currentTime) => {
    ui.render(currentTime);
};

// start loop
requestAnimationFrame(update);
```