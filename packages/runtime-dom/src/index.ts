export * from "@vue/reactivity";

import { nodeOpers } from "./nodeOps";
import patchProp from "./patchProp";

// 将节点操作和属性操作合并在一起
const rederOptions = Object.assign({ patchProp }, nodeOpers)

function createRenderer() { }