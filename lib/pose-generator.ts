export interface PoseDescription {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export const INITIAL_POSES: PoseDescription[] = [
  {
    id: 'greeting',
    name: 'Friendly Greeting',
    description: 'A warm, friendly greeting moment',
    prompt: 'in a warm greeting pose, shaking hands with genuine smiles, friendly and welcoming atmosphere',
  },
  {
    id: 'casual-standing',
    name: 'Casual Standing',
    description: 'Standing together in a friendly, relaxed pose',
    prompt: 'standing side by side in a casual, friendly pose with slight smiles, natural body language',
  },
  {
    id: 'casual-handshake',
    name: 'Casual Handshake',
    description: 'A friendly handshake greeting',
    prompt: 'shaking hands in a casual, friendly greeting, both smiling warmly',
  },
  {
    id: 'side-by-side',
    name: 'Side by Side',
    description: 'Standing next to each other looking forward',
    prompt: 'standing shoulder to shoulder, both looking forward with confident expressions',
  },
];

export const ICONIC_POSES: PoseDescription[] = [
  {
    id: 'celebration',
    name: 'Victory Celebration',
    description: 'Exciting celebration moment together',
    prompt: 'celebrating together with excitement and energy, arms raised, big smiles, triumphant victory celebration pose',
  },
  {
    id: 'power-handshake',
    name: 'Power Handshake',
    description: '90-degree hand clasp showing unity and strength',
    prompt: 'gripping hands together at 90-degree angle in a powerful handshake, intense eye contact, showing unity and determination',
  },
  {
    id: 'fist-bump',
    name: 'Fist Bump',
    description: 'Dynamic fist bump celebration',
    prompt: 'doing an energetic fist bump with big smiles, celebrating together, dynamic pose',
  },
  {
    id: 'high-five',
    name: 'High Five',
    description: 'Enthusiastic high five in celebration',
    prompt: 'giving each other a high five with excitement and joy, arms extended upward',
  },
  {
    id: 'victory-pose',
    name: 'Victory Pose',
    description: 'Arms raised in victory celebration',
    prompt: 'both raising their arms in victory, celebrating together with triumphant expressions',
  },
  {
    id: 'team-huddle',
    name: 'Team Huddle',
    description: 'Close huddle showing team unity',
    prompt: 'in a tight huddle with arms around each other, showing team unity and brotherhood',
  },
  {
    id: 'chest-bump',
    name: 'Chest Bump',
    description: 'Athletic celebration chest bump',
    prompt: 'doing a celebratory chest bump with intensity and energy, athletic celebration pose',
  },
];

/**
 * Get a random initial pose
 */
export function getRandomInitialPose(): PoseDescription {
  return INITIAL_POSES[Math.floor(Math.random() * INITIAL_POSES.length)];
}

/**
 * Get a random iconic pose
 */
export function getRandomIconicPose(): PoseDescription {
  return ICONIC_POSES[Math.floor(Math.random() * ICONIC_POSES.length)];
}

/**
 * Get a specific pose by ID
 */
export function getPoseById(id: string): PoseDescription | undefined {
  return [...INITIAL_POSES, ...ICONIC_POSES].find((pose) => pose.id === id);
}

/**
 * Generate a full prompt for composite image generation
 */
export function generatePrompt(
  pose: PoseDescription,
  teamName: string,
  playerNames: string[],
  isInitialPose: boolean
): string {
  const playerList = playerNames.join(' and ');
  const setting = isInitialPose
    ? 'in a bright, professional NFL facility setting'
    : 'on an NFL stadium field with dramatic lighting';

  return `Professional sports photograph of a fan together with ${playerList} of the ${teamName}, ${pose.prompt}. ${setting}. High quality, photorealistic, cinematic lighting, sharp focus. NFL team colors visible. Action sports photography style.`;
}

/**
 * Generate a video transition prompt
 */
export function generateVideoPrompt(
  initialPose: PoseDescription,
  iconicPose: PoseDescription,
  teamName: string
): string {
  return `Smooth cinematic transition from ${initialPose.description} to ${iconicPose.description}. Professional sports video with dramatic ${teamName} stadium lighting. Dynamic camera movement. High quality video production. 5 seconds.`;
}
