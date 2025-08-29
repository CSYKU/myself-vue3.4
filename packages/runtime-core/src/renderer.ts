import { hasOwn, ShapeFlags } from "@vue/shared";
import { Fragment, Text, isSameVnode } from "./createVnode";
import { getSetQuence } from "./seq";
import { isRef, reactive, ReactiveEffect } from "@vue/reactivity";
import { queueJob } from "./scheduler";
import { createComponetInstance, setupCompoent } from "./compent";
import { invokArray } from "./apiLifecycle";

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

    const mountChildren = (children, container, parentComponent) => {
        for (let i = 0; i < children.length; i++) {
            // 没有考虑子节点是文本的情况
            patch(null, children[i], container, parentComponent)
        }
    }

    const mountElement = (vnode, container, anchor, parentComponent) => {
        const { type, children, props, shapeFlag, transition } = vnode;
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
            mountChildren(children, el, parentComponent)
        }
        hostInsert(el, container, anchor);
        if (transition) {
            transition.enter(el)
        }
    }

    const processElement = (n1, n2, container, anchor, parentComponent) => {
        if (n1 == null) { //n1即为空没有替换节点，就是只渲染
            mountElement(n2, container, anchor, parentComponent)
        } else {
            patchElement(n1, n2, container, parentComponent)
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
    const patchChildren = (oldChildren, newChildern, el, parentComponent) => {
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
            mountChildren(c2, el, parentComponent)
        }

    }

    const patchElement = (n1, n2, container, parentComponent) => {
        // 1比较元素差异,一定会复用dom
        // 2.比较属性和元素子节点
        let el = (n2.el = n1.el);
        let oldProps = n1.props || {}
        let newProps = n2.props || {}
        patchProps(oldProps, newProps, container)
        patchChildren(n1, n2, el, parentComponent)
    }

    const processText = (n1, n2, container) => {
        if (n1 == null) {
            hostInsert(n2.el = hostCreateText(n2.children), container)
        } else {
            const el = (n2.el = n1.el)
            if (n1.children !== n2.children) {
                hostSetText(el, n2.children)
            }
        }
    }
    const hasPropChange = (prevProps, nextProps) => {
        let nKeys = Object.keys(nextProps)
        if (nKeys.length !== Object.keys(prevProps).length) return true;
        for (let i = 0; i < nKeys.length; i++) {
            const key = nKeys[i]
            if (nextProps[key] !== prevProps[key])
                return true;
        }
        return false;
    }

    const processFragment = (n1, n2, container, parentComponent) => {
        if (n1 == null) {
            mountChildren(n2.children, container, parentComponent)
        } else {
            patchChildren(n1, n2, container, parentComponent);
        }
    };
    const updataProps = (instance, prevProps, nextProps) => {
        // 比对props差异后更新实例的props
        if (hasPropChange(prevProps, nextProps)) {
            for (let key in nextProps) {
                instance.props[key] = nextProps[key];
            }
            for (let key in instance.props) {
                if (!(key in nextProps)) {
                    delete instance.props[key];
                }
            }
        }

    }
    const shuoldComponetUpdate = (n1, n2) => { // 选择是否触发更新，将属性更新合并进去
        const { prosp: prevProps, children: prevChildren } = n1;
        const { prosp: nextProps, children: nextChildren } = n2;
        if (prevChildren || nextChildren) return true;//加上插槽的判断
        if (prevProps === nextProps) return false; // 可以优化比对默认有插槽一定更新
        return hasPropChange(prevProps, nextProps)
    }
    const updataComponet = (n1, n2) => {
        // 不能直接patch 死循环
        const instance = (n2.compoent = n1.compoent) // 复用组件实例 就是复用dom元素，相当于虚拟节点的el,html的真实元素
        if (shuoldComponetUpdate(n1, n2)) {
            instance.next = n2; // 添加next属性 如果存在说明是属性或插槽更新  不存在则为状态更新
            instance.updata()
        }

        // const { prosp: prevProps } = n1;
        // const { prosp: nextProps } = n2;
        // updataProps(instance, prevProps, nextProps) // children 里的slots也能触发更新
    }
    const updataComponetPreRender = (instance, next) => {
        instance.next = null;
        // 换instance的vnode和props
        instance.vnode = next // instance.props
        updataProps(instance, instance.props, instance.next.props)
        //更新合并新老插槽
        Object.assign(instance.slots, next.children)

    }
    function renderComputent(instance) { //源码在初始化时区分的
        const { render, vnode, props, proxy, attrs } = instance
        if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
            return render.call(proxy, proxy)
        } else {
            return vnode.type(attrs)
        }
    }
    function setupRenderEffect(instance, container, anchor, parentComponent) {
        const { render } = instance;
        const componetUpdateFn = () => {
            //区分更新或者渲染 
            if (!instance.isMounted) {
                const { bm, m } = instance;
                if (bm) {
                    invokArray(bm);
                }
                //  暂时用state代替prop 
                // subTree就是要渲染的vnode patch的n1和n2
                const subTree = renderComputent(instance);
                patch(null, subTree, container, anchor, instance)
                instance.isMounted = true;
                instance.subTree = subTree;
                if (m) {
                    invokArray(m);
                }
            } else {
                // 基于状态的组件更新 还有基于属性的
                const { next, bu, u } = instance;
                if (next) {
                    // 跟新属性和插槽
                    updataComponetPreRender(instance, next)
                }
                if (bu) {
                    invokArray(bu);
                }
                const subTree = renderComputent(instance);
                patch(instance.subTree, subTree, container, anchor, instance)
                instance.subTree = subTree;
                if (u) {
                    invokArray(u);
                }
            }
        }
        //参数调度函数可以包装优化
        const effect = new ReactiveEffect(componetUpdateFn, () => queueJob(update))//() => updata()
        //  这里复杂没讲完，还有父子组件更新的顺序等，只做了异步更新处理
        const update = (instance.update = () => {
            effect.run()
        })
        update();
    };
    const mountCompoent = (vnode, container, anchor, parentComponent) => {
        //组件更新和初始化都是走这个函数
        //组件特点 可以基于自己状态重新渲染 effect 
        // 1.先创建组件实例
        const instance = (vnode.component = createComponetInstance(vnode, parentComponent))
        // 2.给实例的属性赋值
        setupCompoent(instance)
        // 3.创建一个effect  里面有状态更新 组件也是响应式，节点是数据响应式，组件是状态响应式，组件里面包含儿子节点和数据
        setupRenderEffect(instance, container, anchor, parentComponent)
    }

    const processComponet = (n1, n2, container, anchor, parentComponent) => {
        if (n1 === null) {
            mountCompoent(n2, container, anchor, parentComponent);
        } else {
            //组件更新
            updataComponet(n1, n2)
        }
    }


    //判断是那种类型的渲染和更新  渲染和更新都走这
    const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
        if (n1 === n2) { // 渲染同一个元素跳过
            return;
        }
        if (n1 && !isSameVnode(n1, n2)) {
            //暴力逻辑，去除n1节点，且n1=null继续走n2初始化挂载逻辑   
            unmount(n1); n1 = null;
        }
        const { type, shapeFlag, ref } = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor, parentComponent)
                } else if (shapeFlag & ShapeFlags.TELEPORT) {
                    type.process(n1, n2, container, anchor, parentComponent, {
                        mountChildren,
                        patchChildren,
                        move(vnode, container, anchor) {
                            hostInsert(vnode.compent ? vnode.compent.subTree : vnode.el, container, anchor)
                        }
                    })
                } else if (shapeFlag & ShapeFlags.COMPONENT) {
                    //对组件处理 Vue3基本废弃函数式组件，因为没有性能节约
                    processComponet(n1, n2, container, anchor, parentComponent)
                }
        }
        if (ref) {
            setRef(ref, n2)
        }
    }
    function setRef(rawRef, vnode) {  //简单设置下ref ，还存在多个ref的情况没有处理
        const value = vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT ? vnode.compent.espose
            || vnode.compent.proxy
            : vnode.el
        if (isRef(rawRef)) { //这里要判断下ref是否正确，这个isRef()有问题  
            rawRef.value = value
        }
    }
    const unmount = (vnode) => {
        const { shapeFlag, transition, el } = vnode
        const preformRemove = () => hostRemove(vnode.el)
        if (vnode.type === Fragment) {
            unmountChildren(vnode.children)
        } else if (shapeFlag & ShapeFlags.TELEPORT) {
            vnode.type.remove(vnode, unmountChildren)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
            unmount(vnode.compent.subTree)
        } else {
            if (transition) {
                transition.leave(el, preformRemove)
            } else {
                preformRemove();
            }
        }
        // 多次调用render会进行虚拟节点的比较，在进行更新
        const render = (vnode, container) => {
            if (vnode == null) {
                if (container._vnode) {
                    unmount(container._vnode)
                }
            } else {
                patch(container._vnode || null, vnode, container)
            }
            // 将虚拟节点变成真实节点进行渲染
            container._vnode = vnode;
        };
        return {
            render,
        }
    }

// 完全不关心render 层api，所有可以跨平台