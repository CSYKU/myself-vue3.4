import { isObject } from "@vue/shared";
import { activeEffect, trackEffect } from "./effect"
import { reactive } from "./reactive";
import { track, trigger } from "./reactiveEffect";
import { ReactiveFlags } from "./constans";

// proxy 搭配feflect使用 反射：在代码执行时能修改代码的执行行为
export const mutableHanders: ProxyHandler<any> = {
    get(target, key, recevier) {
        if (key === ReactiveFlags.IS_REACTIVE) return true;
        // 当取值时 让响应式属性和effect映射起来

        // 依赖收集todo...

        track(target, key) //收集这个对象上的属性，和effect关联在一起 
        let res = Reflect.get(target, key, recevier)
        if (isObject(res)) { //如果是对象进行递归代理
            return reactive(res)
        }
        return res;
        // 不能直接return target[key]或者this[key]，如果代理对象对象中有this会死循环 
        // reflect 和 proxy 搭配使用 reflect内建全局对象，提供了一组操作对象的方法，反射
        // const person = {
        //     namea:  'name',
        //     get aliasname(){
        //         return this.name + 'alias'
        //     }
        // }
    },
    set(target, key, value, recevier) {
        let olderValue = target[key];
        let result = Reflect.set(target, key, value, recevier);
        if (olderValue !== value) {
            trigger(target, key, value, olderValue)//触发页面更新
        }
        // 触发更新 todo...
        return result;
    },
}