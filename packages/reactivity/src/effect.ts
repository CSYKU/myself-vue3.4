

//创建一个响应式effect 数据变化可以重新执行
export function effect(fn, options?) {

    //创建一个effect,只要依赖的属性变化了就要执行回调
    const _effect = new ReactiveEffect(fn, () => {
        //scheduler 调度函数
        _effect.run()
    })
    _effect.run() //effect立即执行一次
}

export let activeEffect; // 依赖收集的全局变量

class ReactiveEffect  {
    _trackId = 0; //用于记录当前effect执行了几次
    deps = [];
    _depsLength = 0;


    public active = true; // 默认标记创建的effect是响应式的
    // fn 用户传入函数
    // 如果fn中依赖的数据变化需要重新调用 run->
    constructor(public fn, public scheduler) { }

    run() {
        //让fn执行
        if (!this.active) return this.fn();
        let lastactiveEffect = activeEffect; // 规避递归调用effect导致this不对，也可以用栈调用解决
        try {
            activeEffect = this;
            return this.fn(); //执行fn函数时，做依赖收集，收集effect相关联的数据 -> state.name state.age
        } finally {
            activeEffect = lastactiveEffect; //effect中又有effect
        }
    }
}




export function trackEffect(effect, dep) {
    dep.set(effect, effect.trackId)
    //想让effect和dep关联起来，知道effect有哪些收集器
    effect.deps[effect._depsLength++] = dep;//双向记忆
}


export function trigger(target, key, value, olderValue) { }