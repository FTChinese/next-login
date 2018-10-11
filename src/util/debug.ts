import debug, { IDebugger } from "debug";

export function info(name: string): IDebugger {
    const i = debug(name);
    i.log = console.log.bind(console);

    return i;
}