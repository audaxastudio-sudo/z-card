import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { getAsaasConfig } from "../_shared/asaas-config.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { store_id, asaas_customer_id, billingType = 'PIX', value = 14.90, cycle = 'MONTHLY', mode: explicitMode } = body
    
    // Obter configuração dinâmica (Sandbox ou Produção)
    const { apiKey: ASAAS_API_KEY, apiUrl: ASAAS_API_URL } = getAsaasConfig(explicitMode)

    if (!store_id || !asaas_customer_id) {
      throw new Error('store_id e asaas_customer_id são obrigatórios')
    }

    // 0. Verificar se já existe uma assinatura para esta loja
    const { data: currentStore } = await supabaseClient
      .from('stores')
      .select('asaas_subscription_id')
      .eq('id', store_id)
      .single()

    let subscriptionId = currentStore?.asaas_subscription_id
    let asaasData = null

    if (subscriptionId) {
      console.log(`Verificando assinatura existente: ${subscriptionId}`)
      const checkResponse = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
        headers: { 'access_token': ASAAS_API_KEY }
      })
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        // Se a assinatura está ativa ou pendente, vamos tentar reaproveitar
        if (checkData.status === 'ACTIVE' || checkData.status === 'PENDING') {
          subscriptionId = checkData.id
          asaasData = checkData
          console.log(`Assinatura ${subscriptionId} está ${checkData.status}.`)
        } else {
          console.log(`Assinatura ${subscriptionId} está ${checkData.status}, criando nova.`)
          subscriptionId = null
        }
      } else {
        subscriptionId = null
      }
    }

    if (!subscriptionId) {
      console.log(`Gerando NOVA assinatura ${cycle} para o cliente: ${asaas_customer_id}`)

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 3)

      const payload = {
        customer: asaas_customer_id,
        billingType: billingType,
        value: value,
        nextDueDate: dueDate.toISOString().split('T')[0],
        cycle: cycle,
        description: `Assinatura Z-Card - ${cycle === 'YEARLY' ? 'Plano Anual' : 'Plano Mensal'}`
      }

      const asaasResponse = await fetch(`${ASAAS_API_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
        body: JSON.stringify(payload)
      })

      asaasData = await asaasResponse.json()
      if (!asaasResponse.ok) throw new Error(`Erro Asaas (Sub): ${asaasData.errors?.[0]?.description || 'Erro desconhecido'}`)
      subscriptionId = asaasData.id
    }

    // 2. Buscar/Atualizar cobrança pendente
    let invoiceUrl = null;
    let pixData = null;

    console.log(`Buscando cobranças para assinatura ${subscriptionId}...`);
    const paymentsResponse = await fetch(`${ASAAS_API_URL}/payments?subscription=${subscriptionId}&status=PENDING`, {
      headers: { 'access_token': ASAAS_API_KEY }
    });
    const paymentsData = await paymentsResponse.json();
    
    let paymentToUse = (paymentsData.data && paymentsData.data.length > 0) ? paymentsData.data[0] : null;

    if (paymentToUse) {
      console.log(`Cobrança pendente encontrada: ${paymentToUse.id} (Vencimento: ${paymentToUse.dueDate})`);
      
      // Se a cobrança estiver vencida, vamos atualizar o vencimento para hoje + 3 dias
      const today = new Date();
      const dueDate = new Date(paymentToUse.dueDate);
      
      if (dueDate < today) {
        console.log(`Cobrança ${paymentToUse.id} está vencida. Atualizando vencimento...`);
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 3);
        
        const updateResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentToUse.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
          body: JSON.stringify({ dueDate: newDueDate.toISOString().split('T')[0] })
        });
        
        if (updateResponse.ok) {
          paymentToUse = await updateResponse.json();
          console.log(`Vencimento atualizado para ${paymentToUse.dueDate}`);
        }
      }
      
      invoiceUrl = paymentToUse.invoiceUrl;
      
      if (billingType === 'PIX') {
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentToUse.id}/pixQrCode`, {
          headers: { 'access_token': ASAAS_API_KEY }
        });
        pixData = await pixResponse.json();
      }
    } else {
      console.log("Nenhuma cobrança pendente encontrada. Aguardando geração automática do Asaas...");
      // Se não achou, pode ser que o Asaas ainda não gerou. Vamos dar um pequeno retry ou apenas informar o usuário.
    }

    // 3. Atualizar o ID da assinatura e status na tabela stores
    const { error: dbError } = await supabaseClient
      .from('stores')
      .update({ 
        asaas_subscription_id: subscriptionId,
        subscription_status: 'AWAITING_PAYMENT' 
      })
      .eq('id', store_id)

    if (dbError) throw new Error(`Erro ao salvar no banco: ${dbError.message}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        asaas_subscription_id: subscriptionId, 
        status: asaasData.status,
        invoiceUrl,
        pixData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro na function:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
