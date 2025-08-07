

//创建一个响应式effect 数据变化可以重新执行
export function effect(fn, options?) {

    //创建一个effect,只要依赖的属性变化了就要执行回调
    const _effect = new ReactiveEffect(fn, () => {
        //scheduler 调度函数
        _effect.run()
    })
    _effect.run() //effect立即执行一次

    if(options){
        Object.assign(_effect,options);// 用用户传递的覆盖掉内置的，实现切片编程
    }   
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect; // 可以在run方法上获取到effect的引用
    return runner; //外界可以自己让其执行run
}

export let activeEffect; // 依赖收集的全局变量

function preCleanEffect(effect) {
    effect._depsLength = 0;
    effect._trackId++; //每次执行id都是+1，如果当前同一个effect执行，id就是相同的
}



function postCleanEffect(effect){
    // [flag ,age,name] 长度减少清理多余的
    // [flag] --> effect._depsLength =1
    if(effect.deps.length > effect._depsLength){
        for(let i = effect._depsLength;i<effect.deps.length;i++){
            cleanDepEffect(effect.deps[i],effect); //删除映射表中对应的effec
        }
        effect.deps._depsLength = effect._depsLength; //更新依赖列表中的长度
    }
}



class ReactiveEffect {
    _trackId = 0;   //用于记录当前effect执行了几次，标识同一次执行中有多个相同的属性收集。
    deps = [];
    _depsLength = 0;


    public active = true; // 默认标记创建的effect是响应式的,可以通过stop()修改停止effect，stop() todo...
    // fn 用户传入函数
    // 如果fn中依赖的数据变化需要重新调用 run->
    constructor(public fn, public scheduler) { }

    run() {
        //让fn执行
        if (!this.active) return this.fn();
        let lastactiveEffect = activeEffect; // 规避递归调用effect导致this不对，也可以用栈调用解决
        try {
            activeEffect = this;

            //effect重新执行前，需要将上一次依赖预清空 effect.deps,为了在存在分支依赖时没有bug
            preCleanEffect(this);

            return this.fn(); //执行fn函数时，做依赖收集，收集effect相关联的数据 -> state.name state.age
        } finally {

            postCleanEffect(this); //超出清理多余的
            activeEffect = lastactiveEffect; //effect中又有effect
        }
    }
    stop() {
        this.active = false; //后续实现
    }
}

function cleanDepEffect(dep,effect){
    dep.delete(effect)
    if(dep.size == 0){
        dep.cleanup()
    }
}

// 双向记忆
export function trackEffect(effect, dep) {
    //  分支变动，需要重新收集依赖，重复收集也不执行
    if (dep.get(effect) !== effect._trackId) { //依据id判断是否重复收集
        dep.set(effect, effect.trackId)

        let oldDep = effect.deps[effect._depsLength]
        if(oldDep !== dep){
            if(oldDep){
                //删除老的
                cleanDepEffect(oldDep,effect)
            }
            // 换成新的
            effect.deps[effect._depsLength++]=dep;
        }else{
            effect._depsLength++;
        }
    }


    //想让effect和dep关联起来，知道effect有哪些收集器
    effect.deps[effect._depsLength++] = dep;//双向记忆

    // dep.get(effect,effect._trackId);
    // effect.deps[effect._depsLength++] = dep;
}

export function triggerEffects(dep) {
    for (const effect of dep.keys()) {
        if (effect.scheduler) {
            effect.scheduler() // -> effect.run()
        }
    }
}