function createInvoker(value) {
    const invoker = (e) => invoker.value(e);
    invoker.value = value;
    return invoker;
}

// 有diff  所有叫patch补丁
export default function patchEvent(el, name, nextValue) { //可以参数数组等，没考虑输入数组
    // 虚拟元素上有_vei标识
    const invokers = el._vei || (el._vei = {}); //vue_event_invoker vue的事件调用
    const eventName = name.slice(2).toLowerCase();
    const exisitingInvokers = invokers[name] // 是否存在同名事件绑定

    if (nextValue && exisitingInvokers) {
        return (exisitingInvokers.value = nextValue) //事件换最新绑定
    }

    if (nextValue) { //事件以前没有或者不同名
        const invoker = (invokers[name] = createInvoker(nextValue)) //创建一个调用函数，并且内部会执行nextValue
        return el.addEventListener(eventName, invoker);
    }
    if (exisitingInvokers) {
        //现在没有，以前有 移除事件和缓存
        el.removeEvelntListener(eventName, exisitingInvokers)
        invokers[name] = undefined;
    }

}