export async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/country_name/`)
    if (!response.ok) return null
    const country = await response.text()
    return country.trim()
  } catch {
    return null
  }
}

export const COUNTRY_TO_GOVERNING_LAW: Record<string, string> = {
  'United Kingdom': 'England and Wales',
  'England': 'England and Wales',
  'Wales': 'England and Wales',
  'Scotland': 'Scotland',
  'Northern Ireland': 'Northern Ireland',
  'Ireland': 'Republic of Ireland',
  'United States': 'United States (Federal)',
  'Canada': 'Canada (Federal)',
  'Australia': 'Australia (Federal)',
  'Germany': 'Germany',
  'France': 'France',
  'Netherlands': 'Netherlands',
  'Switzerland': 'Switzerland',
  'Singapore': 'Singapore',
  'Hong Kong': 'Hong Kong',
}

export function getGoverningLawFromCountry(country: string): string {
  return COUNTRY_TO_GOVERNING_LAW[country] || 'England and Wales'
}