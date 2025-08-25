export function isObject(value) {
    return typeof value === "object" && value !== null;
}

export function isFunction(value) {
    return typeof value == "function"
}
export function isString(value) {
    return typeof value == "string"
}
const hasOwnProperty = Object.prototype.hasOwnProperty//反柯里化，拿出这个方法
export const hasOwn = (value, key) => hasOwnProperty.call(value, key)
export * from "./shapeFlags"