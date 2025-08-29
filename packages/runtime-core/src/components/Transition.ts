import { h } from "../h"


function nextFrame(fn) {
    requestAnimationFrame(() => {
        requestAnimationFrame(fn)
    })
}
function resovelTransitonProps(props) {
    const {
        name = "v",
        enterFromClass = `${name}-enter-from`,
        enterAcitveClass = `${name}-enter-active`,
        enterToClass = `${name}-enter-to`,
        leaveFromClass = `${name}-leave-from`,
        leaveAcitveClass = `${name}-leave-active`,
        leaveToClass = `${name}-leave-to`,
        onBeforeEnter,
        onEnter,
        onLeave,// 和下面的无关，这里用户传的，下面自定义的
    } = props;
    return {
        onBeforeEnter(el) {
            onBeforeEnter && onBeforeEnter(el); // 这个是外面传的
            el.classList.add(enterFromClass);
            el.classList.add(enterAcitveClass)
        },
        onEnter(el, done) {
            const reslove = () => {
                el.classList.remove(enterToClass);
                el.classList.remove(enterAcitveClass);
                done && done();
            }
            onEnter && onEnter(el, reslove);
            //保证下一帧动画产生才移除class
            nextFrame((el) => {
                el.classList.remove(enterFromClass);
                el.classList.add(enterToClass);
                if (!onEnter || onEnter.leave <= 1) {
                    el.addEventListener("transitionEnd", reslove)
                }
            })
        },
        onLeave(el, done) {
            const reslove = () => { 
                el.classList.remove(leaveAcitveClass);
                el.classList.remove(leaveToClass);
                done && done();
            }
            onLeave && onLeave(el, reslove);
            el.classList.add(leaveFromClass);
            document.body.offsetHeight; // 随便触发回流为了保证重绘;保证动画渐变
            el.classList.add(leaveAcitveClass);
            nextFrame(() => {
                el.classList.remove(leaveFromClass);
                el.classList.add(leaveAcitveClass);
                if (!onLeave || onLeave.leave <= 1) {
                    el.addEventListener("transitionend", reslove)
                }
            })

        },
    }
}
export function Transition(props, { slots }) {
    return h(BaseTransitionImp, resovelTransitonProps(props), slots)
}
// 核心思想是特定钩子加入特定事件   在渲染时调这些钩子
const BaseTransitionImp = {
    props: {
        onBeforeEnter: Function,
        onEnter: Function,
        onLeave: Function,
    },
    setup(props, slots) {
        return () => {
            const vnode = slots.default && slots.default()
            if (!vnode) {
                return;
            }
            // 没有keep-alive处理，全部存到transition，没有区分进入和移除元素性能，其他钩子函数
            vnode.transition = { beforeEnter: props.onBeforeEnter, enter: props.onEnter, leave: props.onLeave };
            return vnode;
        };
    }
}