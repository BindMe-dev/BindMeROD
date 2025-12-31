import { format } from "date-fns"

export interface CertificateData {
  agreementId: string
  agreementType: string
  parties: string[]
  completedDate: Date
  theme?: "minimalist" | "corporate" | "creative"
}

export function generateCertificateSVG(data: CertificateData): string {
  const theme = data.theme || "minimalist"
  const themes = {
    minimalist: {
      bg: "#FFFFFF",
      primary: "#1E293B",
      secondary: "#64748B",
      accent: "#3B82F6",
      border: "#E2E8F0",
    },
    corporate: {
      bg: "#F8FAFC",
      primary: "#0F172A",
      secondary: "#475569",
      accent: "#0EA5E9",
      border: "#CBD5E1",
    },
    creative: {
      bg: "#FEFCE8",
      primary: "#713F12",
      secondary: "#A16207",
      accent: "#F59E0B",
      border: "#FDE047",
    },
  }

  const colors = themes[theme]
  const formattedDate = format(data.completedDate, "MMMM d, yyyy")
  const partiesText = data.parties.join(" and ")

  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="1200" height="630" fill="${colors.bg}"/>
      
      <!-- Border -->
      <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${colors.border}" stroke-width="2" rx="8"/>
      <rect x="50" y="50" width="1100" height="530" fill="none" stroke="${colors.accent}" stroke-width="1" rx="6"/>
      
      <!-- Logo/Icon -->
      <circle cx="600" cy="120" r="40" fill="${colors.accent}" opacity="0.1"/>
      <text x="600" y="135" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${colors.accent}" text-anchor="middle">✓</text>
      
      <!-- Title -->
      <text x="600" y="210" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${colors.primary}" text-anchor="middle">
        Agreement Completed
      </text>
      
      <!-- Subtitle -->
      <text x="600" y="260" font-family="Arial, sans-serif" font-size="24" fill="${colors.secondary}" text-anchor="middle">
        ${data.agreementType}
      </text>
      
      <!-- Parties -->
      <text x="600" y="330" font-family="Arial, sans-serif" font-size="20" fill="${colors.primary}" text-anchor="middle">
        Between
      </text>
      <text x="600" y="370" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="${colors.accent}" text-anchor="middle">
        ${partiesText.length > 80 ? partiesText.substring(0, 77) + "..." : partiesText}
      </text>
      
      <!-- Date -->
      <text x="600" y="440" font-family="Arial, sans-serif" font-size="18" fill="${colors.secondary}" text-anchor="middle">
        Completed on ${formattedDate}
      </text>
      
      <!-- Footer -->
      <text x="600" y="520" font-family="Arial, sans-serif" font-size="16" fill="${colors.secondary}" text-anchor="middle">
        Secured by BindMe
      </text>
      
      <!-- Agreement ID -->
      <text x="600" y="550" font-family="monospace" font-size="12" fill="${colors.secondary}" text-anchor="middle" opacity="0.6">
        ID: ${data.agreementId.substring(0, 16)}
      </text>
    </svg>
  `
}

export function generateCertificateHTML(data: CertificateData): string {
  const svg = generateCertificateSVG(data)
  const encodedSvg = encodeURIComponent(svg)
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agreement Certificate - BindMe</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f1f5f9;
            font-family: Arial, sans-serif;
          }
          .certificate-container {
            max-width: 1200px;
            width: 100%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          img {
            width: 100%;
            height: auto;
            display: block;
          }
          .actions {
            padding: 20px;
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          button {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .primary {
            background: #3B82F6;
            color: white;
          }
          .primary:hover {
            background: #2563EB;
          }
          .secondary {
            background: #E2E8F0;
            color: #1E293B;
          }
          .secondary:hover {
            background: #CBD5E1;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <img src="data:image/svg+xml,${encodedSvg}" alt="Agreement Certificate" />
          <div class="actions">
            <button class="primary" onclick="downloadCertificate()">Download Certificate</button>
            <button class="secondary" onclick="shareOnLinkedIn()">Share on LinkedIn</button>
            <button class="secondary" onclick="shareOnTwitter()">Share on Twitter</button>
          </div>
        </div>
        
        <script>
          function downloadCertificate() {
            const link = document.createElement('a');
            link.download = 'bindme-certificate-${data.agreementId}.svg';
            link.href = 'data:image/svg+xml,${encodedSvg}';
            link.click();
          }
          
          function shareOnLinkedIn() {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent('Just completed a ${data.agreementType} with BindMe - professional, secure, and done in minutes! 🚀');
            window.open(\`https://www.linkedin.com/sharing/share-offsite/?url=\${url}&summary=\${text}\`, '_blank');
          }
          
          function shareOnTwitter() {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent('Just completed a ${data.agreementType} with @BindMe - professional, secure, and done in minutes! 🚀');
            window.open(\`https://twitter.com/intent/tweet?text=\${text}&url=\${url}\`, '_blank');
          }
        </script>
      </body>
    </html>
  `
}

