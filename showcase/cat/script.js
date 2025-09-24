import { UI } from "../../js/index.js";
import { DefaultLayout } from "../../js/widgets/layout.js";
import { ButtonWidget } from "../../js/widgets/button.js";
import { ImageWidget } from "../../js/widgets/image.js";
import { CanvasRenderer } from "../../js/renderer/canvas.js";
import { TextWidget } from "../../js/widgets/text.js";

const renderer = new CanvasRenderer();
const ui = new UI(renderer);

const setup = () => {
    // create layout
    const layout = new DefaultLayout(800, 400).style
        .background_color({ r: 20, g: 20, b: 20 })
        .padding()
        .border(3, { r: 120, g: 120, b: 120 })
        .border_radius(4)
        .spacing(5).done(); // go back to widget
        
    // extra layout options
    layout.set_auto_resize(false, false); // w, h

    // custom layout position
    layout.x = 50;
    layout.y = 50;

    layout.add(new TextWidget("Hello World"));

    for (let i = 0; i < 10; i++) {
        // create button
        const button = new ButtonWidget("add cat").style
            .font("Arial", 20, { r: 255, g: 255, b: 255 })
            .border_radius(4)
            .padding(5, 10, 5, 10)
            .vertical_justify("center")
            .border_color({ r: 255, g: 255, b: 255 })
            .border_color({ r: 120, g: 120, b: 120 }, "hover")
            .done() // go back to widget
            .on_click(() => { // add cat on click
                const new_cat = create_cat(() => {
                    layout.remove(new_cat.id);
                });
                layout.add(new_cat);
            });


        layout.add(button);
    }

    // add to root
    ui.add(layout);
};

const create_cat = (cb) => {
    const img = new Image();
    img.src = "../../static/cat.png";
    const new_image = new ImageWidget(img, 100, 100);
    new_image.on("click", async () => {
        const audio = new Audio("../../static/ex.mp3");
        audio.volume = 0.01;
        if (!audio.paused) audio.pause();
        audio.play();
        cb();
    });
    return new_image;
};

(async () => {
    // initialize canvas renderer
    await ui.renderer.initialize({ 
        background: '#000000',
        width: 1024,
        height: 768
    });

    setup();

    const update = (currentTime) => {
        ui.render(currentTime);
        requestAnimationFrame(update);
    };

    // start
    requestAnimationFrame(update);
})();

