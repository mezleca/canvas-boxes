import { UI } from "../../js/index.js";
import { DefaultLayout } from "../../js/widgets/layout.js";
import { BoxWidget } from "../../js/widgets/box.js";
import { CanvasRenderer } from "../../js/renderer/canvas.js";

const renderer = new CanvasRenderer();
const ui = new UI(renderer);

const setup = () => {
    // create layout
    const layout = new DefaultLayout(400, 200).style
        .background_color({ r: 50, g: 50, b: 50 })
        .padding(10)
        .border(3, { r: 120, g: 120, b: 120 })
        .border_radius(4)
        .spacing(20).done(); // go back to widget
        
    // extra layout options
    layout.set_auto_resize(false, true); // w, h

    // custom layout position
    layout.x = 50;
    layout.y = 50;

    setInterval(() => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        const box = new BoxWidget(50, 50).style
            .background({ r, g, b })
            .border_radius(Math.floor(Math.random() * 10)).done();

        layout.add(box);
    }, 1);

    // add to root
    ui.add(layout);
};

(async () => {
    // initialize canvas renderer
    await ui.renderer.initialize({ 
        background: '#000000',
        width: 1920,
        height: 1080
    });

    setup();

    const update = (currentTime) => {
        ui.render(currentTime);
        requestAnimationFrame(update);
    };

    // start
    requestAnimationFrame(update);
})();