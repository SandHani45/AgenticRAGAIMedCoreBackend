import fetch from "node-fetch"; // Add this import at the top if not already present
import { Request, Response } from "express"; // Ensure Express types are imported

// ...existing code...

export async function askRAG(req: Request, res: Response) {
  // ...existing code...

  try {
    // ...existing code up to ragPrompt...

    // Call LLM API
    const llmResponse = await fetch("http://localhost:8787/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API error: ${llmResponse.statusText}`);
    }

    const data = await llmResponse.json();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "Failed to upload document" });
  }
}