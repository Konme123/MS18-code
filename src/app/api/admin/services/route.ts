import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

function getBackendConfig() {
  const baseUrl = process.env.BACKEND_BASE_URL ?? 'http://localhost:5055';
  const secret = process.env.BACKEND_SHARED_SECRET;

  if (!secret) throw new Error('Missing env var: BACKEND_SHARED_SECRET');

  return { baseUrl, secret };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { baseUrl, secret } = getBackendConfig();
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/services`, {
      method: 'GET',
      headers: {
        'x-backend-secret': secret,
      },
      cache: 'no-store',
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to load services' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.text();

  try {
    const { baseUrl, secret } = getBackendConfig();
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/services`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-backend-secret': secret,
      },
      body,
      cache: 'no-store',
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to save services' }, { status: 500 });
  }
}
