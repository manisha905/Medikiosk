import { delay } from '../utils/helpers';

export const api = {
  async get(_path) {
    await delay(200);
    return null;
  },
  async post(_path, body) {
    await delay(400);
    return body;
  },
};
