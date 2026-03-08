export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { chain } = req.body;
  if (!chain) return res.status(400).json({ error: "Missing chain" });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: "Groq API key not configured on server" });

  const chainText = chain.map((block, i) => `${i + 1}. [${block.type}] ${block.text}`).join("\n");

  const prompt = `You are an elite WSDC debate coach and aggressive skeptic. A debater has shown you their logic chain for a debate argument. Your job is to stress test it like a tough judge would in a real round.

Analyze each link in the chain and identify the SINGLE weakest link — the one an opponent could most easily attack to collapse the whole argument.

Logic chain:
${chainText}

Respond in this exact JSON format, no extra text:
{
  "weakest_link": <number of the weakest block, 1-indexed>,
  "verdict": "<one sharp sentence naming the weakness>",
  "attack": "<exactly how an opponent would phrase the rebuttal in a real round — 2-3 sentences, spoken like a debater, sharp and direct>",
  "fix": "<one concrete suggestion for how the debater can plug this gap — 2 sentences max>"
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 600,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data.error?.message || "Groq error" });

    const text = data.choices[0].message.content.trim().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: "Stress test failed: " + e.message });
  }
}
