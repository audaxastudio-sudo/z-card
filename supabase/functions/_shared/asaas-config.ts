export const getAsaasConfig = (explicitMode?: string) => {
  const MODE = explicitMode || Deno.env.get('ASAAS_MODE') || 'sandbox';
  
  const config = {
    mode: MODE,
    apiKey: MODE === 'production' 
      ? Deno.env.get('ASAAS_PRODUCTION_API_KEY') 
      : Deno.env.get('ASAAS_SANDBOX_API_KEY'),
    apiUrl: MODE === 'production' 
      ? 'https://api.asaas.com/v3' 
      : 'https://sandbox.asaas.com/api/v3',
    webhookToken: MODE === 'production'
      ? Deno.env.get('ASAAS_PRODUCTION_WEBHOOK_TOKEN')
      : Deno.env.get('ASAAS_SANDBOX_WEBHOOK_TOKEN'),
    // Retornamos ambos os tokens para o Webhook conseguir validar sem saber o modo antes
    allTokens: {
      sandbox: Deno.env.get('ASAAS_SANDBOX_WEBHOOK_TOKEN'),
      production: Deno.env.get('ASAAS_PRODUCTION_WEBHOOK_TOKEN')
    }
  };

  return config;
};
