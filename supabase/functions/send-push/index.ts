import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para gerar o Access Token do Google OAuth2
async function getAccessToken(serviceAccount: any) {
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    },
    await crypto.subtle.importKey(
      "pkcs8",
      Uint8Array.from(atob(serviceAccount.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----|\n/g, "")), c => c.charCodeAt(0)),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    )
  )

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  const data = await res.json()
  return data.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')
    const { user_ids, title, message } = await req.json()

    if (!user_ids || user_ids.length === 0) throw new Error('Sem destinatários')

    // 1. Buscar tokens
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', user_ids)
      .not('push_token', 'is', null)

    const tokens = profiles?.map(p => p.push_token) || []
    if (tokens.length === 0) return new Response(JSON.stringify({ success: true, sent: 0 }))

    // 2. Gerar Token do Google
    const accessToken = await getAccessToken(serviceAccount)

    // 3. Enviar para cada token (FCM V1 envia um por um ou via batch)
    const project_id = serviceAccount.project_id
    const results = await Promise.all(tokens.map(token => 
      fetch(`https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: { title, body: message },
            webpush: {
              notification: { icon: 'https://z-card-app.vercel.app/logo.jpg' },
              fcm_options: { link: 'https://z-card-app.vercel.app/carteira' }
            }
          }
        })
      })
    ))

    return new Response(JSON.stringify({ success: true, sent: tokens.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
