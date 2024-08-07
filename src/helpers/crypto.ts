import CryptoJS from "crypto-js";

/**
 * Encrypt string
 * @param toEncrypt - string to encrypt
 * @param key - the secret key to use
 * @returns the string encrypted
 */
export function encrypt(toEncrypt: string, key: string): string {
  return CryptoJS.AES.encrypt(toEncrypt, key).toString();
}

/**
 * Decrypt string
 * @param toDecrypt - string to decrypt
 * @param key - the secret key to use
 * @returns the string encrypted
 */
export function decrypt(toDecrypt: string, key: string): string {
  return CryptoJS.AES.decrypt(toDecrypt, key).toString(CryptoJS.enc.Utf8);
}

/**
 * Compare a string to an hash
 * @param toCompare - the string to compare
 * @param hash - the hash to compare
 * @param key - the secret key to use
 * @returns the comparison result
 */
export function compare(toCompare: string, hash: string, key: string): boolean {
  return toCompare === decrypt(hash, key);
}
