
//  reactive    shallowReactive 是react的api    (shallow浅)
//  ref         shallowRef  和react类似 
import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

export function ref(value) {
    return createRef(value);
}

function createRef(value) {
   return new refImpl(value)
}

class refImpl {  //实现ref
    public __v_isRef = true;
    public _value;
    public dep; //收集响应式  
    constructor(public rawValue) {
        this._value = toReactive(rawValue);
    }
    get value() {
        tarckRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (newValue !== this.rawValue) {
            this.rawValue = newValue; //保存原始值用于比对
            this._value = toReactive(newValue);
            triggerRefValue(this);
        }
    }
}

function tarckRefValue(ref) {
    if (activeEffect) {
        trackEffect(activeEffect,
            ref.dep = createDep(() => ref.dep = undefined, 'undefined'))
    }
}


function triggerRefValue(ref) {
    let dep = ref.dep
    if (dep) {
        triggerEffects(dep) //触发更新
    }
}
