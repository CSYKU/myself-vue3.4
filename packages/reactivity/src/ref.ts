
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

export function tarckRefValue(ref) {
    if (activeEffect) {
        trackEffect(activeEffect,
            ref.dep = ref.dep || createDep(() => ref.dep = undefined, 'undefined')) // 存在bug，多次修改ref会重新创建一个映射表导致丢失上一次。
    }
}


export function triggerRefValue(ref) {
    let dep = ref.dep
    if (dep) {
        triggerEffects(dep) //触发更新
    }
}

// toRef toRefs

class ObjectRefImp {
    public _v_isRef = true;
    constructor(public _object, public _key) { }
    get value() {
        return this._object[this._key];
    }
    set value(newValue) {
        this._object[this._key] = newValue
    }
};
export function toRef(object, key) {
    return new ObjectRefImp(object, key)
}

export function toRefs() {
    const res = {}
    for (let key in Object) {
        res[key] = toRef(Object, key)
    }
    return res;
}

export function proxyRef(objectWithRef) { //代理ref，effect中使用ref不用.value
    return new Proxy(objectWithRef, {
        get(target, key, receiver) {
            let r = Reflect.get(target, key, receiver)
            return r._v_isRef ? r.value : r; //自动脱ref
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            if (oldValue !== value) {
                if (oldValue._v_isRef) {
                    oldValue.value = value; // 如果老值是ref，需要给ref赋值
                    return true;
                } else {
                    return Reflect.set(target, key, value, receiver);
                }
            }
        }
    })
}


export function isRef(value) {
    return value && value._v_isRef;
}