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
// create canvas ui
const ui = new UI(canvas);

// create a new layout to store items (aka container)
const layout = new Layout(width, height);

// basic widget
const text = new TextWidget("mhm");

// custom widget example
class CustomWidget extends Node {
    constructor() {
        super();
        
        // add default style to widget (check styles.js for all possible values)
        this.background_color = "rgb(120, 120, 120)";
        ...
    }

    // needed if width / height is not defined or updated before render
    calculate() {
        const thing = calculate_thing();
        this.w = thing.w;
        this.h = thing.h;
    }

    // draw stuff here
    render(ctx) {
        render_box(ctx, this.x, this.y, this.w, this.h, ...);
    }
};

// set layout style
layout.set_background_color("rgb(30, 30, 30)");
layout.set_border(2, "white"); // border size, color
layout.set_padding(10); // top, right, bottom, left

// set text style
text.font_size = 20; // px
text.font_color = "red"; // you can also use hex colors or whatever its called and rgb

// add widget to layout 
layout.add(text);

// add layout to ui
ui.add(layout);

// then just call layout.render on a loop
const update = (currentTime) => {
    ui.render(currentTime);
};

// start loop
requestAnimationFrame(update);
```