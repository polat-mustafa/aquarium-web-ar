import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.REPLICATE_API_TOKEN;

  return NextResponse.json({
    tokenExists: !!token,
    tokenLength: token?.length || 0,
    tokenPrefix: token?.substring(0, 10) || 'undefined',
    tokenSuffix: token?.substring(token.length - 5) || 'undefined',
    allReplicateEnvVars: Object.keys(process.env).filter(k => k.includes('REPLICATE')),
    nodeEnv: process.env.NODE_ENV,
  });
}
