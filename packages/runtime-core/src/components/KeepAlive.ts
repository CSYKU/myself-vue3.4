import { getCurrentInstance } from "../compent";
import { onMount, onUpdate } from "../apiLifecycle";
import { ShapeFlags } from "@vue/shared";

// 存在bug，没有走重新挂载：
export const KeepAlive = {
    __isKeepAlive: true,
    props: {
        max: Number,
    },
    setup(props, { slots }) {
        const { max } = props;
        const keys = new Set();
        const cache = new Map();

        let pendingCacheKey: null;
        const instance = getCurrentInstance()
        const cacheSubTree = () => { cache.set(pendingCacheKey, instance.subTree) };
        const { move, createElement, unmount: _unmount } = instance.ctx.render
        function reset(vnode) {
            let shapeFlag = vnode.shapeFlag;
            if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
                shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
            } if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
                shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
            }
            vnode.shapeFlag = shapeFlag;
        };
        function unmount(vnode) {
            reset(vnode);
            _unmount(vnode);
        };
        function purneCacheEntry(key) {
            keys.delete(key);
            const cached = cache.get(key);
            unmount(cached) //走真实卸载
        };
        // keeplive 特有方法激活和移出
        instance.ctx.acitve = function (vnode, container, anchor) {
            move(vnode, container, anchor);
        };
        const storageContent = createElement("div")
        instance.ctx.deacitve = function (vnode) {
            move(vnode, storageContent, null);
        }

        onMount(cacheSubTree);
        onUpdate(cacheSubTree);
        return () => {
            const vnode = slots.default()
            const comp = vnode.type
            const key = vnode.key == null ? comp : vnode.key
            const cacheVndoe = cache.get(key);//一个缓存表，一个映射表，缓存已经渲染的，映射表查找是否存在
            pendingCacheKey = key;
            if (cacheVndoe) {
                vnode.compent = cacheVndoe.vnode;
                vnode.shapeFlags |= ShapeFlags.COMPONENT_KEPT_ALIVE;//判断是否需要初始化
                keys.delete(key);
                keys.add; //刷新缓存，放到最后
            } else {
                keys.add(key);
                if (max && keys.size > max) {
                    purneCacheEntry(keys.values().next().value);
                }
            }
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;
            return vnode;//等组件加载完成后去缓存
        }
    }
}

export const isKeepAlive = (value) => value.type.__isKeepAlive;