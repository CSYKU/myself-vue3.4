
export default function patchAtter(el, key, value) {
    if (value = null) {
        el.removeAttribute(key);
    } else {
        el.setAtteriute(key, value);
    }
}