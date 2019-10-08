/**
 * @description Pick a subset of properties from an object.
 */
export function pluck<T, K extends keyof T>(o: T, names: K[]): T[K][] {
    return names.map(n => o[n]);
}

/**
 * @description Returns an array of object from a 
 * given object filtered by `names`
 */
export function filterObject<T, K extends keyof T>(o: T, names: K[]): {key: K, value: T[K]}[] {
    return names.map(n => {
        return {
            key: n, 
            value: o[n]
        }
    });
}

export function getProperty<T, K extends keyof T>(o: T, name: K): T[K] {
    return o[name];
}

/**
 * @description Returns an array of a given object's own enumerable property `[key, value]` pairs, filterd by `names`.
 */
export function pluckEntries<T, K extends keyof T>(o: T, names: K[]): [K, T[K]][] {
    return names.map(n => [n, o[n]]);
}
