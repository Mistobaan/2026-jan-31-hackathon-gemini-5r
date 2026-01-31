"use client"

import { useState } from "react"
import type { Team, Player } from "@/lib/teams-data"
import { Button } from "@/components/ui/button"
import { Sparkles, Download, Share2, RotateCcw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageGeneratorProps {
  team: Team
  selectedPlayers: Player[]
  selfie: string
  onReset: () => void
}

export function ImageGenerator({
  team,
  selectedPlayers,
  selfie,
  onReset,
}: ImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          teamName: team.name,
          playerNames: selectedPlayers.map((p) => p.name),
          selfieBase64: selfie,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      setGeneratedImage(data.imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a")
      link.href = generatedImage
      link.download = `nfl-fan-experience-${team.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShare = async () => {
    if (generatedImage && navigator.share) {
      try {
        await navigator.share({
          title: `My ${team.city} ${team.name} Fan Experience`,
          text: `Check out my AI-generated photo with ${selectedPlayers.map(p => p.name).join(", ")}!`,
          url: window.location.href,
        })
      } catch {
        // User cancelled or share failed
      }
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {generatedImage ? "Your Fan Experience" : "Generate Your Photo"}
        </h2>
        <p className="text-muted-foreground">
          {generatedImage
            ? `You with ${selectedPlayers.map((p) => p.name).join(", ")}`
            : `Create an AI-generated photo with ${selectedPlayers.length} ${team.name} player${selectedPlayers.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {!generatedImage ? (
        <div className="space-y-6">
          {/* Preview */}
          <div 
            className="relative rounded-2xl overflow-hidden border-2 border-border p-6"
            style={{ 
              background: `linear-gradient(135deg, ${team.primaryColor}20, ${team.secondaryColor}20)` 
            }}
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Selfie preview */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img src={selfie || "/placeholder.svg"} alt="Your selfie" className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                  You
                </span>
              </div>

              <span className="text-2xl text-muted-foreground">+</span>

              {/* Players preview */}
              {selectedPlayers.map((player) => (
                <div key={player.id} className="relative">
                  <div 
                    className="h-24 w-24 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    #{player.number}
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    {player.name.split(" ")[1]}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                AI will generate a photo of you shaking hands with the players
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating your experience...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Photo
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Generated image */}
          <div 
            className={cn(
              "relative rounded-2xl overflow-hidden border-2 shadow-2xl",
            )}
            style={{ borderColor: team.secondaryColor }}
          >
            <img 
              src={generatedImage || "/placeholder.svg"} 
              alt={`You with ${team.name} players`}
              className="w-full aspect-[4/3] object-cover"
            />
            <div 
              className="absolute bottom-0 inset-x-0 p-4"
              style={{ 
                background: `linear-gradient(to top, ${team.primaryColor}, transparent)` 
              }}
            >
              <p className="text-white font-bold text-lg text-center">
                {team.city} {team.name} Fan Experience
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 bg-transparent"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 bg-transparent"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              onClick={onReset}
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
