"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GenerationProgress } from "@/components/generation-progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Download, Share2 } from "lucide-react";
import Image from "next/image";

interface SessionData {
  sessionId: string;
  teamId: string;
  playerIds: string[];
  status: string;
  progress: number;
  assets: {
    selfie?: string;
    pose1?: string;
    pose2?: string;
    video?: string;
  };
  error?: string;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [result, setResult] = useState<{
    videoUrl: string;
    pose1Url: string;
    pose2Url: string;
  } | null>(null);

  // Start generation pipeline
  const startGeneration = async (sessionData: SessionData) => {
    try {
      // Step 1: Generate pose 1
      if (!sessionData.assets?.pose1) {
        console.log("Starting pose 1 generation...");
        const pose1Response = await fetch("/api/generate-composite-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            selfieUrl: sessionData.assets?.selfie,
            teamName: sessionData.teamId,
            playerNames: sessionData.playerIds,
            poseId: "greeting",
            isInitialPose: true,
          }),
        });

        if (!pose1Response.ok) {
          const err = await pose1Response.json();
          throw new Error(err.error || "Failed to generate pose 1");
        }

        const pose1Result = await pose1Response.json();
        sessionData.assets = {
          ...sessionData.assets,
          pose1: pose1Result.imageUrl,
        };
      }

      // Step 2: Generate pose 2
      if (!sessionData.assets?.pose2) {
        console.log("Starting pose 2 generation...");
        const pose2Response = await fetch("/api/generate-composite-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            selfieUrl: sessionData.assets?.selfie,
            teamName: sessionData.teamId,
            playerNames: sessionData.playerIds,
            poseId: "celebration",
            isInitialPose: false,
          }),
        });

        if (!pose2Response.ok) {
          const err = await pose2Response.json();
          throw new Error(err.error || "Failed to generate pose 2");
        }

        const pose2Result = await pose2Response.json();
        sessionData.assets = {
          ...sessionData.assets,
          pose2: pose2Result.imageUrl,
        };
      }

      // Step 3: Generate video
      if (!sessionData.assets?.video) {
        console.log("Starting video generation...");
        const videoResponse = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            pose1Url: sessionData.assets?.pose1,
            pose2Url: sessionData.assets?.pose2,
            teamName: sessionData.teamId,
          }),
        });

        if (!videoResponse.ok) {
          const err = await videoResponse.json();
          throw new Error(err.error || "Failed to generate video");
        }
      }

      // Generation will be tracked via SSE
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  };

  useEffect(() => {
    // Fetch session data
    async function fetchSession() {
      try {
        const response = await fetch(`/api/storage/session/${sessionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Session not found. Please start a new generation.");
            return;
          }
          throw new Error("Failed to fetch session");
        }
        const data = await response.json();
        setSession(data);

        // If session is already complete, set the result
        if (data.status === "complete" && data.assets) {
          setGenerationComplete(true);
          setResult({
            videoUrl: data.assets.video || "",
            pose1Url: data.assets.pose1 || "",
            pose2Url: data.assets.pose2 || "",
          });
        } else if (
          data.status === "uploading_selfie" ||
          data.status === "pending"
        ) {
          // Start generation if session is new or just uploaded
          startGeneration(data);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  const handleComplete = (result: {
    videoUrl: string;
    pose1Url: string;
    pose2Url: string;
  }) => {
    setGenerationComplete(true);
    setResult(result);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  const handleRetry = () => {
    setError(null);
    setGenerationComplete(false);
    setResult(null);
    // Refresh the page to restart the SSE connection
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Session Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Start Over
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  N
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground">
                NFL Fan Experience
              </h1>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Session Info */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            Session ID:{" "}
            <code className="bg-muted px-2 py-1 rounded">{sessionId}</code>
          </p>
        </div>

        {generationComplete && result ? (
          // Show completed results
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                🎉 Generation Complete!
              </h2>
              <p className="text-muted-foreground">
                Your NFL fan experience has been created
              </p>
            </div>

            {/* Video Player */}
            {result.videoUrl && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Your Video</h3>
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={result.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Generated Images */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {result.pose1Url && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pose 1</h3>
                  <div className="aspect-video relative rounded-lg overflow-hidden border">
                    <Image
                      src={result.pose1Url}
                      alt="Generated pose 1"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              {result.pose2Url && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pose 2</h3>
                  <div className="aspect-video relative rounded-lg overflow-hidden border">
                    <Image
                      src={result.pose2Url}
                      alt="Generated pose 2"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" className="gap-2" asChild>
                <a href={result.videoUrl} download>
                  <Download className="h-4 w-4" />
                  Download Video
                </a>
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}
              >
                <Share2 className="h-4 w-4" />
                Share Link
              </Button>
              <Button onClick={() => router.push("/")} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Create Another
              </Button>
            </div>
          </div>
        ) : error ? (
          // Show error state
          <div className="max-w-md mx-auto text-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Generation Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button onClick={() => router.push("/")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        ) : (
          // Show progress
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                Generating Your Experience
              </h2>
              <p className="text-muted-foreground">
                Please wait while we create your personalized NFL fan experience
              </p>
            </div>

            <GenerationProgress
              sessionId={sessionId}
              onComplete={handleComplete}
              onError={handleError}
            />

            {/* Skip button for demo purposes */}
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  // Use sample assets for demo
                  setGenerationComplete(true);
                  setResult({
                    videoUrl: "/samples/YHvbuOE7m-HnsIp_Wsm_t_output.mp4",
                    pose1Url: "/samples/picture1.png",
                    pose2Url: "/samples/picture2.png",
                  });
                }}
              >
                Skip (Demo Mode)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Use sample images for demo purposes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Create AI-generated photos with your favorite NFL players
          </p>
        </div>
      </footer>
    </main>
  );
}
