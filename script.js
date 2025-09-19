import { Layout, UI } from "./js/canvas/canvas.js";
import { BoxWidget } from "./js/items/box.js";
import { TextWidget } from "./js/items/text.js";

const canvas = document.getElementById("canvas");

/*  TODO LIST
    - [x] layout/container
    - [x] node system
    - [x] render items on default layout mode
    - [ ] render next layout close to parent (rn is defaulting to 0,0)
    - [ ] layout scroll system
    - [ ] render items on free layout mode
    - [ ] render items on flex layout mode
    - [ ] mouseup / mousedown events
    - [x] mouseover / mouseleave events
    - [ ] click event
    - [x] padding for container / items
    - [x] box item
    - [ ] spacer item
    - [ ] text item
    - [ ] checkbox item
*/

let lastTime;

const ui = new UI(canvas);
const layout = new Layout(300, 300);
const other_layout = new Layout(100, 200);

ui.add(layout);

const big_box = new BoxWidget(100, 100);

other_layout.set_border(2, "rgb(120, 30, 250)");
big_box.set_background_color("rgb(255, 255, 255)");

other_layout.add(big_box);

layout.set_resizable(false);
// layout.add(other_layout);

// add x boxes
for (let i = 0; i < 1; i++) {
    const size = Math.max(Math.floor(Math.random() * 50), 20);
    const box = new BoxWidget(size, size);

    const should_include_background = Math.random() * 1 > 0.5;

    // add random colors to border / background
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);

    if (!should_include_background) {
        box.set_background_color(`rgb(${r}, ${g}, ${b})`);
    }
    
    box.set_border(2, `rgb(${r}, ${g}, ${b})`);

    // other styles
    box.set_padding_bottom(10);
    box.set_padding_right(10);
    box.set_id(i);

    // event listeners
    box.on("mouseover", (data) => {
        console.log("hovering", data.id);
    });

    box.on("mouseleave", (data) => {
        console.log("leaving", data.id);
    });

    // insert on layout
    layout.add(box);
}

// add x texts
for (let i = 0; i < 50; i++) {
    const new_text = new TextWidget(i);
    new_text.font_size = 20;

    new_text.set_border(1, "rgb(150, 20, 20)");
    layout.add(new_text);
}

// layout style
layout.set_padding(10);
layout.set_border(3, "rgb(30, 150, 200)");

const update = (currentTime) => {
    if (!lastTime) {
        lastTime = currentTime;
    }

    const delta_time = currentTime - lastTime;

    // render node tree
    ui.render(delta_time);

    // next frame :D
    requestAnimationFrame(update);
};

// start
requestAnimationFrame(update);