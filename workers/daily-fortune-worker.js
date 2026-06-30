import { onRequest } from '../functions/api/daily-fortune.js';

export default {
  async fetch(request, env, ctx) {
    return onRequest({ request, env, ctx });
  }
};
