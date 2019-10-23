export function toBoolean(str?: string): boolean {
    if (!str) {
        return false;
    }

    return ['true', 'false', '1', '0'].includes(str);
}
