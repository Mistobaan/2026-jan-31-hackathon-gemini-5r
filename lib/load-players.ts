interface PatriotsPlayerData {
  firstName: string
  lastName: string
  fullName: string
  position: string
  number: number
  height?: string
  heightFormatted?: string
  weight?: string
  age?: number
  experience?: string
  college?: string
  draftInfo?: string
  team: string
  season?: number
  stats?: Record<string, unknown>
  accolades?: string[]
}

interface SeahawksPlayerData {
  fullName: string
  position: string
  jerseyNumber: number
  height?: string
  weight?: number
  age?: number
  birthdate?: string
  experience?: number
  college?: string
  season2025Stats?: Record<string, unknown>
  careerHighlights?: string[]
}

export interface NormalizedPlayer {
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

async function loadPatriotsPlayers(): Promise<NormalizedPlayer[]> {
  const playerFiles = [
    'barmore_christian', 'boutte_kayshon', 'davis_carlton', 'diggs_stefon',
    'dobbs_joshua', 'douglas_demario', 'dugger_kyle', 'gonzalez_christian',
    'henderson_treveyon', 'henry_hunter', 'hollins_mack', 'hooper_austin',
    'maye_drake', 'spillane_robert', 'stevenson_rhamondre', 'white_keion'
  ]

  const players: NormalizedPlayer[] = []

  for (const fileName of playerFiles) {
    try {
      const response = await fetch(`/data/patriots/${fileName}.json`)
      if (!response.ok) continue

      const data: PatriotsPlayerData = await response.json()

      players.push({
        id: `patriots-${fileName}`,
        fullName: data.fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        number: data.number,
        position: data.position,
        imageUrl: `/data/patriots/${fileName}.png`,
        age: data.age,
        college: data.college,
        stats: data.stats,
        highlights: data.accolades
      })
    } catch (error) {
      console.error(`Failed to load ${fileName}:`, error)
    }
  }

  return players
}

async function loadSeahawksPlayers(): Promise<NormalizedPlayer[]> {
  const playerFiles = [
    'bobo_jake', 'darnold_sam', 'jones_ernest', 'kupp_cooper',
    'lock_drew', 'nwosu_uchenna', 'reed_jarran', 'saubert_eric',
    'shaheed_rashid', 'smithnjigba_jaxon', 'walker_kenneth',
    'williams_leonard', 'witherspoon_devon', 'woolen_riq'
  ]

  const players: NormalizedPlayer[] = []

  for (const fileName of playerFiles) {
    try {
      const response = await fetch(`/data/seahawks/${fileName}.json`)
      if (!response.ok) continue

      const data: SeahawksPlayerData = await response.json()

      const nameParts = data.fullName.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      players.push({
        id: `seahawks-${fileName}`,
        fullName: data.fullName,
        firstName,
        lastName,
        number: data.jerseyNumber,
        position: data.position,
        imageUrl: `/data/seahawks/${fileName}.png`,
        age: data.age,
        college: data.college,
        stats: data.season2025Stats,
        highlights: data.careerHighlights
      })
    } catch (error) {
      console.error(`Failed to load ${fileName}:`, error)
    }
  }

  return players
}

export async function loadTeamPlayers(teamId: string): Promise<NormalizedPlayer[]> {
  if (teamId === 'patriots') {
    return loadPatriotsPlayers()
  } else if (teamId === 'seahawks') {
    return loadSeahawksPlayers()
  }
  return []
}
