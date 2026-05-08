import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getAsaasConfig } from "../_shared/asaas-config.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratamento de CORS para chamadas do frontend
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Usamos a Service Role para ter permissão de atualizar a tabela
    )

    const body = await req.json()
    const { store_id, name, email, cpfCnpj, phone, address, addressNumber, complement, province, postalCode, mode: explicitMode } = body
    
    // Obter configuração dinâmica (Sandbox ou Produção)
    const { apiKey: ASAAS_API_KEY, apiUrl: ASAAS_API_URL } = getAsaasConfig(explicitMode)

    if (!store_id || !name) {
      throw new Error('store_id e name são obrigatórios')
    }

    // 1. Criar o cliente no Asaas
    console.log(`Criando cliente no Asaas para a loja: ${name}`)
    
    const isMobile = phone && phone.replace(/\D/g, '').length === 11;
    
    const asaasResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: name,
        email: email || `${store_id}@zcard.com.br`,
        cpfCnpj: cpfCnpj || null,
        phone: !isMobile ? phone : null,
        mobilePhone: isMobile ? phone : null,
        address: address || null,
        addressNumber: addressNumber || null,
        complement: complement || null,
        province: province || null,
        postalCode: postalCode || null
      })
    })

    const asaasData = await asaasResponse.json()

    if (!asaasResponse.ok) {
      console.error('Erro na API do Asaas:', asaasData)
      throw new Error(`Erro do Asaas: ${asaasData.errors?.[0]?.description || 'Erro desconhecido'}`)
    }

    const customerId = asaasData.id

    // 2. Atualizar o ID do cliente na tabela stores do Supabase
    const { error: dbError } = await supabaseClient
      .from('stores')
      .update({ asaas_customer_id: customerId })
      .eq('id', store_id)

    if (dbError) {
      throw new Error(`Erro ao salvar no banco: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, asaas_customer_id: customerId }),
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
