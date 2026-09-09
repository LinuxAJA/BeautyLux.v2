import bcrypt from 'bcrypt';

import { env } from '../config/env.js';

export async function hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
}

export async function comparePassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Hash "señuelo" usado cuando el correo no existe, para que `login`
 * tarde lo mismo con o sin cuenta real y no se pueda enumerar por tiempo.
 */
let dummyHashPromise;
export function getDummyHash() {
    if (!dummyHashPromise) {
        dummyHashPromise = hashPassword('dummy-password-for-timing-safety');
    }
    return dummyHashPromise;
}

export default { hashPassword, comparePassword, getDummyHash };
