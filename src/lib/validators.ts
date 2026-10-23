/** Nigerian mobile numbers: 08012345678, 2348012345678 or +2348012345678 */
export const isNgPhone = (v: string) => /^(\+?234|0)[789][01]\d{8}$/.test(v.replace(/\s+/g, ''));

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
