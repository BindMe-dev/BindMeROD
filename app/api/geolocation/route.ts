import { NextRequest, NextResponse } from 'next/server'
import { getCountryFromIP, getGoverningLawFromCountry } from '@/lib/geolocation'

export async function GET(request: NextRequest) {
  try {
    // Get IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = request.headers.get('x-client-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    const ip = forwarded?.split(',')[0]?.trim() 
      || realIP 
      || clientIP 
      || cfConnectingIP 
      || 'unknown'
    
    if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
      return NextResponse.json({ 
        country: null, 
        governingLaw: 'England and Wales',
        ip: 'localhost'
      })
    }

    const country = await getCountryFromIP(ip)
    const governingLaw = country ? getGoverningLawFromCountry(country) : 'England and Wales'

    return NextResponse.json({
      country,
      governingLaw,
      ip
    })
  } catch (error) {
    return NextResponse.json({ 
      country: null, 
      governingLaw: 'England and Wales',
      ip: 'error'
    })
  }
}
