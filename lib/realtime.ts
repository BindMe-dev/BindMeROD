import Pusher from "pusher"

const {
  PUSHER_APP_ID,
  PUSHER_KEY,
  PUSHER_SECRET,
  PUSHER_CLUSTER = "eu",
  PUSHER_USE_TLS = "true",
} = process.env

let pusher: Pusher | null = null

function getPusher() {
  if (pusher) return pusher
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
    console.warn("Pusher env vars not set; realtime disabled on server")
    return null
  }
  pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: PUSHER_USE_TLS === "true",
  })
  return pusher
}

export async function triggerAgreementRefresh(agreementId?: string, payload?: Record<string, any>) {
  const client = getPusher()
  if (!client) return
  try {
    await client.trigger("agreements", "refresh", { agreementId, ...(payload || {}) })
  } catch (error) {
    console.error("[PUSHER_TRIGGER]", error)
  }
}

export async function triggerChatMessage(agreementId: string, message: any) {
  const client = getPusher()
  if (!client) return
  try {
    await client.trigger(`chat-${agreementId}`, "new-message", message)
  } catch (error) {
    console.error("[PUSHER_CHAT_TRIGGER]", error)
  }
}
