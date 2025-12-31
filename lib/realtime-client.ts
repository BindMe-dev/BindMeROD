"use client"

import Pusher from "pusher-js"

const key = process.env.NEXT_PUBLIC_PUSHER_KEY
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu"

let client: Pusher | null = null

export function getRealtimeClient(): Pusher | null {
  if (!key) {
    return null
  }
  if (client) return client
  client = new Pusher(key, {
    cluster,
    forceTLS: true,
  })
  return client
}
