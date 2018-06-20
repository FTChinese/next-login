declare interface User {
    id: string,
    name: string,
    email: string,
    avatar: string,
    isVip: boolean,
    verified: boolean,
}

declare interface ValidationError {
    value: string,
    code: string,
    message: string,
}