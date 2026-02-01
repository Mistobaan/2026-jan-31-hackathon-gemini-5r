"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "complete" | "error";
  thumbnail?: string;
}

interface GenerationProgressProps {
  sessionId: string;
  onComplete?: (result: {
    videoUrl: string;
    pose1Url: string;
    pose2Url: string;
  }) => void;
  onError?: (error: string) => void;
}

export function GenerationProgress({
  sessionId,
  onComplete,
  onError,
}: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: "selfie", label: "Upload Selfie", status: "pending" },
    { id: "pose1", label: "Generate Pose 1", status: "pending" },
    { id: "pose2", label: "Generate Pose 2", status: "pending" },
    { id: "video", label: "Create Video", status: "pending" },
  ]);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource(`/api/progress/${sessionId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "progress") {
        setProgress(data.progress || 0);
        setCurrentStatus(data.status);

        // Update step statuses based on progress
        setSteps((prev) => {
          const updated = [...prev];

          // Update selfie step
          if (data.progress >= 10) {
            updated[0].status = "complete";
            updated[0].thumbnail = data.assets?.selfie;
          } else if (data.status === "uploading_selfie") {
            updated[0].status = "in_progress";
          }

          // Update pose1 step
          if (data.progress >= 35) {
            updated[1].status = "complete";
            updated[1].thumbnail = data.assets?.pose1;
          } else if (data.status === "generating_pose1") {
            updated[1].status = "in_progress";
          }

          // Update pose2 step
          if (data.progress >= 65) {
            updated[2].status = "complete";
            updated[2].thumbnail = data.assets?.pose2;
          } else if (data.status === "generating_pose2") {
            updated[2].status = "in_progress";
          }

          // Update video step
          if (data.status === "complete") {
            updated[3].status = "complete";
            updated[3].thumbnail = data.assets?.video;
          } else if (data.status === "generating_video") {
            updated[3].status = "in_progress";
          }

          // Handle errors
          if (data.status === "error") {
            const currentIndex = updated.findIndex(
              (s) => s.status === "in_progress",
            );
            if (currentIndex !== -1) {
              updated[currentIndex].status = "error";
            }
          }

          return updated;
        });
      } else if (data.type === "done") {
        if (data.session?.status === "complete" && onComplete) {
          onComplete({
            videoUrl: data.session.assets.video,
            pose1Url: data.session.assets.pose1,
            pose2Url: data.session.assets.pose2,
          });
        }
      } else if (data.type === "error") {
        onError?.(data.error || "Unknown error");
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
      onError?.("Connection lost. Please refresh the page.");
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, onComplete, onError]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{getStatusLabel(currentStatus)}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
              step.status === "complete" &&
                "border-green-500 bg-green-50 dark:bg-green-950",
              step.status === "in_progress" &&
                "border-blue-500 bg-blue-50 dark:bg-blue-950",
              step.status === "error" &&
                "border-red-500 bg-red-50 dark:bg-red-950",
              step.status === "pending" && "border-border bg-muted/50",
            )}
          >
            {/* Status Icon */}
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                step.status === "complete" && "bg-green-500 text-white",
                step.status === "in_progress" && "bg-blue-500 text-white",
                step.status === "error" && "bg-red-500 text-white",
                step.status === "pending" && "bg-muted text-muted-foreground",
              )}
            >
              {step.status === "complete" && <Check className="h-6 w-6" />}
              {step.status === "in_progress" && (
                <Loader2 className="h-6 w-6 animate-spin" />
              )}
              {step.status === "error" && <X className="h-6 w-6" />}
              {step.status === "pending" && (
                <span className="text-lg font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Step Label */}
            <span className="text-sm font-medium text-center">
              {step.label}
            </span>

            {/* Thumbnail */}
            {step.thumbnail && step.id !== "video" && (
              <div className="mt-2 w-full aspect-video relative rounded overflow-hidden border">
                <Image
                  src={step.thumbnail}
                  alt={step.label}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Ready to start";
    case "waiting":
      return "Initializing session...";
    case "uploading_selfie":
      return "Uploading your photo...";
    case "generating_pose1":
      return "Generating first pose...";
    case "generating_pose2":
      return "Generating second pose...";
    case "generating_video":
      return "Creating your video...";
    case "complete":
      return "Complete!";
    case "error":
      return "Error occurred";
    default:
      return "Processing...";
  }
}
