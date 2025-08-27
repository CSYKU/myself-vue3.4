//主要是针对节点元素的属性操作 class style event 普通属性等，其他没讲

import patchAtter from "./moudles/patchAtter";
import patchClass from "./moudles/patchClass";
import patchEvent from "./moudles/patchEvent";
import patchStyle from "./moudles/patchStyle";



export default function patchProp(el, key, prevValue, nextValue) {
    if (key === 'class') {
        return patchClass(el, nextValue)
    } else if (key === 'style') {
        return patchStyle(el, prevValue, nextValue)
    } else if (/^on[^a-z]/.test(key)) { // onClick onMounseEnter等事件
        // el.addEventListener(key,nextValue)
        return patchEvent(el, key, nextValue)
    } else { // 还可以有其他key，没有继续写下去
        return patchAtter(el, key, nextValue)
    }

} 