export function createRenderer(renderOptions) {
    // core中不关心如何渲染
    const {
        insert: hostInsert,
        remove: hostRemove,
        createElement: hostCreateEment,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        patchProp: hostPatchProp,
    } = renderOptions;

    const render = (vnode, container) => {
        // 将虚拟节点变成真实节点
    };
    return {
        render,
    }
}

// 完全不关心render 层api，所有可以跨平台