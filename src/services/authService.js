import { USER_STORAGE_KEY, DEMO_OTP } from '../utils/constants';
import { delay } from '../utils/helpers';

export const authService = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  },
  save(user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  clear() {
    localStorage.removeItem(USER_STORAGE_KEY);
  },
  async verifyIdentity(payload) {
    await delay(800);
    return { verified: true, ...payload };
  },
  async sendOtp(mobile) {
    await delay(500);
    return { sent: true, mobile, demoOtp: DEMO_OTP };
  },
  async confirmOtp(otp) {
    await delay(400);
    return otp === DEMO_OTP;
  },
};
