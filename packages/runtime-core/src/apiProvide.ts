import { currentInstance } from "./compent";

export function provide(key, value) {
    if (!currentInstance) return;
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent?.provides;
    if (parentProvides === provides) {
        provides = currentInstance.provides = Object.create(provides)
    }
    provides[key] = value

}
export function inject(key, defaultValue) {
    if (!currentInstance) return;
    const provides = currentInstance?.parent

    if (provides && key in provides) {
        return currentInstance.parent[key]
    } else {
        return defaultValue;
    }

}