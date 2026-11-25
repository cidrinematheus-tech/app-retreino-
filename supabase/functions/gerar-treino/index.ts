// Supabase Edge Function: gerar-treino
// Configure OPENAI_API_KEY como secret da função. Nunca exponha essa chave no HTML.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sessão não encontrada.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("A chave OPENAI_API_KEY não foi configurada como secret.");

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Sessão inválida. Faça login novamente.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, name, data, coach_id, coach_nome")
      .eq("id", user.id)
      .single();
    if (profileError) throw new Error("Não foi possível ler o perfil do aluno.");
    if (profile.role !== "aluno") throw new Error("Esta função é exclusiva para contas de aluno.");

    const { data: plan } = await supabase
      .from("plans").select("dias").eq("aluno_id", user.id).maybeSingle();
    const { data: tests } = await supabase
      .from("tests").select("tipo, x, dados, resultado, created_at")
      .eq("aluno_id", user.id).order("created_at", { ascending: false }).limit(5);
    const { data: logs } = await supabase
      .from("logs").select("dia, minutos, pse, carga, detalhes, created_at")
      .eq("aluno_id", user.id).order("created_at", { ascending: false }).limit(10);

    const body = await req.json();
    const objective = String(body.objetivo || "Treino geral de força e saúde").slice(0, 300);
    const feeling = String(body.como_se_sente || "").slice(0, 1200);

    const instructions = `Você é um assistente de apoio ao exercício físico do ReTreino. Gere uma SUGESTÃO conservadora e educativa de sessão, nunca diagnóstico nem prescrição clínica. Use somente os dados fornecidos. Não invente idade, diagnóstico, equipamento, teste ou restrição. Se houver dor nova, intensa, inexplicada, piora, tontura, dor no peito, falta de ar incomum ou recomendação médica restritiva, não proponha treino: recomende interromper e procurar avaliação profissional. Não aumente carga automaticamente. Respeite o plano do treinador: não contradiga restrições ou plano conhecido. Se faltarem dados essenciais (idade, condições/restrições, experiência, equipamento ou plano), faça perguntas antes de sugerir exercícios. Forneça aquecimento, 3-5 exercícios simples com séries/repetições/RPE e pausas apenas quando houver informação suficiente, alternativas fáceis e sinais para interromper. Linguagem simples em português do Brasil. Deixe claro que o treinador deve validar a sugestão.`;

    const input = {
      aluno: { nome: profile.name, dados_do_perfil: profile.data, treinador: profile.coach_nome },
      plano_prescrito: plan?.dias ?? null,
      avaliacoes_recentes: tests ?? [],
      registros_recentes: logs ?? [],
      objetivo_de_hoje: objective,
      relato_de_hoje: feeling,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error?.message || "Erro no serviço de IA.");
    const treino = result?.choices?.[0]?.message?.content;
    if (!treino) throw new Error("A IA não retornou uma sugestão.");
    return new Response(JSON.stringify({ treino }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Erro interno." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
