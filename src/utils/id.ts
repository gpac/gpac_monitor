import { customAlphabet } from 'nanoid';

export enum SpecialMessageID {
  NO_ID = 'NO_ID',
}

const alphabet = '6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz';
const nanoid = customAlphabet(alphabet, 10);
export const generateID = (prefix?: string) => {
  if (prefix) return `${prefix}_${nanoid()}`;
  return nanoid();
};
