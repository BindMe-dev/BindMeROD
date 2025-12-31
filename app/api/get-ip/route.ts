import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  let ip = forwarded?.split(',')[0] || realIP || cfConnectingIP || 'unknown'
  
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7)
  }
  
  return NextResponse.json({ ip })
}