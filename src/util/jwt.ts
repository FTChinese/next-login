import { sign as cbSign, verify as cbVerify, Secret, SignOptions} from 'jsonwebtoken';
import { promisify } from 'util';

export const sign: (payload: string | Buffer | object, secret: Secret, options: SignOptions) => Promise<string | undefined> = promisify(cbSign);

/**
 * @throws JsonWebTokenError | TokenExpiredError
 */
export const verify: (token: string, secret: Secret) => Promise<object | undefined> = promisify(cbVerify);


