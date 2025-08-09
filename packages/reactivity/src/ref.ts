
//  reactive    shallowReactive 是react的api    (shallow浅)
//  ref         shallowRef  和react类似 
import { toReactive } from "./reactive";
export function ref(value) {
    return createRef(value);
}

function createRef(value) {
    new refImpl(value)
}

class refImpl {  //实现ref
    public __v_isRef = true;
    public _value;
    public dep; //收集响应式  
    constructor(public rawValue) {
        this._value = toReactive(rawValue);
    }
    get value() {
        return this._value;
    }
    set value(newValue) {
        if (newValue !== this.rawValue) {
            this.rawValue = newValue;
            this._value = toReactive(newValue);
        }
    }
}