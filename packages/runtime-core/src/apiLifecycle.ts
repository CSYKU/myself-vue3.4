import { currentInstance, setCurrentInstance, unsetCurrentInstance } from "./compent"

export const enum Lifecycle {
    BEFORE_MOUNT = "bm",
    MOUNT = "m",
    BERORE_UPDATE = "bu",
    UPDATE = "u",
}

function createHook(type) {
    // hook参数setup中传过来的函数
    return (hook, target = currentInstance) => {
        if (target) {
            const hooks = target[type] || (target[type] = [])
            // 实例教正
            const wrapHook = () => {
                setCurrentInstance(target);
                hook.call(target);
                unsetCurrentInstance();
            }
            hooks.push(wrapHook) //存在漏洞，setup执行完后hook中获取实例会获取全局实例导致为空
        }
    }
}
export const onBeforeMount = createHook(Lifecycle.BEFORE_MOUNT)
export const onMount = createHook(Lifecycle.MOUNT)
export const onBeforeUpdate = createHook(Lifecycle.BERORE_UPDATE)
export const onUpdate = createHook(Lifecycle.UPDATE)

export function invokArray(fns) {
    for (let i = 0; i < fns.length; i++) {
        fns[i]();
    }
}