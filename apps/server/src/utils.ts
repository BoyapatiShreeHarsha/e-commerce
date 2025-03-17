import CryptoJS from "crypto-js";

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

export function handleObjectUpdate<T extends Record<string, any>>(object: T): Partial<T> {
  const updatedObject: Partial<T> = { ...object };
  for (let key in updatedObject) {
    if (updatedObject[key] === undefined) {
      delete updatedObject[key];
    }
  }
  return updatedObject;
}
