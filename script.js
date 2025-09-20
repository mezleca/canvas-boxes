import { UI } from "./js/canvas/canvas.js";
import { Layout } from "./js/widgets/layout.js";
import { render_text } from "./js/canvas/renderer.js";
import { BoxWidget } from "./js/widgets/box.js";
import { ButtonWidget } from "./js/widgets/button.js";
import { TextWidget } from "./js/widgets/text.js";
import { ImageWidget } from "./js/widgets/image.js";

const canvas = document.getElementById("canvas");

/*  TODO LIST
    - [x] layout/container
    - [x] node system
    - [x] render items on default layout mode
    - [x] render next layout close to parent (rn is defaulting to 0,0)
    - [x] node scroll system
    - [x] basic scroll style
    - [ ] dynamic scroll size (the bigger the content the smaller it gets)
    - [x] render items on free layout mode
    - [x] mouseup / mousedown events
    - [x] mouseover / mouseleave events
    - [x] click event
    - [x] padding for container / items
    - [ ] align_x (layout)
    - [ ] align_y (layout)
    - [x] box item
    - [ ] spacer item (occupies whole row or space defined by the user)
    - [x] text item
    - [x] align text
    - [x] button item
    - [ ] image item
    - [ ] checkbox item
*/

const ui = new UI(canvas);
const layout = new Layout(800, 300);

ui.add(layout);

const big_box = new BoxWidget(100, 100);

big_box.set_background_color("rgb(255, 255, 255)");

// main layout style
layout.set_resizable(false);
layout.set_background_color("rgb(30, 30, 30)");
layout.set_padding(10);
layout.set_border(3, "rgba(70, 70, 70, 1)");
layout.border_radius = 5;

layout.x = 150;
layout.y = 100;

// layout.add(other_layout);

// add x boxes
for (let i = 0; i < 5; i++) {
    const size = 50;
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

const add_button = (text, click) => {
    const new_button = new ButtonWidget(text, 40, 40);
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

    if (click) new_button.on("click", click);

    layout.add(new_button);
};

// add x buttons
for (let i = 0; i < 5; i++) {
    add_button(`hello ${i}`);
}

add_button("add exp cat", () => {
    add_cat();
});

const add_cat = () => {
    const img = new Image();
    img.src = "./static/cat.png";
    const new_image = new ImageWidget(img, 100, 100);
    new_image.on("click", async () => {
        const audio = new Audio("./static/ex.mp3");
        audio.volume = 0.01;
        if (!audio.paused) audio.pause();
        audio.play();
        layout.remove(new_image.id);
    });
    layout.add(new_image);
};  

// add x images
for (let i = 0; i < 0; i++) {
    add_cat();
}

const update = (currentTime) => {
    ui.render(currentTime);

    render_text(ui.ctx, 10, screen.height / 2, "fps: " + ui.fps, "Arial", 20, "white");
    requestAnimationFrame(update);
};

// start
requestAnimationFrame(update);