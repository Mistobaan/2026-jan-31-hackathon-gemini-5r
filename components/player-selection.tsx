"use client"

import type { Team, Player } from "@/lib/teams-data"
import { cn } from "@/lib/utils"
import { Check, Users } from "lucide-react"

interface PlayerSelectionProps {
  team: Team
  selectedPlayers: Player[]
  onTogglePlayer: (player: Player) => void
  maxPlayers?: number
}

export function PlayerSelection({
  team,
  selectedPlayers,
  onTogglePlayer,
  maxPlayers = 3,
}: PlayerSelectionProps) {
  const isSelected = (player: Player) =>
    selectedPlayers.some((p) => p.id === player.id)
  const canSelectMore = selectedPlayers.length < maxPlayers

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Players</h2>
        <p className="text-muted-foreground">
          Choose up to {maxPlayers} {team.name} players to appear in your photo
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {selectedPlayers.length} / {maxPlayers} selected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {team.players.map((player) => {
          const selected = isSelected(player)
          const disabled = !selected && !canSelectMore

          return (
            <button
              key={player.id}
              onClick={() => !disabled && onTogglePlayer(player)}
              disabled={disabled}
              className={cn(
                "group relative overflow-hidden rounded-xl p-6 transition-all duration-300",
                "border-2 text-left",
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : disabled
                    ? "border-border/50 opacity-50 cursor-not-allowed"
                    : "border-border hover:border-primary/50 hover:bg-card/80"
              )}
            >
              {selected && (
                <div 
                  className="absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: team.secondaryColor }}
                >
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <div 
                  className="relative h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: team.primaryColor }}
                >
                  #{player.number}
                </div>

                <div className="text-center">
                  <h3 className="font-bold text-foreground text-lg">{player.name}</h3>
                  <p className="text-sm text-muted-foreground">{player.position}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
