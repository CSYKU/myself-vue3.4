import { ShapeFlags } from "@vue/shared";

export function createRenderer(renderOptions) {
    // core中不关心如何渲染
    const {
        insert: hostInsert,
        remove: hostRemove,
        createElement: hostCreateElement,
        setText: hostSetText,
        setElementText: hostSetElementText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        patchProp: hostPatchProp,
    } = renderOptions;

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            // 没有考虑子节点是文本的情况
            patch(null, children[i], container)
        }
    }

    const mountedElement = (vnode, container) => {
        const { type, children, props, shapeFlag } = vnode;
        // let el = hostCreateElement(type)
        // 第一次渲染vnode和dom关联，vnode.el = 真实dom
        // 第二次渲染新的vnode可以和上一次比对，之后更新可以跟新对于el元素，可以后续复用这个dom元素
        let el = (vnode.el = hostCreateElement(type));
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }

        //  0001 & 1000 > 0(二进制与运算) 说明包含
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {

            hostSetElementText(el, children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el)
        }
        console.log(el)
        hostInsert(el, container)

    }

    //渲染和更新都走这
    const patch = (n1, n2, container) => {
        if (n1 === n2) { // 渲染同一个元素跳过
            return;
        }
        if (n1 == null) { //n1即为空没有替换节点，就是只渲染
            mountedElement(n2, container)
        }
    }
    const unmount = (vnode) => hostRemove(vnode.el)
    // 多次调用render会进行虚拟节点的比较，在进行更新
    const render = (vnode, container) => {
        console.log(container, '容器')
        if (vnode == null) {
            if (container._vnode) {
                container._vnode
                console.log(container._vndoe, "移除")
                unmount(container._vnode)
            }
        }
        // 将虚拟节点变成真实节点进行渲染
        patch(container._vnode || null, vnode, container)
        console.log(vnode, '我的几点')
        container._vnode = vnode;
        console.log(container._vnode, "vndo")
    };
    return {
        render,
    }
}

// 完全不关心render 层api，所有可以跨平台