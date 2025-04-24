# Adaptações no Workflow n8n para Uso de UUID

Para adequar o workflow do n8n ao novo esquema de banco de dados que utiliza UUIDs para os IDs de usuários, é necessário fazer as seguintes modificações:

## 1. Nodes de Criação/Consulta de Usuários

### Alterações no Node "Criar Usuário"

No nó `Criar Usuário` (criação de usuário), precisamos modificar a forma como o ID é gerado e tratado:

```javascript
// Modificação na query SQL para considerar o ID como UUID
const insertUserSQL = `
INSERT INTO public.users (
  id,
  username, 
  email, 
  password, 
  phone, 
  preferences, 
  created_at
) VALUES (
  gen_random_uuid(),  -- Gera um UUID aleatório
  '${username}', 
  '${email}', 
  '${hashedPassword}', 
  ${phone ? `'${phone}'` : 'NULL'}, 
  '${preferences}', 
  '${created_at}'
) RETURNING *;`;
```

### Alterações nas Buscas de Usuário

Para todos os nós que buscam ou referenciam usuários, é preciso adaptar as queries para trabalhar com UUID:

```javascript
// Exemplo de busca de usuário por email (mantenha o tipo de retorno como é, apenas mude a query)
const findUserSQL = `
SELECT * FROM public.users 
WHERE email = '${email}' 
LIMIT 1;`;
```

## 2. Criação de Categorias, Transações, Orçamentos e Metas

Para todos os nós que criam registros que referenciam usuários, é necessário modificar o formato do ID:

```javascript
// Exemplo para categorias
const createCategorySQL = `
INSERT INTO public.categories (
  name, 
  type, 
  color, 
  user_id, 
  created_at
) VALUES (
  '${name}', 
  '${type}', 
  '${color}', 
  '${userId}',  -- Note que agora precisa estar entre aspas simples por ser UUID
  '${created_at}'
) RETURNING *;`;
```

## 3. Tratamento de JSON no Workflow

Ao criar JSON para respostas ou para processar dados, lembre-se de tratar IDs de usuário como strings, não como números:

```javascript
// Exemplo: Formatar resposta de usuário
return {
  success: true,
  user: {
    id: userResult.id,  // Será uma string UUID
    username: userResult.username,
    email: userResult.email
  }
};
```

## 4. Operações SQL na Atualização de Metas

A lógica de atualização de metas baseadas em transações também precisa ser adaptada:

```javascript
const updateGoalsSQL = `
UPDATE public.goals
SET 
  current_amount = CASE 
    -- Cálculos conforme necessário
  END,
  updated_at = NOW(),
  is_completed = CASE 
    WHEN current_amount >= target_amount THEN true 
    ELSE is_completed 
  END
WHERE user_id = '${userId}';  -- Note as aspas para UUID
`;
```

## 5. Headers de Solicitação e Resposta

Certifique-se de que todos os headers de resposta HTTP estejam configurados corretamente, especialmente o `Content-Type` para JSON:

```javascript
response.setHeader('Content-Type', 'application/json');
```

## 6. Instruções para o Supabase

O esquema atualizado deve considerar como o Supabase lida com autenticação e UUIDs:

1. A tabela `auth.users` já é criada pelo Supabase e contém os dados de autenticação
2. Nossa tabela personalizada `public.users` deve ser sincronizada com `auth.users`
3. Utilizamos `auth.uid()` para obter o ID do usuário autenticado no momento

## 7. Fluxo de Autenticação Adaptado

O fluxo de autenticação deve ser adaptado para trabalhar com o sistema de autenticação do Supabase:

1. Registro: Dados enviados para Auth API do Supabase -> Gatilho cria entrada em nossa tabela de usuários
2. Login: Autenticação via API do Supabase -> Token JWT retornado -> Dados do perfil recuperados

## 8. Exemplo de JWT para Teste

Se necessário para testes, você pode criar um token JWT com a seguinte estrutura:

```json
{
  "sub": "uuid-do-usuario",
  "email": "usuario@exemplo.com",
  "role": "authenticated",
  "iat": 1619083586,
  "exp": 1650619586
}
```

Este token pode ser usado para simular um usuário autenticado no Supabase durante o desenvolvimento do fluxo do n8n.

## Conclusão

Estas adaptações garantirão que o workflow n8n funcione corretamente com o esquema de banco de dados atualizado do Supabase, aproveitando os recursos de autenticação e segurança da plataforma.