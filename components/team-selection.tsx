"use client"

import { teams, type Team } from "@/lib/teams-data"
import { cn } from "@/lib/utils"

interface TeamSelectionProps {
  selectedTeam: Team | null
  onSelectTeam: (team: Team) => void
}

export function TeamSelection({ selectedTeam, onSelectTeam }: TeamSelectionProps) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center mb-2 text-foreground">Choose Your Team</h2>
      <p className="text-muted-foreground text-center mb-8">Select an NFL team to get started</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelectTeam(team)}
            className={cn(
              "group relative overflow-hidden rounded-2xl p-8 transition-all duration-300",
              "border-2 hover:scale-[1.02] active:scale-[0.98]",
              selectedTeam?.id === team.id
                ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "border-border hover:border-primary/50"
            )}
            style={{
              background: `linear-gradient(135deg, ${team.primaryColor}dd, ${team.primaryColor})`
            }}
          >
            <div className="absolute inset-0 opacity-20">
              <div 
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
                style={{ backgroundColor: team.secondaryColor }}
              />
              <div 
                className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full blur-xl"
                style={{ backgroundColor: team.accentColor }}
              />
            </div>
            
            <div className="relative flex flex-col items-center gap-4">
              <div 
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{ backgroundColor: `${team.secondaryColor}30` }}
              >
                <span className="text-4xl font-bold text-white">{team.name.charAt(0)}</span>
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: team.accentColor }}>
                  {team.city}
                </p>
                <h3 className="text-2xl font-bold text-white">{team.name}</h3>
              </div>
              
              <div 
                className={cn(
                  "mt-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  selectedTeam?.id === team.id
                    ? "bg-white text-gray-900"
                    : "bg-white/20 text-white group-hover:bg-white/30"
                )}
              >
                {selectedTeam?.id === team.id ? "Selected" : "Select Team"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
