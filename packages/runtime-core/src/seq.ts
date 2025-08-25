//最长增长子序列实现
export function getSetQuence(arr) {
    const result = [0];
    const p = result.slice(0);//用于存放索引,倒溯节点

    let start; //二分查找变量
    let end;
    let middle;

    const len = arr.length;
    for (let i = 0; i < len; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {  // vue3剔除数组中为0的情况;
            let resultLstIndex = result[result.length - 1]
            // 获取结果集中最后一项，和当前项比较，判断是否交换
            if (arr[resultLstIndex] < arrI) {
                p[i] = result[result.length - 1];//正常放入索引就是result最后一个
                result.push(i);
                continue;
            }
        }
        start = 0;
        end = result.length - 1;
        while (start < end) {
            middle = ((start + end) / 2) | 0 //用或运算取整
            if (arr[result[middle]] < arrI) {
                start = middle + 1;
            } else {
                end = middle;
            }
        }
        if (arrI < arr[result[start]]) {
            p[i] = result[start - 1];
            result[start] = i;
        }

    }
    //p为前驱节点索引,根据最后节点追溯
    let l = result.length;
    let last = result[l - 1];
    while (l-- > 0) {
        // 倒序向前找，因为p是列表前驱节点;
        result[l] = last;
        last = p[last];
    }
    //创建一个前驱、

    return result;
}
