console.log("[API HANDLER LOADED]");

import handler from '../dist/server.cjs';

export default async function apiEntryPoint(req: any, res: any) {
  console.log("[API REQUEST]", req.method, req.url);
  return handler(req, res);
}

