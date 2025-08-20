//主要是针对节点元素的增删改查

export const nodeOpers = {
    // 如果第三个元素不传，相当于直接调用appendChild
    inset(el, parent, anchor) {
        // appendChild parent.insertBefore(el,null)
        parent.insertBefore(el.anchor || null)
    },
    remove(el) {
        // 移除dom元素
        const parent = el.parentNode;
        if (parent) {
            parent.removeChild(el);
        }
    },
    createElement(type) {
        return document.createElement(type);
    },
    createText: (text) => document.createTextNode(text),//另一种写法
    setText: (node, text) => node.nodeVlaue = text,
    setElementText: (el, text) => (el.textContent = text),
    parentNode: (node) => node.parentNode,
    nextSibling: (node) => node.nextSibling,
} 