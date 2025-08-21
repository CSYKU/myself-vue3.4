import { nodeOpers } from "./nodeOps";
import patchProp from "./patchProp";
import { createRenderer } from "@vue/runtime-core"  //runtime-core 会引入reactivity，修改引入导出和package.json

// 将节点操作和属性操作合并在一起
const rederOptions = Object.assign({ patchProp }, nodeOpers)
// reder 方法采用dom api来渲染
export const render = (vnode, container) => {
    return createRenderer(rederOptions).render(vnode, container)
}

export * from "@vue/runtime-core";