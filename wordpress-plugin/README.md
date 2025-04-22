# FinTrack - Plugin WordPress para Gestão Financeira

Este plugin WordPress integra o sistema FinTrack de gestão financeira ao seu site WordPress hospedado na Hostgator ou qualquer outro provedor de hospedagem WordPress.

## Descrição

O FinTrack é um sistema completo de gerenciamento financeiro pessoal que permite acompanhar receitas, despesas, orçamentos e metas financeiras. Este plugin oferece:

- Um shortcode `[fintrack]` para inserir o aplicativo em qualquer página ou post
- Uma página de administração no painel WordPress para gerenciar configurações
- Integração completa com Supabase para armazenamento de dados
- Interface customizável com opções de cores e nome personalizado

## Instalação

1. Faça o upload da pasta `fintrack` para o diretório `/wp-content/plugins/` ou instale diretamente pelo painel do WordPress.
2. Ative o plugin no menu 'Plugins' no WordPress.
3. Configure as credenciais do Supabase no menu 'FinTrack' no painel administrativo.

## Configuração

Para usar o FinTrack, você precisará ter uma conta no Supabase:

1. Acesse [Supabase](https://supabase.com) e crie uma conta gratuitamente.
2. Crie um novo projeto.
3. Obtenha a URL e a chave anon/public nas configurações do projeto.
4. Insira essas credenciais na página de configuração do FinTrack no WordPress.

## Uso

Para exibir o FinTrack em qualquer página ou post, basta inserir o shortcode:

```
[fintrack]
```

### Opções do Shortcode

O shortcode aceita vários parâmetros para personalização:

```
[fintrack view="dashboard" height="800px"]
```

**Parâmetros disponíveis:**

- `view`: Visão inicial (dashboard, transactions, budgets, goals)
- `height`: Altura do contêiner (ex: 800px)

## Requisitos

- WordPress 5.0 ou superior
- PHP 7.2 ou superior
- Conta no Supabase

## Suporte

Para obter suporte, entre em contato:
- Email: suporte@solandox.com
- Site: [solandox.com/suporte](https://solandox.com/suporte)

## Personalização

Você pode personalizar a aparência do FinTrack nas configurações do plugin:

1. **Cor Primária**: Defina a cor principal da interface
2. **Nome do Aplicativo**: Personalize o nome exibido no aplicativo
3. **URL do Webhook**: Configure um endpoint personalizado para processamento de dados (opcional)

## Licença

Este plugin é licenciado sob GPL v2 ou posterior.

© 2025 SolandoX - Todos os direitos reservados