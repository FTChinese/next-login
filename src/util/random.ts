import {
    randomBytes,
} from "crypto";
import {
    promisify,
} from "util";

const promisedRandomBytes = promisify(randomBytes);

export class Base64StdEncoding {
    encode(buf: Buffer): string {
        return buf.toString("base64");
    }

    decode(str: string): Buffer {
        return Buffer.from(str, "base64");
    }  
}

class Base64URLEncoding extends Base64StdEncoding {

    unescape (str: string): string {
        return (str + '==='.slice((str.length + 3) % 4))
          .replace(/-/g, '+')
          .replace(/_/g, '/')
      }
    
    escape (str: string): string {
        return str.replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
    }

    /**
     * @description base64url encode a buffer
     * @param {Buffer} buf
     * @return {string}
     */
    encode(buf: Buffer): string {
      return this.escape(buf.toString("base64"));
    }
  
    /**
     * @description Turn base64url encoded string back or original buffer
     * @param {string} str - base64url encoded string
     * @return {Buffer}
     */
    decode(str: string): Buffer {
      return Buffer.from(this.unescape(str), 'base64');
    }
}

export class Random {
    private promisedBuffer: Promise<Buffer>;
  
    constructor(size: number) {
      this.promisedBuffer = promisedRandomBytes(size);
    }
  
    async raw() {
      return await this.promisedBuffer;
    }
  
    async hex() {
      const buf = await this.promisedBuffer;
      return buf.toString("hex")
    }
}

export const base64StdEncoding = new Base64StdEncoding();
export const base64URLEncoding = new Base64URLEncoding();

export const pool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
