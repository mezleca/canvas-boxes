import { UI } from "./js/canvas/canvas.js";
import { DefaultLayout, FreeLayout } from "./js/widgets/layout.js";
import { render_text } from "./js/canvas/renderer.js";
import { BoxWidget } from "./js/widgets/box.js";
import { ButtonWidget } from "./js/widgets/button.js";
import { TextWidget } from "./js/widgets/text.js";
import { ImageWidget } from "./js/widgets/image.js";
import { Spacer } from "./js/widgets/spacer.js";

const canvas = document.getElementById("canvas");

/*  TODO LIST
    - [x] layout/container
    - [x] node system
    - [x] render items on default layout mode
    - [x] render next layout close to parent (rn is defaulting to 0,0)
    - [x] node scroll system
    - [x] basic scroll style
    - [x] dynamic scrollbar thumb height (the bigger the content the smaller it gets)
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
    - [x] image item
    - [ ] checkbox item
*/

const ui = new UI(canvas);

const setup = () => {
    const layout = new DefaultLayout(800, 400);

    // set layout style
    layout.style.set_background_color("rgb(20, 20, 20)");
    layout.style.set_padding(10);
    layout.style.set_border(3, "rgba(120, 120, 120, 1)");
    layout.style.set_border_radius(4);
    layout.style.set_spacing(20);

    // extra layout options
    layout.set_auto_resize(false, true); // w, h

    // custom layout position
    layout.x = 100;
    layout.y = 50;

    // layout.add(new Spacer("100%"));

    const button = new ButtonWidget("add cat");

    // set button style
    button.style.set_font("Arial", 20, "white");
    button.style.set_border_radius(4);
    button.style.set_padding(15, 25, 15, 25);
    button.style.set_background_color("rgb(50, 50, 50)");

    // add hover state
    button.style.set_border_color("rgb(120, 120, 120)", "hover");

    // add cat on click
    button.on("click", () => {
        const new_cat = create_cat(() => {
            console.log("removing", new_cat.id);
            layout.remove(new_cat.id);
        });
        layout.add(new_cat);
    });

    layout.add(button);

    // add to root
    ui.add(layout);
};

const create_cat = (cb) => {
    const img = new Image();
    img.src = "./static/cat.png";
    const new_image = new ImageWidget(img, 100, 100);
    new_image.on("click", async () => {
        const audio = new Audio("./static/ex.mp3");
        audio.volume = 0.01;
        if (!audio.paused) audio.pause();
        audio.play();
        cb();
    });
    return new_image;
};

setup();

const update = (currentTime) => {
    ui.render(currentTime);

    render_text(ui.ctx, 10, screen.height / 2, "fps: " + ui.fps, "Arial", 20, "white");
    requestAnimationFrame(update);
};

// start
requestAnimationFrame(update);