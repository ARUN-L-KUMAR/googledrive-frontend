declare module 'jsonwebtoken' {
    export interface JwtPayload {
        [key: string]: any;
    }

    export interface SignOptions {
        expiresIn?: string | number;
        algorithm?: string;
    }

    export function sign(
        payload: string | Buffer | object,
        secretOrPrivateKey: string | Buffer,
        options?: SignOptions
    ): string;

    export function verify(
        token: string,
        secretOrPublicKey: string | Buffer
    ): JwtPayload | string;

    export function decode(
        token: string,
        options?: { complete?: boolean }
    ): JwtPayload | string | null;
}
