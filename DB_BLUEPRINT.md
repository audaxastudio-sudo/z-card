# 🗄️ Z-CARD - DB Blueprint

## 🗺️ Mapa de Relacionamentos
- **Profiles** (1) <--- (N) **Stores**
- **Stores** (1) <--- (N) **Rewards**
- **Profiles** (1) <--- (N) **Loyalty Cards**
- **Stores** (1) <--- (N) **Loyalty Cards**
- **Loyalty Cards** (1) <--- (N) **Transactions**

---

## 📋 Tabelas

### 👤 `public.profiles`
Extensão da tabela de autenticação do Supabase.
- `id`: UUID (PK, FK auth.users)
- `full_name`: TEXT
- `role`: TEXT (Enum: 'merchant', 'customer')
- `avatar_url`: TEXT
- `created_at`: TIMESTAMP

### 🏪 `public.stores`
Estabelecimentos cadastrados na plataforma.
- `id`: UUID (PK)
- `owner_id`: UUID (FK profiles.id)
- `name`: TEXT
- `category`: TEXT
- `logo_url`: TEXT
- `description`: TEXT
- `address`: TEXT
- `created_at`: TIMESTAMP

### 🎁 `public.rewards`
Prêmios configurados pelos lojistas.
- `id`: UUID (PK)
- `store_id`: UUID (FK stores.id)
- `name`: TEXT
- `points_needed`: INTEGER
- `description`: TEXT
- `is_active`: BOOLEAN (Default: true)
- `created_at`: TIMESTAMP

### 💳 `public.loyalty_cards`
Vínculo de fidelidade entre um cliente e uma loja.
- `id`: UUID (PK)
- `customer_id`: UUID (FK profiles.id)
- `store_id`: UUID (FK stores.id)
- `stamps_accumulated`: INTEGER (Default: 0)
- `last_activity`: TIMESTAMP
- *Constraint*: UNIQUE(customer_id, store_id)

### 💸 `public.transactions`
Registro de movimentação de pontos (ganho ou resgate).
- `id`: UUID (PK)
- `card_id`: UUID (FK loyalty_cards.id)
- `type`: TEXT (Enum: 'earn', 'redeem')
- `amount`: INTEGER
- `description`: TEXT
- `created_at`: TIMESTAMP

### 🎫 `public.vouchers`
Cupons de assinatura ou benefícios.
- `id`: UUID (PK)
- `code`: TEXT (Unique)
- `benefit_days`: INTEGER
- `max_uses`: INTEGER
- `current_uses`: INTEGER
- `is_active`: BOOLEAN
- `created_at`: TIMESTAMP
- `expires_at`: TIMESTAMP
