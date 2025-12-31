"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from "lucide-react"
import { toast } from "sonner"

interface SocialShareButtonProps {
  url: string
  title: string
  description?: string
  hashtags?: string[]
  onShare?: (platform: string) => void
}

export function SocialShareButton({
  url,
  title,
  description = "",
  hashtags = [],
  onShare,
}: SocialShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  const hashtagString = hashtags.map((tag) => `#${tag}`).join(" ")

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${hashtagString ? `&hashtags=${hashtags.join(",")}` : ""}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const handleShare = async (platform: "twitter" | "facebook" | "linkedin" | "native" | "copy") => {
    if (platform === "native" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        })
        onShare?.(platform)
        toast.success("Shared successfully!")
      } catch (error) {
        // User cancelled or error
        console.error("Share failed:", error)
      }
      return
    }

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        onShare?.("copy")
        toast.success("Link copied to clipboard!")
      } catch (error) {
        toast.error("Failed to copy link")
      }
      return
    }

    // Open social media share window
    const shareUrl = shareLinks[platform]
    window.open(shareUrl, "_blank", "width=600,height=400")
    onShare?.(platform)
  }

  // Check if native share is available
  const hasNativeShare = typeof navigator !== "undefined" && navigator.share

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {hasNativeShare && (
          <DropdownMenuItem onClick={() => handleShare("native")}>
            <Share2 className="h-4 w-4 mr-2" />
            Share...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleShare("twitter")}>
          <Twitter className="h-4 w-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("facebook")}>
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("linkedin")}>
          <Linkedin className="h-4 w-4 mr-2" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("copy")}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

