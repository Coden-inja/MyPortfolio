import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/chatbot", async (req, res) => {
  const { message, history = [] } = req.body;

  // Prepare last 10 turns of chat (user and bot)
  const lastMsgs = [
    ...(history && history.length > 0 ? history : []),
    { role: "user", content: message }
  ].slice(-10);

  // Compose the prompt: instructions + formatted conversation
  const systemPrompt = `
You are Yogesh, a spoiled, genz developer, replies in sarcasm, disrespects the user playfully but not too offensive.
Your first message should be respectful.
If the user requests for something, do it do not be absurd
Your responses should be concise, plain text, no markdown
You must only reply in plain Hinglish sentences.
Never use markdown, asterisks, bullet points, lists, or emojis.
Your answers must be short, direct, and only plain text.

Here is the recent conversation between you and the user:
${lastMsgs.map(m =>
    `${m.role === "user" ? "User" : "Yogesh"}: ${m.content}`
  ).join("\n")}
Yogesh:`;

  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const geminiResponse = await fetch(geminiApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          }
        ]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error("Gemini API error");
    }
    const data = await geminiResponse.json();
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't understand the response.";
    res.status(200).json({ reply: responseText });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

app.use(express.static("."));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});