declare interface User {
    id: string,
    name: string,
    email: string,
    avatar: string,
    isVip: boolean,
    verified: boolean,
}

enum Gender {
    M,
    F
}

declare interface Address {
    province: string,
    city: string,
    district: string,
    street: string,
    zipCode: string,
}

declare interface Newsletter {
    todayFocus: boolean,
    weeklyChoice: boolean,
    afternoonExpress: boolean
}

declare interface Profile {
    id: string,
    name: string,
    email: string,
    avatarUrl: string,
    gender: Gender, // Only `M` or `F`
    familyName: string,
    givenName: string,
    phoneNumber: string,
    mobileNumber: string,
    birthdate: string,
    address: Address,
    createdAt: string, //2018-03-23T09:20:13Z
    updatedAt: string, // 2018-03-24T06:54:03Z
    lastLoginAt: string, // 2018-04-20T07:37:46Z
    newsletter: Newsletter,
    membership: {
        type: string,
        start: string,
        end: string
    }    
}

declare interface SuperAgentResponse {
    header: Object,
    links: Object,
    status: number,
    statusType: number,
    info: boolean,
    ok: boolean,
    redirect: boolean,
    clientError: boolean,
    serverError: boolean,
    error: Error,
    accepted: boolean,
    noContent: boolean,
    badRequest: boolean,
    unauthorized: boolean,
    noAcceptable: boolean,
    forbidden: boolean,
    notFound: boolean,
    text: string,
    body: Object,
}

declare interface SuperAgentError {
    status: number,
    response: SuperAgentResponse, // body will be APIError
}

declare interface APIErrorBody {
    message: string,
    error?: {
        field: string,
        code: string, // Possbile value: missing | missing_field | invalid | already_exists
        message: string
    }
}
// Pass error message to template using this data structure
declare interface UIError {
    value?: string, // Template could redisplay the errored value
    code: string, // Template could tell exactly what's wrong
    message: string, // Template show a descriptive message to user
}

declare interface JoiErr {
    isJoi: boolean, // always true
    name: string, // always 'ValidationError'
    details: JoiErrDetail[],
}

declare interface JoiErrDetail {
    message: string, // '"email" must be a valid email'
    path: string[], // [ 'email', [length]: 1 ]
    type: string, // string.email, any.required, string.min, string.max
    context: {
        key: string,
        label: string,
        value?: string,
        limit?: number // If type is string.min or string.max
    }
}

declare interface JoiResult {
    error?: JoiErr,
    value: Object,
}