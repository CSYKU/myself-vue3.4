import { isFunction, isObject } from "@vue/shared"
import { isReacitve } from "./reactive";
import { isRef } from "./ref"
import { ReactiveEffect } from "./effect";


export function watch(source, cb, options = {} as any) {
    // watchEffect 也可用doWatch
    return doWatch(source, cb, options)
}

export function watchEffect(source, options = {} as any) {
    // 没有cb就是watchEffect
    return doWatch(source, null, options as any)
}

// seen 防止重复引用递归死循环
function traverse(source, depth, currentDepth = 0, seen = new Set()) {
    if (!isObject) {
        return source
    }
    if (depth) {
        if (currentDepth < depth) {
            return source;
            currentDepth++
        }
    }
    if (seen.has(source)) {
        return source
    }
    for (let key in source) {
        traverse(source[key], depth, currentDepth, seen)
    }
    return source; //遍历触发需要监听的每个属性的getter
}

function doWatch(source, cb, { deep, immediate }) { //解构deep
    // source ? -> getter

    const reactiveGet = (source) => traverse(source, deep === false ? 1 : undefined) // 老版本没有depth
    let getter;
    if (isReacitve(source)) {
        getter = () => reactiveGet(source)
    } else if (isRef(source)) {
        getter = () => source
    } else if (isFunction(source)) {
        getter = source
    }
    let oldVlaue;

    let clean;
    const onCleanUp = (fn) => {
        clean = () => {
            fn()
            clean = undefined;
        }
    }

    const job = () => {
        if (cb) {
            const newValue = effect.run();
            if (clean) {
                clean() //第一次为空，再次执行就清理上一次 一个闭包
            }
            cb(newValue, oldVlaue, onCleanUp)
            oldVlaue = newValue;
        } else {
            effect.run()
        };
    }

    const effect = new ReactiveEffect(getter, job)

    if (cb) {
        if (immediate) { // 先执行一次
            job();
        } else {
            oldVlaue = effect.run();
        }
    } else {
        // watchEffect
        effect.run
    }

    const unwatch = () => {
        effect.stop();
    };
    return unwatch;

}   