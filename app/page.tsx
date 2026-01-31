"use client"

import { useState } from "react"
import type { Team, Player } from "@/lib/teams-data"
import { TeamSelection } from "@/components/team-selection"
import { PlayerSelection } from "@/components/player-selection"
import { SelfieUpload } from "@/components/selfie-upload"
import { ImageGenerator } from "@/components/image-generator"
import { Stepper } from "@/components/stepper"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const STEPS = ["Select Team", "Choose Players", "Upload Selfie", "Generate"]

export default function NFLFanExperience() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [selfie, setSelfie] = useState<string | null>(null)

  const handleSelectTeam = (team: Team) => {
    if (selectedTeam?.id !== team.id) {
      setSelectedPlayers([])
    }
    setSelectedTeam(team)
  }

  const handleTogglePlayer = (player: Player) => {
    setSelectedPlayers((prev) => {
      const isSelected = prev.some((p) => p.id === player.id)
      if (isSelected) {
        return prev.filter((p) => p.id !== player.id)
      }
      if (prev.length >= 3) return prev
      return [...prev, player]
    })
  }

  const handleReset = () => {
    setCurrentStep(0)
    setSelectedTeam(null)
    setSelectedPlayers([])
    setSelfie(null)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedTeam !== null
      case 1:
        return selectedPlayers.length > 0
      case 2:
        return selfie !== null
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">N</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">NFL Fan Experience</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <Stepper steps={STEPS} currentStep={currentStep} />

        <div className="mt-8">
          {currentStep === 0 && (
            <TeamSelection
              selectedTeam={selectedTeam}
              onSelectTeam={handleSelectTeam}
            />
          )}

          {currentStep === 1 && selectedTeam && (
            <PlayerSelection
              team={selectedTeam}
              selectedPlayers={selectedPlayers}
              onTogglePlayer={handleTogglePlayer}
              maxPlayers={3}
            />
          )}

          {currentStep === 2 && (
            <SelfieUpload selfie={selfie} onSelfieChange={setSelfie} />
          )}

          {currentStep === 3 && selectedTeam && selfie && (
            <ImageGenerator
              team={selectedTeam}
              selectedPlayers={selectedPlayers}
              selfie={selfie}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Navigation */}
        {currentStep < 3 && (
          <div className="mt-12 flex items-center justify-center gap-4 max-w-md mx-auto">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 gap-2 bg-transparent"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
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
  )
}
