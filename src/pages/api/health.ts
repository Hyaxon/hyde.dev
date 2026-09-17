import type { APIRoute } from "astro";
import { getHealth } from "../../lib/server/health";

export const prerender = false;

export const GET: APIRoute = () => {
  return Response.json(getHealth());
};
