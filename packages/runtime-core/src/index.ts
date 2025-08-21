import { ShapeFlags } from "@vue/shared";

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

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            // 没有考虑子节点是文本的情况
            patch(null, children[i], container)
        }
    }

    const mountedElement = (vnode, container) => {
        const { type, children, props, shapeFlag } = vnode;
        let el = hostCreateEment(type)
        console.log(props, "111", vnode)
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
    // 多次调用render会进行虚拟节点的比较，在进行更新
    const render = (vnode, container) => {
        // 将虚拟节点变成真实节点进行渲染
        patch(container._vnode || null, vnode, container)
        container._vnode = vnode;
    };
    return {
        render,
    }
}

// 完全不关心render 层api，所有可以跨平台