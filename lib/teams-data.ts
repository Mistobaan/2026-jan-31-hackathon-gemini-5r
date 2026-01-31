export interface Player {
  id: string
  name: string
  number: number
  position: string
  imageUrl: string
}

export interface Team {
  id: string
  name: string
  city: string
  logo: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  players: Player[]
}

export const teams: Team[] = [
  {
    id: "patriots",
    name: "Patriots",
    city: "New England",
    logo: "/teams/patriots-logo.svg",
    primaryColor: "#002244",
    secondaryColor: "#C60C30",
    accentColor: "#B0B7BC",
    players: [
      {
        id: "pat-1",
        name: "Drake Maye",
        number: 10,
        position: "Quarterback",
        imageUrl: "/players/patriots/maye.jpg",
      },
      {
        id: "pat-2",
        name: "Rhamondre Stevenson",
        number: 38,
        position: "Running Back",
        imageUrl: "/players/patriots/stevenson.jpg",
      },
      {
        id: "pat-3",
        name: "Christian Gonzalez",
        number: 0,
        position: "Cornerback",
        imageUrl: "/players/patriots/gonzalez.jpg",
      },
    ],
  },
  {
    id: "seahawks",
    name: "Seahawks",
    city: "Seattle",
    logo: "/teams/seahawks-logo.svg",
    primaryColor: "#002244",
    secondaryColor: "#69BE28",
    accentColor: "#A5ACAF",
    players: [
      {
        id: "sea-1",
        name: "Geno Smith",
        number: 7,
        position: "Quarterback",
        imageUrl: "/players/seahawks/smith.jpg",
      },
      {
        id: "sea-2",
        name: "DK Metcalf",
        number: 14,
        position: "Wide Receiver",
        imageUrl: "/players/seahawks/metcalf.jpg",
      },
      {
        id: "sea-3",
        name: "Devon Witherspoon",
        number: 21,
        position: "Cornerback",
        imageUrl: "/players/seahawks/witherspoon.jpg",
      },
    ],
  },
]

export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id)
}

export function getPlayerById(teamId: string, playerId: string): Player | undefined {
  const team = getTeamById(teamId)
  return team?.players.find((player) => player.id === playerId)
}
