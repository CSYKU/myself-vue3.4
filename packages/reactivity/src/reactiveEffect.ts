import { activeEffect ,trackEffect, triggerEffects} from "./effect";

const targetMap = new WeakMap(); //存放依赖收集的关系

export const createDep = (cleanup,key) => {
    const dep = new Map() as any;
    dep.cleanup = cleanup;
    dep.mekey = key; // 源码没有，为了方便调试找bug加的标识
    return dep;
}

export function track(target, key)  { 
    if (activeEffect) {

        let depsMap = targetMap.get(target)
        if (!depsMap) {
            // 新增的
            targetMap.set(target, (depsMap = new Map()))
        }
        let dep = depsMap.get(key)
        if (!dep) {
            depsMap.set(
                key,
                dep = createDep(() => depsMap.delete(key),key) //用createDep代替直接new Map()，可以传入清理函数
            );
        }
        //上边知识做好了映射结构,dep里面没有关联effect
        // @activeEffect 旗子实际是effect对象
        // @dep  map结构的响应式对象属性的所有关联的副作用，多个effect集合
        trackEffect(activeEffect,dep) // 将当前的effec放入到dep(映射表)中，后续可以根据值的变化触发此dep中存放的effect
    }
}

export function trigger(target,key,newValue,olderValue){
    const depsMap = targetMap.get(target)
    if(!depsMap){ //找不到对象，不用更新直接return
        return 
    }
    let dep = depsMap.get(key)
    if(dep){
        triggerEffects(dep);
    }
    
    return 
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