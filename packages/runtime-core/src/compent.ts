import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";

export function createComponetInstance(vnode) {
    const instance = {
        data: null,  //状态 data改为data
        vnode,  //组件的虚拟节点
        subTree: null,  //子树
        isMounted: false,   //是否挂载完成
        update: null,     // 组件的更新函数
        attrs: {},
        props: {},
        propsOptions: vnode.type.props, //用户申明的哪些属性是组件的属性
        component: null, // 用来关联复用
        proxy: null,//代理 data,attrs,props 方便使用
    }
    return instance;
}


//初始化属性
//根据propsOptions区分props和attrs
const initProps = (instance, rawProps) => {
    const props = {};
    const attrs = {};
    const propsOptions = instance.propsOptions || {} //组件中定义的
    if (rawProps) {
        for (let key in propsOptions) {
            const value = rawProps[key];
            if (key in propsOptions) { //这里可以做属性校验，判断value是否是符合传入类型
                props[key] = value;
            } else {
                attrs[key] = value;
            }
        }
    }
    instance.attrs = attrs;
    instance.props = reactive(props);// 这里源码是shallowReactive 因为props不需要深度监听,组件不能更改props，暂时用reactive替代
}


const publicProperty = {
    $attrs: (instance) => instance.attrs,
    // $slots...
}

const handeler = {
    get(target, key) {
        // data和props属性中名字不要重名
        const { data, props } = target; // 没有attr
        if (data && hasOwn(target, key)) {
            return data[key];
        } else if (props && hasOwn(target, key)) {
            return props[key];
        }
        const getter = publicProperty[key] //通过不通策略来访问对于的方法
        if (getter) {
            return getter(target)
        }

        // 对于一些无法修改的属性 如&solts $attrs等 取值 $attrs -> instance.attrs
    },
    set(target, key, value) {
        const { data, props } = target;
        if (data && hasOwn(target, key)) {
            data[key] = value;
        } else if (props && hasOwn(target, key)) {
            // props[key] = value;
            // 一般props只取值，内部可以修改嵌套属性(内部不报错)但是不合法
            console.warn('props is readOnly');
            return false;
        }
        return true;
    }
}

export function setupCompoent(instance) {
    const { vnode } = instance;
    // 赋值属性
    initProps(instance, vnode.props);
    // 赋值代理对象
    instance.proxy = new Proxy(instance, handeler)
    const { data = () => { }, render } = vnode.type
    if (!isFunction(data)) {
        console.warn('data options must be a function');
    } else { // 这里还是可能存在问题 36集15分钟
        // data中可以拿到props
        instance.data = reactive(data.call(instance.proxy))
    }
    // data函数 中可以拿到props
    instance.data = reactive(data.call(instance.proxy))
    instance.render = render;
}