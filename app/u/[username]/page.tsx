"use client"

import { notFound } from "next/navigation"
import { useMemo } from "react"
import { useAgreements } from "@/lib/agreement-store"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function Section({
  title,
  agreements,
  emptyText,
}: {
  title: string
  agreements: { id: string; title: string; type: string; status: string }[]
  emptyText: string
}) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
          <Badge variant="outline" className="text-xs">
            {agreements.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agreements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="grid gap-2">
            {agreements.map((a) => (
              <Link
                key={a.id}
                href={`/agreement/${a.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="font-medium leading-tight">{a.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {a.type} · {a.status}
                  </div>
                </div>
                <Badge variant={a.status === "completed" ? "secondary" : "outline"} className="text-xs capitalize">
                  {a.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function UserAgreementsPage({ params }: { params: { username: string } }) {
  const { agreements } = useAgreements()
  const { user } = useAuth()

  const filtered = useMemo(() => {
    const creator = agreements.filter((a) => a.userId === user?.id)
    const counterparty = agreements.filter((a) =>
      (a.sharedWith || []).some((p) => (p.role ?? "counterparty") === "counterparty" && p.userId === user?.id),
    )
    const witness = agreements.filter((a) =>
      (a.sharedWith || []).some((p) => (p.role ?? "counterparty") === "witness" && p.userId === user?.id),
    )
    return { creator, counterparty, witness }
  }, [agreements, user?.id])

  if (!user || params.username.toLowerCase() !== user.id.toLowerCase()) {
    // Simple guard: only owner can view their profile agreements
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Agreements for</p>
        <h1 className="text-3xl font-bold leading-tight">{user?.name || user?.email}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Created by me"
          agreements={filtered.creator}
          emptyText="No agreements where you are the creator yet."
        />
        <Section
          title="I am a counterparty"
          agreements={filtered.counterparty}
          emptyText="No agreements where you are a counterparty yet."
        />
        <Section
          title="I am a witness"
          agreements={filtered.witness}
          emptyText="No agreements where you are a witness yet."
        />
      </div>
    </div>
  )
}
