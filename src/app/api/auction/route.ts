import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, bidAmount } = await req.json();

    if (!prompt || !bidAmount) {
      return NextResponse.json({ error: "Missing prompt or bid amount" }, { status: 400 });
    }

    // In a real application, you would store this bid in a Vercel Postgres database,
    // wait for an auction timer to expire, and then resolve the winner.
    // For this real-time demo, every bid "wins" instantly and generates an ad.

    // Using Pollinations.ai for free, no-key AI image generation!
    // In production, you would replace this with Google Gemini or OpenAI DALL-E 3.
    const encodedPrompt = encodeURIComponent(`A high quality advertisement billboard image for: ${prompt}`);
    
    // Append a random seed to bypass browser caching if the same prompt is used
    const randomSeed = Math.floor(Math.random() * 100000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=400&nologo=true&seed=${randomSeed}`;

    // Fetch the image on the server to bypass CORS issues for Three.js TextureLoader
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error("Failed to generate image");
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    return NextResponse.json({ 
      success: true, 
      message: "Auction won! Ad generated.",
      imageUrl: base64Image
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process bid" }, { status: 500 });
  }
}
