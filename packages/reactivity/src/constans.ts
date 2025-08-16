export enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}


export enum DirtyLevels{
    Dirty = 4, // 脏值，取值需要执行computed
    NoDiryt = 0, //不脏就用上一处
}