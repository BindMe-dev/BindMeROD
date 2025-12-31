import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const title = searchParams.get('title') || 'Create Professional Agreements in Minutes'
    const subtitle = searchParams.get('subtitle') || 'Legally binding, secure, and simple'
    const type = searchParams.get('type') || 'default'
    
    const icons = {
      agreement: '📄',
      certificate: '🏆',
      referral: '🎁',
      default: '⚡',
    }
    
    const icon = icons[type as keyof typeof icons] || icons.default

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px',
          }}
        >
          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Icon */}
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>
              {icon}
            </div>
            
            {/* Title */}
            <div
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.2,
                maxWidth: '900px',
              }}
            >
              {title}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <div
                style={{
                  fontSize: '32px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  maxWidth: '800px',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', gap: '40px' }}>
              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Agreements
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}>
                  10,000+
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Users
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}>
                  5,000+
                </div>
              </div>
            </div>
            
            {/* Brand */}
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              BindMe
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

