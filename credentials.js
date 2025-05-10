// credentials.js
import dotenv from 'dotenv';
import { askAccount } from './inputHelper.js';

dotenv.config();

let selected = null;

export async function loadCredentials() {
  const account = await askAccount(); // '0' or '1'

  selected = account === '0'
    ? {
        label: 'MM',
        userId: process.env.SITI_USER_ID_MM,
        password: process.env.SITI_PASSWORD_MM,
        itzPassword: process.env.SITI_ITZ_PASSWORD_MM
      }
    : {
        label: 'RM',
        userId: process.env.SITI_USER_ID_RM,
        password: process.env.SITI_PASSWORD_RM,
        itzPassword: process.env.SITI_ITZ_PASSWORD_RM
      };

  if (!selected.userId || !selected.password || !selected.itzPassword) {
    throw new Error('❌ Missing credentials in .env file');
  }

  return selected;
}

export function getCredentials() {
  if (!selected) throw new Error('⚠️ Credentials not loaded yet.');
  return selected;
}
