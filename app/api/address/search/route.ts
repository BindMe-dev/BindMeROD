import { NextResponse } from "next/server"

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const USER_AGENT = process.env.ADDRESS_USER_AGENT || "BindMe/1.0 (+https://bindme.co.uk)"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")?.trim() || ""

  if (query.length < 3) {
    return NextResponse.json({ results: [] })
  }

  const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=5&countrycodes=gb&q=${encodeURIComponent(query)}`

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en",
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Address lookup failed" }, { status: 502 })
    }

    const data = await res.json()
    const results = Array.isArray(data)
      ? data.map((item: any) => {
          const address = item.address || {}
          const streetParts = [address.house_number, address.road || address.pedestrian || address.cycleway].filter(Boolean)
          const street = streetParts.join(" ").trim()
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            address.hamlet ||
            address.county ||
            ""
          const county = address.state || address.county || ""
          return {
            id: item.place_id,
            label: item.display_name,
            street: street || item.display_name,
            city,
            county,
            postcode: address.postcode || "",
            country: address.country || "",
          }
        })
      : []

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[ADDRESS_SEARCH]", error)
    return NextResponse.json({ error: "Address lookup failed" }, { status: 500 })
  }
}

