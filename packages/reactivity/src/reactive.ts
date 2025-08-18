import { isObject } from "@vue/shared";
import { mutableHanders } from "./bacehander";
import { ReactiveFlags } from "./constans";

const reactiveMap = new WeakMap(); //缓存代理对象


function createReactiveObject(target) {
    //统一判断，响应式对象必须是对象
    if (!isObject(target)) return;
    //处理代理对象再次代理的标记
    if (target[ReactiveFlags.IS_REACTIVE]) return target;

    const exitProxy = reactiveMap.get(target)
    if (exitProxy) { //如果缓存中命中，则直接返回代理后的对象
        return exitProxy;
    }
    //需要代理，就用proxy
    let proxy = new Proxy(target, mutableHanders);
    //缓存代理过的对象，目的是为了区别重复代理
    reactiveMap.set(target, proxy)
    return proxy;

}

export function reactive(target) {
    return createReactiveObject(target);
}

export function toReactive(value) {
    return isObject(value) ? reactive(value) : value;

}

export function isReacitve(value) {
    return !!(value & value[ReactiveFlags.IS_REACTIVE]);
}