const queue = []//缓存任务队列
let isFlushing = false;// 是否在刷新
const resolvePromise = Promise.resolve()

// 如果同时在一个组件中更新多个状态，job一定是同一个
// 同时开启一个异步任务
export function queueJob(job) {
    // 去除重名
    if (!queue.includes(job)) {
        queue.push(job);// 让任务进入队列
    }
    if (!isFlushing) { //没考虑父子组件顺序
        isFlushing = true;
        resolvePromise.then(() => {
            isFlushing = false;
            const copy = queue.slice(0);//先拷贝子在执行，防止同时添加任务
            queue.length = 0;
            copy.forEach((job) => job());
            copy.length = 0;
        })
    }
}
//通过事件环的机制，延时更新操作，微任务(更新)