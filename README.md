## canvas ui
very basic ui using canvas

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
            // custom shit here
        }

        render() {
            // render your shit here
        }
    }

    // set layout style
    layout.set_background_color("rgb(30, 30, 30)");
    layout.set_border(2, "white"); // border size, color
    layout.set_padding(10); // top, right, bottom, left
    
    // set text style
    text.font_size = 20;
    text.font_color = "red";

    // add widget to layout 
    layout.add(text);

    // then just call layout.render on a loop
```