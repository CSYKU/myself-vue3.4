import { nodeOpers } from "./nodeOps";
import patchProp from "./patchProp";
import { createRenderer } from "@vue/runtime-core"  //runtime-core 会引入reactivity，修改引入导出和package.json

// 将节点操作和属性操作合并在一起
const rederOptions = Object.assign({ patchProp }, nodeOpers)
export { rederOptions } //

export * from "@vue/runtime-core";