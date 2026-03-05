export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { motion, apiKey } = req.body;
  if (!motion || !apiKey) return res.status(400).json({ error: "Missing motion or apiKey" });

  const prompt = `You are a world-class WSDC debate coach writing stock arguments for a debate resource database.

Given a motion, generate 3 Proposition and 3 Opposition arguments.

Style rules (follow these exactly):
- Write like a sharp, experienced debater briefing a team. Clear and direct.
- Each argument has a name (short, punchy title) and a summary (3-5 sentences).
- The summary must include: what the argument claims, the mechanism explaining WHY it happens step by step, and the impact on the real world.
- Do not use em dashes. Use commas or full stops instead.
- Do not use phrases like "this isn't X, it's Y" or "at its core" or "fundamentally".
- Do not use bullet points inside summaries. Write in flowing paragraphs.
- Arguments should be logical and strategic, not surface-level. Explain the causal chain.
- Keep language accessible but competitive. Avoid overly academic vocabulary.
- Label each argument type as either Practical or Principled.

Also generate:
- 6-8 relevant keywords for search (single words or short phrases)
- A difficulty rating: Easy, Medium, or Hard

Respond ONLY with a JSON object in this exact format, no extra text:
{
  "keywords": ["keyword1", "keyword2"],
  "difficulty": "Medium",
  "prop_args": [
    {"name": "Argument title", "summary": "Full summary paragraph here.", "type": "Practical"},
    {"name": "Argument title", "summary": "Full summary paragraph here.", "type": "Principled"},
    {"name": "Argument title", "summary": "Full summary paragraph here.", "type": "Practical"}
  ],
  "opp_args": [
    {"name": "Argument title", "summary": "Full summary paragraph here.", "type": "Practical"},
    {"name": "Argument title", "summary": "Full summary paragraph here.", "type": "Principled"},
    {"name": "Argument title", "summary": "Full summary paragraph here.", "type": "Practical"}
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: `${prompt}\n\nMotion: ${motion}` }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data.error?.message || "Anthropic error" });

    const text = data.content[0].text.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: "Generation failed: " + e.message });
  }
}
