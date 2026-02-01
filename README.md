# NFL Fan Experience App

An AI-powered application that generates cinematic videos of fans with their favorite NFL players using advanced image and video generation.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/entropysource/v0-nfl-fan-experience-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/ut3mAQYu0Pd)

## Features

- **Team Selection**: Choose between Patriots and Seahawks with team-branded UI
- **Player Selection**: Pick 1-3 players from your favorite team
- **Selfie Upload**: Upload your photo to be included in the experience
- **AI Video Generation**: Create a cinematic video showing you celebrating with NFL players
- **Progress Tracking**: Real-time progress updates during generation
- **Session Recovery**: Resume interrupted generations from where you left off
- **Asset Persistence**: All generated content stored securely in Vercel Blob

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **AI Generation**:
  - fal.ai Flux Dev for composite images
  - fal.ai Kling 01 for video generation
- **Storage**: Vercel Blob for asset persistence
- **UI Components**: Radix UI primitives

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- fal.ai API key ([Get one here](https://fal.ai/dashboard/keys))
- Vercel Blob storage token ([Create store here](https://vercel.com/dashboard/stores))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 2026-jan-31-hackathon-gemini-5r
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
```env
FAL_KEY=your_fal_key_here
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Select Your Team**: Choose between New England Patriots or Seattle Seahawks
2. **Pick Your Players**: Select 1-3 players you want to meet
3. **Upload Your Selfie**: Take or upload a clear photo of your face
4. **Generate Video**: Click "Generate Video" and watch the magic happen!
5. **Download & Share**: Once complete, download your video or share it with friends

## Generation Process

The app creates your fan experience in 4 steps:

1. **Upload Selfie** (0-10%): Your photo is uploaded to secure storage
2. **Generate Pose 1** (11-35%): AI creates an image of you with players in a casual pose
3. **Generate Pose 2** (36-65%): AI generates a second image with an iconic celebration pose
4. **Create Video** (66-100%): AI generates a cinematic video transitioning between the two poses

Each step is saved, so if interrupted, you can resume exactly where you left off.

## API Routes

- `POST /api/storage/session` - Create a new generation session
- `GET /api/storage/session/[sessionId]` - Retrieve session status
- `POST /api/storage/upload` - Upload assets to Blob storage
- `POST /api/generate-composite-image` - Generate composite images with AI
- `POST /api/generate-video` - Generate video from composite images
- `GET /api/progress/[sessionId]` - Server-Sent Events for real-time progress

## Cost Considerations

- **Flux Dev** (composite images): ~$0.05 per image × 2 = $0.10 per video
- **Kling 01** (video): ~$0.56 per 5-second video
- **Total per generation**: ~$0.66

Consider implementing usage limits or authentication for production use.

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── generate-composite-image/
│   │   ├── generate-video/
│   │   ├── progress/[sessionId]/
│   │   └── storage/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── generation-progress.tsx # Progress tracking UI
│   ├── image-generator.tsx     # Main generation orchestrator
│   ├── player-selection.tsx    # Player picker
│   ├── team-selection.tsx      # Team picker
│   └── ui/                     # Reusable UI components
├── lib/
│   ├── blob-storage.ts         # Vercel Blob utilities
│   ├── fal-client.ts           # fal.ai API wrapper
│   ├── pose-generator.ts       # Pose randomization
│   ├── teams-data.ts           # Team and player data
│   └── utils.ts
├── public/
│   ├── data/                   # Player images
│   │   ├── patriots/
│   │   └── seahawks/
│   └── teams/                  # Team logos
└── .env.local                  # API keys (not committed)
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Generation Fails
- Check that API keys are correctly set in `.env.local`
- Ensure you have sufficient credits in your fal.ai account
- Check browser console for detailed error messages

### Session Recovery Not Working
- Clear browser localStorage: `localStorage.removeItem('nfl-session-id')`
- Check that Vercel Blob storage is properly configured

### Video Not Playing
- Ensure browser supports HTML5 video
- Check that the video URL is accessible (Vercel Blob URLs are public)

## Deployment

Your project is live at:
**[https://vercel.com/entropysource/v0-nfl-fan-experience-app](https://vercel.com/entropysource/v0-nfl-fan-experience-app)**

Continue building on:
**[https://v0.app/chat/ut3mAQYu0Pd](https://v0.app/chat/ut3mAQYu0Pd)**

## Future Enhancements

- Add more NFL teams
- Support custom celebration poses
- Add voice narration to videos
- Implement user authentication
- Add social media sharing with previews
- Create video galleries

## License

MIT

## Credits

Built with ❤️ using Claude Code, fal.ai, and Vercel
