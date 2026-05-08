import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getAsaasConfig } from "../_shared/asaas-config.ts"

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // O Asaas envia um JSON no corpo da requisição POST
    const body = await req.json()
    const { event, payment } = body

    const { allTokens } = getAsaasConfig()

    // VALIDAR TOKEN DE SEGURANÇA (ASAAS-ACCESS-TOKEN)
    const asaasToken = req.headers.get('asaas-access-token')
    
    // Valida se o token recebido coincide com QUALQUER um dos nossos tokens (Sandbox ou Produção)
    const isValidToken = asaasToken && (asaasToken === allTokens.sandbox || asaasToken === allTokens.production);

    if (!isValidToken) {
      console.error('Tentativa de acesso não autorizada ao Webhook!')
      return new Response('Não autorizado', { status: 401 })
    }

    // Detectar automaticamente qual modo estamos usando para as chamadas subsequentes dentro desta execução
    const currentMode = asaasToken === allTokens.production ? 'production' : 'sandbox';
    const { apiKey: ASAAS_API_KEY, apiUrl: ASAAS_API_URL } = getAsaasConfig(currentMode);

    if (!payment || !payment.customer) {
      return new Response('Webhook recebido, mas sem dados de pagamento', { status: 200 })
    }

    console.log(`Recebido Webhook Asaas. Evento: ${event}, Cliente: ${payment.customer}`)

    // Variável para determinar o novo status da assinatura no banco
    let newStatus = null;

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        newStatus = 'ACTIVE';
        break;
      case 'PAYMENT_OVERDUE':
        newStatus = 'OVERDUE';
        break;
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        newStatus = 'CANCELLED';
        break;
      default:
        // Outros eventos que não alteram bloqueio/desbloqueio
        break;
    }

    if (newStatus) {
      // Procurar a loja que tem esse customer_id do Asaas
      const updateData: any = { subscription_status: newStatus };
      
      // Se o pagamento foi confirmado/recebido, buscamos a data do próximo vencimento na assinatura
      if ((event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') && payment.subscription) {
        try {
          const subResponse = await fetch(`${ASAAS_API_URL}/subscriptions/${payment.subscription}`, {
            headers: { 'access_token': ASAAS_API_KEY }
          });
          if (subResponse.ok) {
            const subData = await subResponse.json();
            // A expiração real é o próximo vencimento da assinatura
            updateData.subscription_expires_at = subData.nextDueDate;
          } else {
            // Fallback: se não conseguir ler a assinatura, adiciona 30 dias ao vencimento atual
            const expDate = new Date(payment.dueDate);
            expDate.setDate(expDate.getDate() + 30);
            updateData.subscription_expires_at = expDate.toISOString();
          }
        } catch (e) {
          console.error("Erro ao buscar próxima data de vencimento:", e);
        }
      }

      const { data: storeData } = await supabaseClient
        .from('stores')
        .select('id')
        .eq('asaas_customer_id', payment.customer)
        .single()

      const { error } = await supabaseClient
        .from('stores')
        .update(updateData)
        .eq('asaas_customer_id', payment.customer)

      if (error) {
        throw new Error(`Erro ao atualizar status da loja: ${error.message}`)
      }

      // NOVO: Registrar faturamento real se o pagamento for confirmado
      if ((event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') && storeData) {
        await supabaseClient.from('payments').upsert({
          store_id: storeData.id,
          asaas_payment_id: payment.id,
          amount: payment.value,
          status: event,
          payment_date: new Date().toISOString(),
          cycle: payment.subscription ? 'SUBSCRIPTION' : 'ONCE'
        }, { onConflict: 'asaas_payment_id' })
      }

      console.log(`Status atualizado para ${newStatus} e faturamento registrado.`)
    }

    // Retornar 200 OK para o Asaas parar de tentar reenviar o webhook
    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (error) {
    console.error('Erro ao processar webhook:', error.message)
    // Se for erro do nosso lado, retornamos 400 ou 500
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
