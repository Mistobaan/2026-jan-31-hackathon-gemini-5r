"use client"

import { useState, useEffect } from "react"
import type { Team, Player } from "@/lib/teams-data"
import { loadTeamPlayers } from "@/lib/load-players"
import { cn } from "@/lib/utils"
import { Check, Users, Search, Loader2 } from "lucide-react"
import Image from "next/image"

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
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadPlayers() {
      setLoading(true)
      try {
        const teamPlayers = await loadTeamPlayers(team.id)
        setPlayers(teamPlayers)
      } catch (error) {
        console.error("Failed to load players:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayers()
  }, [team.id])

  const isSelected = (player: Player) =>
    selectedPlayers.some((p) => p.id === player.id)
  const canSelectMore = selectedPlayers.length < maxPlayers

  const filteredPlayers = players.filter((player) =>
    player.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full">
      <div className="text-center mb-6">
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

      <div className="max-w-4xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by player name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {filteredPlayers.map((player) => {
            const selected = isSelected(player)
            const disabled = !selected && !canSelectMore

            return (
              <button
                key={player.id}
                onClick={() => !disabled && onTogglePlayer(player)}
                disabled={disabled}
                className={cn(
                  "group relative overflow-hidden rounded-xl transition-all duration-300",
                  "border-2 text-left",
                  selected
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : disabled
                      ? "border-border/50 opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary/50 hover:bg-card/80"
                )}
              >
                {selected && (
                  <div
                    className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center z-10"
                    style={{ backgroundColor: team.secondaryColor }}
                  >
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className="flex flex-col">
                  <div className="relative aspect-square w-full bg-muted overflow-hidden">
                    <Image
                      src={player.imageUrl}
                      alt={player.fullName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white opacity-20">
                      #{player.number}
                    </div>
                  </div>

                  <div className="p-3">
                    <div
                      className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white mb-2"
                      style={{ backgroundColor: team.primaryColor }}
                    >
                      #{player.number}
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-tight mb-1">
                      {player.fullName}
                    </h3>
                    <p className="text-xs text-muted-foreground">{player.position}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!loading && filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No players found matching your search.</p>
        </div>
      )}
    </div>
  )
}
