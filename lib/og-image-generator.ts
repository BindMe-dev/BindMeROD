// Generate dynamic Open Graph images for social sharing

export interface OGImageData {
  title: string
  subtitle?: string
  type?: "agreement" | "certificate" | "referral" | "default"
  stats?: {
    label: string
    value: string
  }[]
}

export function generateOGImageSVG(data: OGImageData): string {
  const type = data.type || "default"
  
  const themes = {
    agreement: {
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icon: "📄",
      color: "#FFFFFF",
    },
    certificate: {
      bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      icon: "🏆",
      color: "#FFFFFF",
    },
    referral: {
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      icon: "🎁",
      color: "#FFFFFF",
    },
    default: {
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      icon: "⚡",
      color: "#FFFFFF",
    },
  }

  const theme = themes[type]
  const title = data.title.length > 60 ? data.title.substring(0, 57) + "..." : data.title
  const subtitle = data.subtitle?.length > 80 ? data.subtitle.substring(0, 77) + "..." : data.subtitle

  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGradient)"/>
      
      <!-- Pattern overlay -->
      <rect width="1200" height="630" fill="url(#bgGradient)" opacity="0.1"/>
      
      <!-- Content container -->
      <rect x="60" y="60" width="1080" height="510" fill="rgba(255,255,255,0.1)" rx="20"/>
      
      <!-- Icon -->
      <text x="100" y="160" font-family="Arial, sans-serif" font-size="80">
        ${theme.icon}
      </text>
      
      <!-- Title -->
      <text x="100" y="280" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="${theme.color}">
        ${title}
      </text>
      
      ${subtitle ? `
      <!-- Subtitle -->
      <text x="100" y="340" font-family="Arial, sans-serif" font-size="32" fill="${theme.color}" opacity="0.9">
        ${subtitle}
      </text>
      ` : ''}
      
      ${data.stats ? data.stats.map((stat, i) => `
      <!-- Stat ${i} -->
      <text x="${100 + (i * 250)}" y="480" font-family="Arial, sans-serif" font-size="20" fill="${theme.color}" opacity="0.8">
        ${stat.label}
      </text>
      <text x="${100 + (i * 250)}" y="520" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${theme.color}">
        ${stat.value}
      </text>
      `).join('') : ''}
      
      <!-- Logo/Brand -->
      <text x="1050" y="580" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${theme.color}" text-anchor="end">
        BindMe
      </text>
    </svg>
  `
}

export function generateOGImageHTML(data: OGImageData): string {
  const svg = generateOGImageSVG(data)
  const encodedSvg = encodeURIComponent(svg)
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; padding: 0; }
          img { width: 1200px; height: 630px; display: block; }
        </style>
      </head>
      <body>
        <img src="data:image/svg+xml,${encodedSvg}" alt="BindMe" />
      </body>
    </html>
  `
}

// Generate meta tags for a page
export function generateMetaTags(data: {
  title: string
  description: string
  url: string
  imageUrl?: string
  type?: "website" | "article"
}) {
  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      url: data.url,
      type: data.type || "website",
      images: [
        {
          url: data.imageUrl || `${data.url}/api/og`,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
      siteName: "BindMe",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
      images: [data.imageUrl || `${data.url}/api/og`],
      creator: "@BindMe",
    },
  }
}

