/**
 * Data types missing in JS
 */
export interface Dictionary<T> {
    [key: string]: T;
}

export function pluck<T, K extends keyof T>(o: T, names: K[]): {key: K, value: T[K]}[] {
    return names.map(n => {
        return {
            key: n, 
            value: o[n]
        }
    });
}
