import { ref } from "@vue/reactivity";
import { h } from "./h"
import { isFunction } from "@vue/shared";

export function defindAsyncComponent(options) {
    if (isFunction(options)) {
        options = { loader: options } //函数改对象
    }
    return {
        setup() {
            const { loader, errorComponents, timeout, delay, loadingComponent, onError } = options;
            const loaded = ref(false);
            const loading = ref(false);
            const error = ref(false); //超时
            let Comp = null;
            let loadingTime = null;
            if (delay) {
                loadingTime = setTimeout(() => {
                    loading.value = true;
                }, delay)
            }
            let attempts = 0
            function loadFunc() {
                return loader().catch((err) => {
                    if (onError) {
                        return new Promise((resovle, reject) => {
                            const retry = () => resovle(loadFunc());
                            const fail = () => reject(loadFunc());
                            onError(err, retry, fail, ++attempts);
                        })
                    } else {
                        return err; //将错误传下去
                    }
                })
            };
            loadFunc().then(
                (comp) => {
                    Comp = comp;
                    loader.value = true;
                }
            ).catch((err) => {
                error.value = err;
            }).finally(() => {
                loading.value = false;
                //最终loading都要清理
                clearTimeout(loadingComponent)
            })

            if (timeout) {
                setTimeout(() => {
                    error.value = true;
                    throw new Error('组件加载失败')
                }, timeout)
            }

            const planceholdr = h("div")
            return () => {
                if (loaded.value) {
                    return h(Comp);
                } else if (error.value && errorComponents) {
                    return h(errorComponents);
                } if (loading.value && loadingComponent) {
                    return h(loadingComponent);
                } else {
                    return planceholdr;
                }
    }
}
    }
}