"use client"

import { useState, useEffect } from "react"
import type { Team, Player } from "@/lib/teams-data"
import { Button } from "@/components/ui/button"
import { Sparkles, Download, Share2, RotateCcw, Loader2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { GenerationProgress } from "./generation-progress"
import { getRandomInitialPose, getRandomIconicPose } from "@/lib/pose-generator"

interface ImageGeneratorProps {
  team: Team
  selectedPlayers: Player[]
  selfie: string
  onReset: () => void
}

type GenerationState =
  | { status: 'idle' }
  | { status: 'uploading_selfie', sessionId: string }
  | { status: 'generating_pose1', sessionId: string }
  | { status: 'generating_pose2', sessionId: string }
  | { status: 'generating_video', sessionId: string }
  | { status: 'complete', videoUrl: string, pose1Url: string, pose2Url: string }
  | { status: 'error', error: string, lastSuccessfulStep?: string }

export function ImageGenerator({
  team,
  selectedPlayers,
  selfie,
  onReset,
}: ImageGeneratorProps) {
  const [state, setState] = useState<GenerationState>({ status: 'idle' })
  const [showProgress, setShowProgress] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const checkAndResumeSession = async () => {
      const savedSessionId = localStorage.getItem('nfl-session-id')
      if (savedSessionId && selfie) {
        // Calculate what the session ID would be for the current selfie
        const msgBuffer = new TextEncoder().encode(selfie)
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const currentSessionId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // Only prompt if the saved session matches the current selfie's session ID
        if (savedSessionId === currentSessionId) {
          // Same selfie - automatically resume without prompting
          resumeSession(savedSessionId)
        } else {
          // Different selfie - clear old session
          localStorage.removeItem('nfl-session-id')
        }
      }
    }

    checkAndResumeSession()
  }, [selfie])

  const resumeSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/storage/session/${sessionId}`)
      if (response.ok) {
        const session = await response.json()

        // Automatically resume if session is incomplete (same selfie means continuation)
        if (session.status !== 'complete' && session.status !== 'error') {
          setState({ status: session.status as any, sessionId })
          setShowProgress(true)
        } else {
          // Session already complete or errored - clear it
          localStorage.removeItem('nfl-session-id')
        }
      }
    } catch (error) {
      console.error('Failed to resume session:', error)
      localStorage.removeItem('nfl-session-id')
    }
  }

  const handleGenerate = async () => {
    try {
      setShowProgress(true)

      // Step 1: Create session
      // Generate a deterministic session ID based on the selfie content
      const msgBuffer = new TextEncoder().encode(selfie);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const deterministicSessionId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const sessionResponse = await fetch('/api/storage/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: deterministicSessionId,
          teamId: team.id,
          playerIds: selectedPlayers.map(p => p.id),
        }),
      })

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to create session')
      }

      const { sessionId } = await sessionResponse.json()
      localStorage.setItem('nfl-session-id', sessionId)
      setState({ status: 'uploading_selfie', sessionId })

      // Step 2: Upload selfie
      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          assetType: 'selfie',
          dataUrl: selfie,
        }),
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to upload selfie')
      }

      const { url: selfieUrl } = await uploadResponse.json()
      setState({ status: 'generating_pose1', sessionId })

      // Step 3: Generate Pose 1 (initial pose)
      const initialPose = getRandomInitialPose()
      const pose1Response = await fetch('/api/generate-composite-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selfieUrl,
          playerImageUrls: selectedPlayers.map(p => p.imageUrl),
          teamName: `${team.city} ${team.name}`,
          playerNames: selectedPlayers.map(p => p.fullName),
          poseId: initialPose.id,
          isInitialPose: true,
        }),
      })

      if (!pose1Response.ok) {
        const errorData = await pose1Response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to generate first pose')
      }

      const { imageUrl: pose1Url } = await pose1Response.json()
      setState({ status: 'generating_pose2', sessionId })

      // Step 4: Generate Pose 2 (iconic pose)
      const iconicPose = getRandomIconicPose()
      const pose2Response = await fetch('/api/generate-composite-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selfieUrl,
          playerImageUrls: selectedPlayers.map(p => p.imageUrl),
          teamName: `${team.city} ${team.name}`,
          playerNames: selectedPlayers.map(p => p.fullName),
          poseId: iconicPose.id,
          isInitialPose: false,
        }),
      })

      if (!pose2Response.ok) {
        const errorData = await pose2Response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to generate second pose')
      }

      const { imageUrl: pose2Url } = await pose2Response.json()
      setState({ status: 'generating_video', sessionId })

      // Step 5: Generate video
      const videoResponse = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          pose1Url,
          pose2Url,
          initialPoseId: initialPose.id,
          iconicPoseId: iconicPose.id,
          teamName: `${team.city} ${team.name}`,
        }),
      })

      if (!videoResponse.ok) {
        const errorData = await videoResponse.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to generate video')
      }

      const { videoUrl } = await videoResponse.json()

      // Complete!
      setState({
        status: 'complete',
        videoUrl,
        pose1Url,
        pose2Url,
      })
      localStorage.removeItem('nfl-session-id')

    } catch (error) {
      console.error('Generation error:', error)
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleDownload = () => {
    if (state.status === 'complete') {
      const link = document.createElement("a")
      link.href = state.videoUrl
      link.download = `nfl-fan-experience-${team.id}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShare = async () => {
    if (state.status === 'complete' && navigator.share) {
      try {
        await navigator.share({
          title: `My ${team.city} ${team.name} Fan Experience`,
          text: `Check out my AI-generated video with ${selectedPlayers.map(p => p.fullName).join(", ")}!`,
          url: window.location.href,
        })
      } catch {
        // User cancelled or share failed
      }
    }
  }

  const handleRetry = () => {
    setState({ status: 'idle' })
    setShowProgress(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {state.status === 'complete' ? "Your Fan Experience Video" : "Generate Your Video"}
        </h2>
        <p className="text-muted-foreground">
          {state.status === 'complete'
            ? `You with ${selectedPlayers.map((p) => p.fullName).join(", ")}`
            : `Create an AI-generated video with ${selectedPlayers.length} ${team.name} player${selectedPlayers.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {state.status === 'idle' && (
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
                    {player.lastName}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                AI will generate a cinematic video of you celebrating with the players
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleGenerate}
          >
            <Sparkles className="h-5 w-5" />
            Generate Video
          </Button>
        </div>
      )}

      {showProgress && state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error' && (
        <GenerationProgress
          sessionId={'sessionId' in state ? state.sessionId : ''}
          onComplete={(result) => {
            setState({
              status: 'complete',
              videoUrl: result.videoUrl,
              pose1Url: result.pose1Url,
              pose2Url: result.pose2Url,
            })
          }}
          onError={(error) => {
            setState({
              status: 'error',
              error,
            })
          }}
        />
      )}

      {state.status === 'error' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-destructive font-semibold mb-2">Generation Failed</p>
            <p className="text-sm text-muted-foreground">{state.error}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onReset}>
              Start Over
            </Button>
            <Button className="flex-1 gap-2" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {state.status === 'complete' && (
        <div className="space-y-6">
          {/* Video player */}
          <div
            className={cn(
              "relative rounded-2xl overflow-hidden border-2 shadow-2xl bg-black",
            )}
            style={{ borderColor: team.secondaryColor }}
          >
            <video
              src={state.videoUrl}
              controls
              className="w-full aspect-video"
              poster={state.pose1Url}
            >
              Your browser does not support the video tag.
            </video>
            <div
              className="absolute bottom-0 inset-x-0 p-4 pointer-events-none"
              style={{
                background: `linear-gradient(to top, ${team.primaryColor}, transparent)`
              }}
            >
              <p className="text-white font-bold text-lg text-center">
                {team.city} {team.name} Fan Experience
              </p>
            </div>
          </div>

          {/* Pose thumbnails */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative rounded-lg overflow-hidden border">
              <img src={state.pose1Url} alt="Pose 1" className="w-full aspect-video object-cover" />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Pose 1
              </span>
            </div>
            <div className="relative rounded-lg overflow-hidden border">
              <img src={state.pose2Url} alt="Pose 2" className="w-full aspect-video object-cover" />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Pose 2
              </span>
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
              Download Video
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
