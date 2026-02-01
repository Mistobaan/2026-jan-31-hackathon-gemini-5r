export interface Player {
  id: string
  fullName: string
  firstName: string
  lastName: string
  number: number
  position: string
  imageUrl: string
  age?: number
  college?: string
  stats?: Record<string, unknown>
  highlights?: string[]
}

export interface Team {
  id: string
  name: string
  city: string
  logo: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export const teams: Team[] = [
  {
    id: "patriots",
    name: "Patriots",
    city: "New England",
    logo: "/teams/patriots.svg",
    primaryColor: "#002244",
    secondaryColor: "#C60C30",
    accentColor: "#B0B7BC",
  },
  {
    id: "seahawks",
    name: "Seahawks",
    city: "Seattle",
    logo: "/teams/seahawks.svg",
    primaryColor: "#002244",
    secondaryColor: "#69BE28",
    accentColor: "#A5ACAF",
  },
]

export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id)
}
