// Cloudflare Worker: proxy seguro para a API Gemini.
// Configure os secrets GEMINI_API_KEY e a variável ALLOWED_ORIGIN no painel Cloudflare.
const MODEL = "gemini-3.6-flash";
const jsonHeaders = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "";
    if (request.method === "OPTIONS") {
      if (!allowedOrigin || origin !== allowedOrigin) return new Response("Origem não permitida", { status: 403 });
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" } });
    }
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "Use POST." }), { status: 405, headers: jsonHeaders });
    if (!allowedOrigin || origin !== allowedOrigin) return new Response(JSON.stringify({ error: "Origem não permitida." }), { status: 403, headers: jsonHeaders });
    if (!env.GEMINI_API_KEY) return new Response(JSON.stringify({ error: "A chave da IA não está configurada." }), { status: 500, headers: { ...jsonHeaders, "Access-Control-Allow-Origin": allowedOrigin } });

    let body;
    try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "JSON inválido." }), { status: 400, headers: { ...jsonHeaders, "Access-Control-Allow-Origin": allowedOrigin } }); }
    const title = String(body.title || "").trim().slice(0, 160);
    const notes = String(body.notes || "").trim().slice(0, 500);
    if (!title) return new Response(JSON.stringify({ error: "Informe uma tarefa." }), { status: 400, headers: { ...jsonHeaders, "Access-Control-Allow-Origin": allowedOrigin } });

    const prompt = `Você é o assistente de tarefas do app Pronto. Analise uma única tarefa em português brasileiro. Não mude nem execute nada. Dê orientação prática, curta e realista. Não invente fatos específicos. Se faltarem dados, recomende como verificá-los. Prioridade é apenas uma SUGESTÃO ao usuário, não altere flags da tarefa. Seja cuidadoso com segurança, saúde, dinheiro e manutenção: não dê certeza sem contexto. Responda SOMENTE JSON válido com as chaves advice (1-3 frases curtas), priority (exatamente Alta, Média ou Baixa), reason (uma frase curta explicando). Tarefa: ${title}
Detalhes: ${notes || "não informados"}
Marcada urgente pelo usuário: ${body.urgent ? "sim" : "não"}
Envolve gasto: ${body.paid ? "sim" : "não"}
Custo estimado em reais: ${Number(body.cost) || 0}`;
    try {
      const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 220 } })
      });
      const data = await apiResponse.json();
      if (!apiResponse.ok) return new Response(JSON.stringify({ error: "A API de IA recusou a solicitação. Confira o modelo e os limites da conta." }), { status: 502, headers: { ...jsonHeaders, "Access-Control-Allow-Origin": allowedOrigin } });
      const raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
      const parsed = JSON.parse(raw);
      const result = {
        advice: String(parsed.advice || "Revise a tarefa e escolha um próximo passo prático.").slice(0, 600),
        priority: ["Alta", "Média", "Baixa"].includes(parsed.priority) ? parsed.priority : "Média",
        reason: String(parsed.reason || "A prioridade depende dos detalhes e do prazo.").slice(0, 300)
      };
      return new Response(JSON.stringify(result), { status: 200, headers: { ...jsonHeaders, "Access-Control-Allow-Origin": allowedOrigin } });
    } catch {
      return new Response(JSON.stringify({ error: "Não foi possível concluir a análise." }), { status: 502, headers: { ...jsonHeaders, "Access-Control-Allow-Origin": allowedOrigin } });
    }
  }
};
