"use client"

import React from "react"

import { useCallback, useState } from "react"
import { Camera, Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SelfieUploadProps {
  selfie: string | null
  onSelfieChange: (selfie: string | null) => void
}

export function SelfieUpload({ selfie, onSelfieChange }: SelfieUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          onSelfieChange(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    [onSelfieChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Selfie</h2>
        <p className="text-muted-foreground">
          Add a photo of yourself to generate your fan experience
        </p>
      </div>

      {selfie ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-primary bg-card">
          <img
            src={selfie || "/placeholder.svg"}
            alt="Your selfie"
            className="w-full aspect-square object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3"
            onClick={() => onSelfieChange(null)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove photo</span>
          </Button>
        </div>
      ) : (
        <label
          htmlFor="selfie-input"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-12 rounded-2xl cursor-pointer transition-all duration-300",
            "border-2 border-dashed",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-card/50"
          )}
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground mb-1">
              Drag and drop your photo here
            </p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              JPG, PNG up to 10MB
            </span>
          </div>
          <input
            id="selfie-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleInputChange}
          />
        </label>
      )}

      {selfie && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
          <ImageIcon className="h-4 w-4" />
          <span>Photo uploaded successfully</span>
        </div>
      )}
    </div>
  )
}
