import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Iniciando verificação de vencimentos...");

    // Função auxiliar para buscar lojas por data
    const fetchExpiring = async (days) => {
      const target = new Date();
      target.setDate(target.getDate() + days);
      const dayStr = target.toISOString().split('T')[0];
      
      return await supabaseClient
        .from('stores')
        .select('id, name, owner_id, subscription_expires_at')
        .gte('subscription_expires_at', `${dayStr} 00:00:00`)
        .lte('subscription_expires_at', `${dayStr} 23:59:59`);
    };

    const { data: todayStores } = await fetchExpiring(0);
    const { data: soonStores } = await fetchExpiring(5);

    const notifications = [];

    todayStores?.forEach(store => {
      notifications.push({
        user_id: store.owner_id,
        title: "Assinatura Vence Hoje!",
        message: `Atenção! Sua assinatura do Z-Card para a loja ${store.name} vence hoje. Acesse Faturamento.`,
        type: 'critical'
      });
    });

    soonStores?.forEach(store => {
      notifications.push({
        user_id: store.owner_id,
        title: "Assinatura Vencendo em 5 Dias",
        message: `Olá! Sua assinatura para a loja ${store.name} vence em 5 dias. Evite bloqueios.`,
        type: 'warning'
      });
    });

    if (notifications.length > 0) {
      await supabaseClient.from('notifications').insert(notifications);
    }

    return new Response(JSON.stringify({ success: true, notifications: notifications.length }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
})
