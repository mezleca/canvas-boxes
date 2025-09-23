## canvas ui
very basic canvas ui thing

<p align="center">
  <img src="https://github.com/mezleca/canvas-ui/blob/main/static/showcase.png">
</p>

# TODO
- [x] default layout
- [x] free layout
- [x] node
- [x] node scrollbar
- [x] nodestyle
- [x] mouseup / mousedown event
- [x] mouseover / mouseleave event
- [x] mouse click event
- [x] context event
- [x] padding
- [x] horizontal_justify
- [x] vertical_justify
- [ ] "to" interpolation func
- [x] box item
- [x] spacer item
- [x] text item
- [x] align text
- [x] button item
- [x] image item
- [ ] checkbox item

## usage
```js
// create canvas ui and layout (container)
const ui = new UI(canvas);
const layout = new DefaultLayout(800, 400).style
    .background_color("rgb(20, 20, 20)")
    .padding(10)
    .border(3, "rgba(120, 120, 120, 1)")
    .border_radius(4)
    .spacing(20).done(); // go back to widget
    
// extra layout options
layout.set_auto_resize(false, true); // w, h

// custom layout position
layout.x = 50;
layout.y = 50;

// create button
const button = new ButtonWidget("add cat").style
    .font("Arial", 20, "white")
    .border_radius(4)
    .padding(15, 25, 15, 25)
    .border_color("rgb(120, 120, 120)", "hover")
    .background_color("rgb(50, 50, 50)") // default bg color
    .background_color("rgb(120, 120, 120)", "hover") // hover bg color
    .vertical_justify("center")
    .done() // go back to widget
    .on_click(() => { // add cat on click
        const new_cat = create_cat(() => {
            layout.remove(new_cat.id);
        });
        layout.add(new_cat);
    })

layout.add(button);

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
