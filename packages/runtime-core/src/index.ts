export function createRenderer(renderOptions) {
    // core中不关心如何渲染

    const render = (vnode, container) => { };
    return {
        render,
    }
}