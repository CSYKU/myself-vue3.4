import { ShapeFlags } from "@vue/shared";

export const Teleport = {  //只是简单模拟，还有其他许多
    __isTeleport: true,
    remove(vnode, unmountChildren) {  
        const { children, shapeFlag } = vnode;
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(children);
        }
    },
    process(n1, n2, container, anchor, parentCompoent, internals) {
        let { mountChildren, patchChildren, move } = internals;
        if (!n1) {
            const target = n2.target = document.querySelector(n2.props.to)
            if (target) {
                mountChildren(n2.children, target, parentCompoent)
            }
        } else {
            patchChildren(n1, n2, n2.target, parentCompoent)
            if (n2.props.to != n1.props.to) {
                const nextTarget = n2.porps.to
                n2.children.forEach((child) => move(child, nextTarget, anchor))
            }
        }

    }
}

export const isTeleport = (value) => value.__isTeleport