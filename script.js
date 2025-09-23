import { UI } from "./js/canvas/canvas.js";
import { DefaultLayout } from "./js/widgets/layout.js";
import { render_text } from "./js/canvas/renderer.js";
import { ButtonWidget } from "./js/widgets/button.js";
import { ImageWidget } from "./js/widgets/image.js";

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
    - [x] spacer item
    - [x] text item
    - [x] align text
    - [x] button item
    - [x] image item
    - [ ] checkbox item
*/

const ui = new UI(canvas);

const setup = () => {
    // create layout
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

    // render_text(ui.ctx, 10, screen.height / 2, "fps: " + ui.fps, "Arial", 20, "white");
    requestAnimationFrame(update);
};

// start
requestAnimationFrame(update);