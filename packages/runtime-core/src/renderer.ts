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

    const mountedElement = (vnode, container, anchor) => {
        const { type, children, props, shapeFlag } = vnode;
        // let el = hostCreateElement(type)
        // 第一次渲染vnode和dom关联，vnode.el = 真实dom
        // 第二次渲染新的vnode可以和上一次比对，之后更新可以跟新对于el元素，可以后续复用这个dom元素
        let el = (vnode.el = hostCreateElement(type));
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }

        //  0001 & 1000 > 0(二进制与运算) 说明包含
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {

            hostSetElementText(el, children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el)
        }
        console.log(el)
        hostInsert(el, container, anchor);
    }

    const processElement = (n1, n2, container, anchor) => {
        if (n1 == null) { //n1即为空没有替换节点，就是只渲染
            console.log(n2, "不可能为空")
            mountedElement(n2, container, anchor)
        } else {
            patchElement(n1, n2, container)
        }
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

    const patchKeyedChildren = (cn1, cn2, el) => {
        //比较两个儿子的差异更新el
        // 用到的api  appendChild rmoveChild insertBefore
        // 首尾缩进去除相同后，减少比对范围，
        // 然后只操作剩余的

        let i = 0; //开始对比索引 (记录第几个开始不同的索引)
        let ic1 = cn1.length - 1;//第一个数组尾部索引 (减去尾部相同后的索引)
        let ic2 = cn2.length - 1;//第二个数组尾部索引 (减去尾部相同后的索引)

        while (i <= ic1 && i <= ic2) { //
            const n1 = cn1;
            const n2 = cn2;
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el) //更新当前节点的属性和儿子(递归比较)
            } else {
                break;
            }
            i++;
        }

        while (i <= ic1 && i <= ic2) {
            const n1 = cn1[ic1];
            const n2 = cn2[ic2];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el) //更新当前节点的属性和儿子(递归比较)
            } else {
                break;
            }
            ic1--;
            ic2--;
        }
        // 处理特殊情况,新数组没修改，只有增减

        if (i > ic1) { //数组新增节点
            if (i <= ic2) {
                let nextPos = ic2 + 1;//判断当前下一个元素是否存在
                let anchor = cn2[nextPos]?.el;
                while (i <= ic2) {
                    patch(null, cn2[i], el, anchor);
                    i++;
                }

            }
        } else if (i > ic2) {
            if (i <= ic1) {
                while (i <= ic1) {
                    unmountChildren(cn1[i]);
                    i++;
                }
            }
        } else {
            // 以上确认不变化的节点，处理了增删特殊情况
            // 后面特殊比对方式
            let s1 = i;
            let s2 = i;
            const keyToNewIndexMap = new Map();//做一个映射表比对，没有删除，有的方便复用
            for (let i = s2; i <= ic2; i++) {
                const vnode = cn1[i];
                const newIndex = keyToNewIndexMap.get(vnode.key)
                if (newIndex == undefined) {
                    unmount(vnode);
                } else {
                    patch(vnode, cn2[newIndex], el)
                }
            }
            //调整顺序，只能倒序插入(insertBefore)
            let toBePatched = ic2 - s2 + 1; //倒序插入个数
            for (let i = toBePatched; i <= 0; i--) {
                let newIndex = s2 + i;
                let anchor = cn2[newIndex]?.el;
                let vnode = cn2[newIndex]
                if (!vnode.el) { //全新元素插入
                    patch(null, vnode, el, anchor)
                } else {
                    hostInsert(vnode.el, el, anchor)
                }
            }
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
                patchKeyedChildren(c1, c2, el)
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

    const patchElement = (n1, n2, container, anchor = null) => {
        // 1比较元素差异,一定会复用dom
        // 2.比较属性和元素子节点
        let el = (n2.el = n1.el);
        let oldProps = n1.props || {}
        let newProps = n2.props || {}
        patchProps(oldProps, newProps, container)
        patchChildren(n1, n2, el)
    }
    //渲染和更新都走这
    const patch = (n1, n2, container, anchor = null) => {
        if (n1 === n2) { // 渲染同一个元素跳过
            return;
        }
        if (n1 && !isSameVnode(n1, n2)) {
            //暴力逻辑，去除n1节点，且n1=null继续走n2初始化挂载逻辑   
            unmount(n1); n1 = null;
        }
        // if (n1 == null) { //n1即为空没有替换节点，就是只渲染
        //     console.log(n2, "不可能为空")
        //     mountedElement(n2, container)
        // } else {
        //     patchElement(n1, n2, container, anchor)
        // }
        processElement(n1, n2, container, anchor)
    }
    const unmount = (vnode) => hostRemove(vnode.el)
    // 多次调用render会进行虚拟节点的比较，在进行更新
    const render = (vnode, container) => {
        if (vnode == null) {
            if (container._vnode) {
                unmount(container._vnode)
                //源码使用else处理 教程不知道有没有
            }
        } else {
            patch(container._vnode || null, vnode, container)
        }
        // 将虚拟节点变成真实节点进行渲染
        console.log(vnode, '我的几点')
        container._vnode = vnode;
        console.log(container, "容器")
    };
    return {
        render,
    }
}

// 完全不关心render 层api，所有可以跨平台