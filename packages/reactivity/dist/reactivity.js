// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}
var activeEffect;
var ReactiveEffect = class {
  // 标记创建的effect是响应式的
  // fn 用户传入函数
  // 如果fn中依赖的数据变化需要重新调用 run->
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
  }
  run() {
    if (!this.active) return this.fn();
    let lastactiveEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = lastactiveEffect;
    }
  }
};

// packages/reactivity/src/bacehander.ts
var mutableHanders = {
  get(target, key, recevier) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) return true;
    console.log(activeEffect, key);
    return Reflect.get(target, key, recevier);
  },
  set(target, key, value, recevier) {
    return true;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target)) return;
  if (target["__v_isReactive" /* IS_REACTIVE */]) return target;
  const exitProxy = reactiveMap.get(target);
  if (exitProxy) {
    return exitProxy;
  }
  new Proxy(target, mutableHanders);
  reactiveMap.set(target, Proxy);
  return Proxy;
}
function reactive(target) {
  return createReactiveObject(target);
}
export {
  activeEffect,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
