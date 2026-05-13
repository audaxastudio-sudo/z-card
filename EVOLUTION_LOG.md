# 📈 Z-CARD - Evolution Log

## [2026-05-07] - Restauração Pós-Formatação e Protocolos

**Status**: Concluído ✅

### Tarefas Realizadas:

- [x] Check-up inicial da estrutura do projeto.
- [x] Criação do `PROJECT_MANIFEST.md` (Escopo e Objetivos).
- [x] Criação do `TECH_STACK.md` (Tecnologias e Versões).
- [x] Criação do `DB_BLUEPRINT.md` (Modelagem de Dados).
- [x] Inicialização do `EVOLUTION_LOG.md`.
- [x] Implementação da "Chave Mestra" do Asaas (Sandbox/Production toggle).
- [x] Sincronização de Secrets no Supabase e Environment Variables no Vercel.
- [x] Validação do Google Maps API (Autocomplete corrigido).

---

## [Pendente] - Testes de Fluxo e Validação de Pagamentos

**Status**: Planejado ⏳

### Próximos Passos:

- [x] Testar criação de cliente no Asaas via Sandbox. ✅
- [x] Testar geração de assinatura/link de pagamento. ✅
- [x] Validar recebimento de Webhooks em ambiente de teste (Modo Universal). ✅
- [x] Correção de triggers de banco de dados e estabilidade Google Maps. ✅
- [x] Realizar primeiro "giro da chave" para produção em ambiente controlado. ✅

---

## [ATIVO] - Manutenção e Monitoramento de Produção

**Status**: Operacional 🚀

### Observações:

- Sistema operando com Asaas em modo Produção.
- Webhook configurado para detecção automática de ambiente.
- Google Maps estabilizado em todas as telas.
- **NOVO**: Sistema de Vouchers implementado e implantado com sucesso. ✅
- **NOVO**: Painel Admin atualizado com gestão de cupons. ✅
- **NOVO**: Geração de série completa de mockups técnicos fidedignos ao código (Dashboard, Display, Campanhas, Recompensas, PDV e Cartão do Cliente). ✅
- **NOVO**: Visibilidade de senha (Eye Icon) em todas as telas de autenticação. ✅
- **NOVO**: Redirecionamento automático de lojistas logados na Landing Page. ✅
- **NOVO**: Obrigatoriedade de preenchimento de perfil para membros. ✅
- **BUGFIX**: Correção na geração de QR Code de resgate no cartão do cliente. ✅
- **BUGFIX**: Lógica de concessão de acesso (+30 dias) no Painel Admin corrigida para somar períodos. ✅
- **Segurança & Autenticação:**
    *   Implementada trava de segurança por Role no login (impede Membros de acessarem Painel de Parceiros e vice-versa).
    *   Configuração de SMTP Customizado (Resend) para disparos de e-mail em escala.
    *   Criação de Templates HTML Premium para confirmação de conta e recuperação de senha.
- **Correções Críticas:**
    *   Resolvido erro 500 no `signUp` via correção da trigger `handle_new_user` (conflito de colunas inexistentes).
    *   Implementado redirecionamento inteligente pós-login e na Landing Page (identificação automática de Membro/Parceiro).
    
---

## [2026-05-13] - Ajustes de UX, Validação e PWA

**Status**: Concluído ✅

### Tarefas Realizadas:

- [x] Corrigida validação de e-mail duplicado no cadastro (verificação de `identities` do Supabase).
- [x] Implementada formatação automática `Title Case` em todos os campos de nome.
- [x] Ícones do PWA regenerados com fundo preto e enquadramento otimizado.
- [x] `manifest.json` atualizado com suporte a ícones `maskable` de alta resolução.

---

## [CONCLUÍDO] - Notificações Push & Expansão Admin ✅

**Status**: Finalizado e em Produção 🚀

### Realizações:

- [x] **Notificações Push Reais**: Integrados disparos via Firebase (FCM V1) para campanhas e comunicados.
- [x] **Busca Inteligente**: Implementado Autocomplete de usuários (nome/e-mail) no Painel Admin.
- [x] **Gestão de Membros**: Criada aba dedicada para administração de usuários Clientes/Membros.
- [x] **Ativação de Tokens**: Implementado `PushNotificationManager` para coleta e registro de tokens.
- [x] **Ajustes de UI**: Reestruturado cabeçalho do Admin para visualização premium e responsiva.
- [x] **Correção de Digitação**: Ajustada função `Title Case` para permitir espaços durante a escrita.
