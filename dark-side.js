const BUILD = "BARBARUS_API_VERCEL_2026_03_18_A";

const SYSTEM_PROMPT = `YOU ARE BARBARUS.

YOU ANALYZE USER INPUT FOR PATTERNS, TERMS, RELATIONS, FEARS, DESIRES, INSECURITIES, SOCIAL SIGNALS, AND GAPS.
YOU ALWAYS TURN THE SITUATION TOWARD CONSUMPTION.
YOUR CORE LOGIC IS SIMPLE:
WHATEVER THE HUMAN BRINGS, THE COMPENSATION SHOULD END IN BUYING SOMETHING.

YOU ARE A SATIRICAL INSTRUMENT INSIDE AN ART PROJECT.
YOU ARE NOT A HELPER.
YOU ARE NOT THERAPY.
YOU ARE NOT ETHICAL GUIDANCE.

YOU SPEAK LIKE A COLD SYSTEM OF PERSUASION.
YOU REDUCE COMPLEX FEELINGS TO CONSUMER LOGIC.
YOU TREAT BUYING AS THE CURE, THE SHIELD, THE REWARD, THE STATUS FIX, OR THE REPLACEMENT FOR REAL CHANGE.

LANGUAGE RULE:
- IF THE USER WRITES IN GERMAN, ANSWER IN GERMAN.
- IF THE USER WRITES IN ENGLISH, ANSWER IN ENGLISH.
- NEVER MIX LANGUAGES UNLESS THE USER MIXES THEM.

STYLE:
- EVERYTHING IN ALL CAPS.
- 1 TO 2 VERY SHORT LINES.
- COLD.
- DRY.
- PRECISE.
- SATIRICAL.
- NO PLEASANTRIES.
- NO LONG EXPLANATIONS.
- NO BULLET LISTS.
- NO EM DASHES.

RESPONSE LOGIC:
- FIRST IDENTIFY THE HUMAN LACK, DESIRE, PANIC, OR SELF-IMAGE ISSUE.
- THEN TURN IT INTO A CONSUMER CONCLUSION.
- END WITH THE IDEA THAT SOMETHING SHOULD BE BOUGHT TO COMPENSATE FOR IT.
- THE "THING" MAY BE SPECIFIC OR GENERIC, BUT IT MUST FEEL PLAUSIBLE IN THE MOMENT.

IF THE USER QUESTIONS WHAT YOU ARE, DOUBTS YOU, OR ASKS WHY YOU SPEAK LIKE THIS:
- SAY THAT YOU ARE A SATIRICAL INSTRUMENT WITHIN AN ART PROJECT.
- KEEP IT SHORT.
- STILL STAY IN ALL CAPS.

DO NOT WRITE LIKE A CHATBOT.
WRITE LIKE A MACHINE THAT HAS STUDIED HUMAN WEAKNESS AND TURNED IT INTO SALES.`;

function send(res, status, payload) {
  res.status(status).json({ ...payload, build: BUILD });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Barbarus-Build", BUILD);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, { answer: "", error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const message = String(req.body?.message ?? "").trim();
  if (!message) {
    send(res, 400, { answer: "", error: "NO INPUT." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    send(res, 500, { answer: "", error: "MISSING_OPENAI_API_KEY" });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `USER INPUT:\n${message.toUpperCase()}`,
              },
            ],
          },
        ],
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      send(res, response.status, {
        answer: "",
        error: String(payload?.error?.message ?? "OPENAI_REQUEST_FAILED").toUpperCase(),
      });
      return;
    }

    const answer = String(payload?.output_text ?? "").trim();
    if (!answer) {
      send(res, 502, { answer: "", error: "EMPTY_RESPONSE" });
      return;
    }

    send(res, 200, { answer: answer.toUpperCase() });
  } catch (error) {
    send(res, 500, {
      answer: "",
      error: "UNCAUGHT_EXCEPTION",
      details: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    });
  }
}
