const ALLOWED_ORIGIN = "https://cjulin96-stack.github.io";
const MODEL = "gemini-3.1-flash-tts-preview";
const VOICES = new Set(["Kore", "Puck", "Charon"]);

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (origin !== ALLOWED_ORIGIN) return json({ error: "Origem não autorizada." }, 403, headers);
    if (request.method !== "POST") return json({ error: "Use uma solicitação POST." }, 405, headers);
    if (!env.GEMINI_API_KEY) return json({ error: "A chave do serviço ainda não foi configurada no servidor." }, 503, headers);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "A solicitação não contém JSON válido." }, 400, headers); }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    const voiceName = VOICES.has(body.voiceName) ? body.voiceName : "Kore";
    if (!text) return json({ error: "O texto da aula está vazio." }, 400, headers);
    if (text.length > 7000) return json({ error: "Esta aula é muito longa. Divida o conteúdo em partes menores." }, 413, headers);

    const prompt = "Leia em português brasileiro, com voz de professor acolhedora, animada e natural. Explique com clareza, boa articulação, entonação expressiva e pausas naturais. Não leia estas instruções. Leia fielmente o conteúdo a seguir, sem inventar informações.\n\nINÍCIO DA AULA:\n" + text;
    let upstream;
    try {
      upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              languageCode: "pt-BR",
              voiceConfig: { prebuiltVoiceConfig: { voiceName } }
            }
          }
        })
      });
    } catch {
      return json({ error: "Não foi possível alcançar o serviço de voz. Tente novamente." }, 502, headers);
    }

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const detail = result.error && result.error.message ? result.error.message : "O serviço de voz recusou a solicitação.";
      return json({ error: detail.slice(0, 220) }, upstream.status === 429 ? 429 : 502, headers);
    }
    const parts = result.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find(part => part.inlineData?.data);
    if (!audioPart) return json({ error: "O serviço respondeu, mas não enviou áudio. Tente novamente." }, 502, headers);

    return json({
      audioBase64: audioPart.inlineData.data,
      sampleRate: 24000,
      mimeType: "audio/wav"
    }, 200, headers);
  }
};