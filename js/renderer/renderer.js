// you can pretty much build your own renderer using the BaseRender
// i tried to create on on top of pixi but couldn't figure out how to make text behave properly...

export class BaseRenderer {
    constructor() {
        this.cached_elements = new Map();
        this.render_queue = new Set();
    }

    initialize() { }
    clear() { }
    render_box(id, x, y, w, h, style) { }
    render_text(id, x, y, text, style) { }
    render_image(id, x, y, w, h, image, style) { }
    measure_text(text, style) { }
    set_clip(x, y, w, h) { }
    restore_clip() {  }
    push_transform() { }
    pop_transform() { }
    translate(x, y) { }
    scale(x, y) { }
    rotate(angle) { }
    
    should_render(node) {
        const cached = this.cached_elements.get(node.id);
        
        if (!cached) {
            return true;
        }

        if (node.is_dirty) {
            return true;
        }
        
        // check if position or size changed
        if (cached.x != node.x || cached.y != node.y || cached.w != node.w || cached.h != node.h) {
            return true;
        }

        // check if style state changed
        if (cached.style_state != node.style.current_state) {
            return true;
        }
        
        return false;
    }
    
    mark_rendered(node) {
        this.cached_elements.set(node.id, {
            x: node.x,
            y: node.y,
            w: node.w,
            h: node.h,
            style_state: node.style.current_state,
            rendered_at: performance.now()
        });
        
        node.is_dirty = false;
        this.render_queue.delete(node.id);
    }
    
    invalidate(node_id) {
        this.cached_elements.delete(node_id);
        this.render_queue.add(node_id);
    }
    
    cleanup_unused(active_nodes) {
        const active_ids = new Set(active_nodes.map(n => n.id));
        for (const cached_id of this.cached_elements.keys()) {
            if (!active_ids.has(cached_id)) {
                this.cached_elements.delete(cached_id);
                this.render_queue.delete(cached_id);
            }
        }
    }
};