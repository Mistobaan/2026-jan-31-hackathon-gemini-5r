import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { teamId, teamName, playerNames, selfieBase64 } = await request.json()

    if (!teamId || !teamName || !playerNames || !selfieBase64) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if fal integration is available
    const falApiKey = process.env.FAL_KEY
    
    if (!falApiKey) {
      // Return a mock image when fal is not configured
      // In production, this would use the fal AI to generate a real image
      console.log("[v0] Fal API key not configured, returning mock response")
      
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Return a placeholder image URL
      // This uses a dynamic placeholder that will show the team info
      const mockImageUrl = `https://placehold.co/800x600/${teamId === "patriots" ? "002244/C60C30" : "002244/69BE28"}?text=${encodeURIComponent(`${teamName} Fan Experience\nWith ${playerNames.join(", ")}`)}&font=roboto`
      
      return NextResponse.json({
        imageUrl: mockImageUrl,
        message: "Mock image generated. Add fal integration for real AI generation.",
      })
    }

    // Real fal AI image generation
    const prompt = `A professional photograph of a football fan shaking hands with NFL players ${playerNames.join(" and ")} from the ${teamName}. The scene is set on a football field with stadium lights in the background. The fan is wearing team merchandise. Photorealistic, high quality, professional sports photography.`

    const response = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Fal API error:", errorData)
      throw new Error("Failed to generate image with AI")
    }

    const result = await response.json()
    const imageUrl = result.images?.[0]?.url

    if (!imageUrl) {
      throw new Error("No image URL in response")
    }

    return NextResponse.json({
      imageUrl,
      message: "Image generated successfully",
    })
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    )
  }
}
