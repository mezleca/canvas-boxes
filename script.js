import { Layout, UI } from "./js/canvas/canvas.js";
import { Box } from "./js/items/box.js";

const canvas = document.getElementById("canvas");

/*  TODO LIST
    - [x] layout/container
    - [x] node system
    - [x] render items on default layout mode
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
const layout = new Layout(800, 600);

ui.add(layout);

// test
for (let i = 0; i < 20; i++) {
    const box = new Box(30, 30, Math.random() * 1 > 0.5);

    // add random colors
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);

    // other style shit
    box.set_border(2, `rgb(${r}, ${g}, ${b})`);
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

// layout style
layout.set_padding(10);
layout.set_border(3, "rgb(30, 150, 200)");

const update = (currentTime) => {
    if (!lastTime) {
        lastTime = currentTime;
    }

    // render node tree
    ui.render(currentTime - lastTime);

    // next frame :D
    requestAnimationFrame(update);
};

// start
requestAnimationFrame(update);