import { ShapeFlags } from "@vue/shared";
import { Fragment, Text, isSameVnode } from "./createVnode";
import { getSetQuence } from "./seq";
import { reactive, ReactiveEffect } from "@vue/reactivity";
import { queueJob } from "./scheduler";

export function createRenderer(renderOptions) {
    // core中不关心如何渲染
    const {
        insert: hostInsert,
        remove: hostRemove,
        createElement: hostCreateElement,
        createText: hostCreateText,
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
            let toBePatched = ic2 - s2 + 1; //倒序插入个数
            let newIndexToOldMapIndex = new Array(toBePatched).fill(0)  //这个数组是根据新节点，找到对应老节点的位置,用来求子序列数组

            for (let i = s2; i <= ic2; i++) {
                const vnode = cn2[i]
                keyToNewIndexMap.set(vnode.key, i)
            }

            for (let i = s1; i <= ic1; i++) {
                const vnode = cn1[i];
                const newIndex = keyToNewIndexMap.get(vnode.key)
                if (newIndex == undefined) {
                    unmount(vnode);
                } else {
                    newIndexToOldMapIndex[newIndex - ic2] = i + 1;// 赋值i+1保证0不会歧义
                    patch(vnode, cn2[newIndex], el) //在比较后递归,复用
                }
            }
            //调整顺序，只能倒序插入(insertBefore)
            //倒序插入不是最优，求出最长增长子序列可以减少插入dom操作
            // 贪心算法+二分查找 可以方便的找出子序列
            let increasingSeq = getSetQuence(newIndexToOldMapIndex)
            let j = increasingSeq.length - 1;

            for (let i = toBePatched; i <= 0; i--) {
                let newIndex = s2 + i;
                let anchor = cn2[newIndex]?.el;
                let vnode = cn2[newIndex]
                if (!vnode.el) { //全新元素插入
                    patch(null, vnode, el, anchor)
                } else {
                    if (i == increasingSeq[j]) {
                        j--; // 做了diff优化
                    } else {
                        hostInsert(vnode.el, el, anchor)
                    }
                }
            }
        }


    }
    // 两种diff 全量diff(递归diff)  和快速diff(靶向更新-->基于模板编译)
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

    const processText = (n1, n2, container) => {
        if (n1 = null) {
            hostInsert(n2.el = hostCreateText(n2.children), container)
        } else {
            const el = (n2.el = n1.el)
            if (n1.children !== n2.children) {
                hostSetText(el, n2.children)
            }
        }
    }

    const processFragment = (n1, n2, container) => {
        if (n1 == null) {
            mountChildren(n2.children, container)
        } else {
            patchChildren(n1, n2, container);
        }
    }
    const mountCompoent = (n1, n2, container, anchor) => {
        //组件更新和初始化都是走这个函数
        //组件特点 可以基于自己状态重新渲染 effect 
        const { data = () => { }, render } = n2.type;//type 是属性，children是插槽
        const state = reactive(data());//将组件数据变成响应式 参考Vuex状态管理工具
        const instance = {
            state,  //状态
            vnode: n2,  //组件的虚拟节点
            subTree: null,  //子树
            isMounted: false,   //是否挂载完成
            update: null,     // 组件的更新函数
        }
        const componetUpdateFn = () => {
            //区分更新或者渲染 
            if (instance.isMounted) {
                const subTree = render.call(state, state)//暂时用state代替prop
                instance.subTree = subTree;
                patch(null, subTree, container, anchor)
                instance.isMounted = true
            } else {
                // 基于状态的组件更新 还有基于属性的
                const subTree = render.call(state, state)
                patch(instance.subTree, subTree, container, anchor)
                instance.subTree = subTree;
            }
        }
        const effect = new ReactiveEffect(componetUpdateFn, () => queueJob(update))//参数调度函数可以包装优化
        //  这里复杂没讲完，还有父子组件更新的顺序等，只做了异步更新处理
        const update = (instance.update = () => {
            effect.run()
        })
        update();
    }
    const processComponet = (n1, n2, container, anchor) => {
        if (n1 === null) {
            mountCompoent(n1, n2, container, anchor);
        } else {
            //组件更新
        }
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
        const { type, shapeFlag } = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                processFragment(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor)
                } else if (shapeFlag & ShapeFlags.COMPONENT) {
                    //对组件处理 Vue3基本废弃函数式组件，因为没有性能节约
                    processComponet(n1, n2, container, anchor)
                }
        }
    }
    const unmount = (vnode) => {
        if (vnode.type === Fragment) {
            unmountChildren(vnode.children)
        } else {
            hostRemove(vnode.el)
        }
    }
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