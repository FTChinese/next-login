/**
 * @description Returns the current Unix time in seconds.
 */
export function unixNow(): number {
    return Math.trunc(Date.now() / 1000);
}

/**
 * @description Test if unix `timestamp` is expired upt to now.
 */
export function isExpired(timestamp: number, duration: number): boolean {
    const elapsed = unixNow() - timestamp;

    if (elapsed > duration || elapsed < 0) {
        return true;
    }

    return false;
}
