import { ShapeFlags } from "@vue/shared";
import { isSameVnode } from "./createVnode";

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

    const patchProps = (oldProps, newProps, el) => {
        for (let key in newProps) {
            hostPatchProp(el, key, oldProps[key], newProps[key])
        }
        for (let key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null)
            }
        }

    }
    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            unmount(child);
        }
    }

    const patchChildren = (oldChildren, newChildern, el) => {
        const c1 = oldChildren.children;
        const c2 = newChildern.children;
        const prevShapeFlag = c1.shapeFlag;
        const shapeFlag = c2.shapeFlag;
        // 0.(新,老) ---处理--> (处理)
        // 1.(文本, 数组)---->(移除老的)
        // 2.(文本, 文本)---->(替换)
        // 3.(数组, 数组)---->(全量diff)
        // 4.(非数组,数组)---->(移除老的)
        // 5.(空  ,文本)----->(替换/移除老的)
        // 6.(数组,文本)---->()
        //
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1)
            }
            if (c1 !== c2) {
                hostSetElementText(el, c2)
            }
        }
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                //全量diff数组
            } else {
                unmountChildren(c1);
            }
        } else {
            hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            mountChildren(c2, el)
        }

    }

    const patchElement = (n1, n2, container) => {
        // 1比较元素差异,一定会复用dom
        // 2.比较属性和元素子节点
        let el = (n2.el = n1.el);
        let oldProps = n1.props || {}
        let newProps = n2.props || {}
        patchProps(oldProps, newProps, container)
        patchChildren(n1, n2, el)
    }
    //渲染和更新都走这
    const patch = (n1, n2, container) => {
        if (n1 === n2) { // 渲染同一个元素跳过
            return;
        }
        if (n1 && isSameVnode(n1, n2)) {
            //暴力逻辑，去除n1节点，且n1=null继续走n2初始化挂载逻辑   
            unmount(n1); n1 = null;
        }
        if (n1 == null) { //n1即为空没有替换节点，就是只渲染
            mountedElement(n2, container)
        } else {
            patchElement(n1, n2, container)
        }
    }
    const unmount = (vnode) => hostRemove(vnode.el)
    // 多次调用render会进行虚拟节点的比较，在进行更新
    const render = (vnode, container) => {
        if (vnode == null) {
            if (container._vnode) {
                unmount(container._vnode)
            }
        }
        // 将虚拟节点变成真实节点进行渲染
        patch(container._vnode || null, vnode, container)
        container._vnode = vnode;
        console.log(vnode, '我的几点')
        console.log(container, "容器")
    };
    return {
        render,
    }
}

// 完全不关心render 层api，所有可以跨平台