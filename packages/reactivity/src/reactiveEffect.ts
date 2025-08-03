import { activeEffect } from "./effect";

const targetMap = new WeakMap(); //存放依赖收集的关系

const createDep = (cleanup) => {
    const dep = new Map() as any;
    dep.cleanup = cleanup;
    return dep;
}

export function track(target, key) {
    if (activeEffect) {
        console.log(target, key, activeEffect)
        let depsMap = targetMap.get(target)
        if (!depsMap) {
            // 新增的
            targetMap.set(target, (depsMap = new Map()))
        }
        let dep = depsMap.get(key)
        if (!dep) {
            depsMap.set(
                key,
                dep = createDep(() => depsMap.delete(key)) //用createDep代替直接new Map()，可以传入清理函数
            );
        }
        trackEffect(activeEffect,dep) // 将当前的effec放入到dep(映射表)中，后续可以根据值的变化触发此dep中存放的effect
    }
}



// weakMap数据结构
//Map: {obj {属性: {effect,effect,...}}}
// {
//     {name:"bob",age: 21}
//         bob:{
//             effect
//         }
//         age:{
//             effect,effect  原来这里是set()，改成Map为了清理操作
//         }
// }