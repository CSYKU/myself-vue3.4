import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { tarckRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl {
    public _value;
    public effect;
    public dep;
    constructor(public getter, public setter) {
        this.effect = new ReactiveEffect(
            () => getter(this._value),
            () => {
                //调度函数，计算属性依赖的值变化了，我们触发渲染
                triggerRefValue(this)
            })
    }
    get value() {
        // 作缓存处理，不每次都run()
        if (this.effect.dirty) {
            this._value = this.effect.run()
            tarckRefValue(this.dep)
            // 如果当前effect(即这个computed)访问了计算属性，计算属性需要收集这个effect
        }
        return this._value
    }

    set value(v) {
        // 这里是ref的setter
        this.setter(v)
    }

}


export function computed(getterOrOptions) {
    let onlyGetter = isFunction(getterOrOptions)
    let getter;
    let setter;
    if (onlyGetter) {
        getter = onlyGetter;
        setter = () => { };
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter)
}