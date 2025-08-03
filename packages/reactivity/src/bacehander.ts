import {activeEffect} from "./effect"

export enum ReactiveFlags{
    IS_REACTIVE = "__v_isReactive"
}

// proxy 搭配feflect使用 反射：在代码执行时能修改代码的执行行为
export const mutableHanders:ProxyHandler<any>={
    get(target,key,recevier){
        if(key=== ReactiveFlags.IS_REACTIVE) return true;
        // 当取值时 让响应式属性和effect映射起来

        // 依赖收集todo...

        track(target,key) //收集这个对象上的属性，和effect关联在一起
        console.log(activeEffect,key)
        return Reflect.get(target,key,recevier) //recevier就是代理对象
        // 不能直接return target[key]和target[key]，如果代理对象对象中有this会死循环 
        // reflect 和 proxy 搭配使用
        // const person = {
        //     namea:  'name',
        //     get aliasname(){
        //         return this.name + 'alias'
        //     }
        // }
    },
    set(target,key,value,recevier){
        let olderValue = target[key];
        
        if(olderValue !== value){
            trigger()
        }
        // 触发更新 todo...
        return Reflect.set(target,key,value,recevier); 
    },
}