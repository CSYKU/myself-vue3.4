import { isObject } from "@vue/shared";
import { createVnode, isVonde } from "./createVnode";



export function h(type, propOrChildren?, children?) {
    let l = arguments.length
    if (l === 2) {
        //h(type,虚拟节点|属性|数组|文本)
        if (isObject(propOrChildren) && !Array.isArray(propOrChildren))
            if (isVonde(propOrChildren)) {
                //虚拟节点走这 变成标准的去创建虚拟节点  h('div', h('a') )
                return createVnode(type, null, [propOrChildren]);
            } else {
                //属性走这
                return createVnode(type, propOrChildren)
            }
        // 数组|文本走这
        return createVnode(type, null, propOrChildren)

    } else {
        if (l > 3) {
            children = Array.from(arguments).slice(2);
        }
        if (l == 3 && isVonde(children)) {
            children = [children]
        }
        return createVnode(type, propOrChildren, children)
    }
}

