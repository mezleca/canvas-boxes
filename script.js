import { Layout, UI } from "./js/canvas/canvas.js";
import { render_text } from "./js/canvas/renderer.js";
import { BoxWidget } from "./js/items/box.js";
import { ButtonWidget } from "./js/items/button.js";
import { TextWidget } from "./js/items/text.js";

const canvas = document.getElementById("canvas");

/*  TODO LIST
    - [x] layout/container
    - [x] node system
    - [x] render items on default layout mode
    - [ ] render next layout close to parent (rn is defaulting to 0,0)
    - [ ] layout scroll system
    - [ ] render items on free layout mode
    - [x] mouseup / mousedown events
    - [x] mouseover / mouseleave events
    - [x] click event
    - [x] padding for container / items
    - [x] box item
    - [ ] spacer item
    - [x] text item
    - [ ] button item
    - [ ] checkbox item
*/

const ui = new UI(canvas);
const layout = new Layout(800, 600);
const other_layout = new Layout(100, 200);

ui.add(layout);

const big_box = new BoxWidget(100, 100);

other_layout.set_border(2, "rgb(120, 30, 250)");
big_box.set_background_color("rgb(255, 255, 255)");

other_layout.add(big_box);

// main layout style
layout.set_resizable(false);
layout.set_background_color("rgb(30, 30, 30)");
layout.set_padding(10);
layout.set_border(3, "rgba(70, 70, 70, 1)");
layout.border_radius = 5;

// layout.add(other_layout);

// add x boxes
for (let i = 0; i < 0; i++) {
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
for (let i = 0; i < 5; i++) {
    const new_text = new TextWidget("text " + i);
    new_text.font_size = 24;
    layout.add(new_text);
}

// add x buttons
for (let i = 0; i < 3; i++) {
    const new_button = new ButtonWidget("hello " + i, 40, 40);
    new_button.font_size = 24;
    new_button.border_radius = 5;

    new_button.on("mouseover", () => {
        new_button.font_color = "rgb(255, 255, 255)";
        new_button.set_background_color("rgb(20, 160, 230)");
    });

    new_button.on("mouseleave", () => {
        new_button.font_color = "black";
        new_button.set_background_color("rgb(255, 255, 255)");
    });

    new_button.on("click", () => {
       alert("clicked at", i);
    });

    layout.add(new_button);
}

const update = (currentTime) => {
    ui.render();
    ui.update(currentTime);

    render_text(ui.ctx, 10, screen.height / 2, "fps: " + ui.fps, "Arial", 20, "white");
    requestAnimationFrame(update);
};

// start
requestAnimationFrame(update);