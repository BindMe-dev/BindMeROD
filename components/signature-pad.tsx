"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SignaturePadProps {
  onSignatureComplete: (signature: string, type: "drawn" | "typed") => void
  userName?: string
}

export function SignaturePad({ onSignatureComplete, userName }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [typedSignature, setTypedSignature] = useState("")
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
    setHasDrawnSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawnSignature(false)
  }

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawnSignature) return

    const dataURL = canvas.toDataURL("image/png")
    onSignatureComplete(dataURL, "drawn")
  }

  const saveTypedSignature = () => {
    if (!typedSignature.trim()) return
    onSignatureComplete(typedSignature.trim(), "typed")
  }

  return (
    <Tabs defaultValue="draw" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="draw">Draw Signature</TabsTrigger>
        <TabsTrigger value="type">Type Signature</TabsTrigger>
      </TabsList>
      
      <TabsContent value="draw" className="space-y-4">
        <div className="border rounded-lg p-4 bg-white">
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="border border-gray-300 rounded cursor-crosshair w-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={clearCanvas} className="bg-white text-black hover:bg-white hover:text-black">
              Clear
            </Button>
            <Button 
              size="sm" 
              onClick={saveDrawnSignature}
              disabled={!hasDrawnSignature}
            >
              Use This Signature
            </Button>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="type" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="typed-signature">Type your full name</Label>
          <Input
            id="typed-signature"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            placeholder={userName || "Your full name"}
            className="text-2xl font-serif"
          />
          <Button 
            onClick={saveTypedSignature}
            disabled={!typedSignature.trim()}
            className="w-full"
          >
            Use This Signature
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}

