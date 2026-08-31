import { neonAuth } from '@/lib/neon/auth';

const unavailable = () => new Response('Authentication is not configured.', { status: 503 });
const handler = neonAuth?.handler();

export const GET = handler?.GET ?? unavailable;
export const POST = handler?.POST ?? unavailable;
export const PUT = handler?.PUT ?? unavailable;
export const PATCH = handler?.PATCH ?? unavailable;
export const DELETE = handler?.DELETE ?? unavailable;
