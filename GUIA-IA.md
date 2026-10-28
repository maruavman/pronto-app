# Pronto + IA automática (versão de teste)

Esta pasta contém o app web e um Cloudflare Worker que chama a API Gemini sem expor a chave no GitHub Pages.

## Antes de começar
- O app continuará salvando as tarefas no navegador do aparelho.
- A chave Gemini deve ficar como **Secret** no Cloudflare, nunca em `app.js`, GitHub ou em mensagens.
- A camada gratuita da Gemini API pode ter limites, mudar e aplicar regras de uso. Consulte https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br .
- Não envie dados pessoais sensíveis nas tarefas. O texto da tarefa e os detalhes são enviados ao provedor de IA para análise.

## Passo 1 — Criar a chave Gemini
1. Abra https://aistudio.google.com/apikey e entre na sua conta Google.
2. Crie uma API key para a Gemini API e copie-a para um lugar temporário seguro.
3. Não coloque essa chave no repositório GitHub nem no código do app.

## Passo 2 — Criar o Worker seguro
1. Crie/entre em uma conta em https://dash.cloudflare.com/ .
2. Abra **Workers & Pages** e crie um Worker novo.
3. Abra o editor de código do Worker e substitua o exemplo pelo conteúdo de `cloudflare-worker.js` desta pasta; publique/deploy.
4. Nas configurações do Worker, em **Variables and Secrets**, crie um secret chamado `GEMINI_API_KEY` e cole sua chave Gemini.
5. Crie uma variável de texto chamada `ALLOWED_ORIGIN` com a origem exata do seu site GitHub Pages, por exemplo `https://SEU-USUARIO.github.io` (sem barra final). **Não inclua o nome do repositório**: o navegador envia apenas protocolo + domínio + porta no cabeçalho Origin. Use o domínio real do seu GitHub Pages; não use o exemplo literalmente.
6. Salve e publique novamente. Copie a URL do Worker, geralmente algo como `https://nome-do-worker.seu-subdominio.workers.dev`.

## Passo 3 — Conectar o app ao Worker
1. Abra `app.js` no GitHub, clique no lápis para editar.
2. Encontre `const AI_ENDPOINT = "COLE_AQUI_A_URL_DO_SEU_CLOUDFLARE_WORKER";`.
3. Substitua somente o texto entre aspas pela URL HTTPS real do seu Worker. Exemplo de formato: `const AI_ENDPOINT = "https://nome-do-worker.seu-subdominio.workers.dev";`.
4. Salve/commit a alteração.
5. Atualize o app no Safari. Se estiver instalado na Tela de Início e a versão antiga continuar aparecendo, feche e abra novamente; o service worker pode levar um instante para atualizar.

## Passo 4 — Testar
1. Adicione `Trocar óleo do carro`.
2. Aguarde alguns segundos. O painel **Inteligência do dia** deve mostrar uma orientação, prioridade sugerida e justificativa.
3. Adicione uma tarefa diferente e confirme que a análise se atualiza.
4. A IA **não altera** a caixa de urgente nem reordena a lista automaticamente; apenas recomenda prioridade para você decidir.

## Se não funcionar
- **Configuração pendente:** a URL do Worker ainda não foi colocada no `app.js`.
- **Não foi possível analisar / erro de rede:** confira se `ALLOWED_ORIGIN` corresponde exatamente à origem do GitHub Pages, sem caminho extra quando a origem não inclui caminho. A origem é protocolo + domínio + porta; para GitHub Pages use `https://SEU-USUARIO.github.io`, sem o caminho do repositório.
- **Erro 502:** confirme que o modelo `gemini-3.6-flash` está disponível para sua chave/conta e se há cota. Se a API informar modelo indisponível, abra a documentação oficial de modelos e troque `MODEL` no Worker por um modelo de texto que sua conta disponibilize.
- **Cota excedida:** aguarde a renovação dos limites; não ative faturamento sem querer.

## Segurança e limites
- O secret da API fica no Cloudflare Worker; não publique o valor.
- O CORS limita chamadas normais ao seu site, mas **não é autenticação forte**: alguém tecnicamente pode chamar a URL do Worker fora do navegador. Para uso público, adicione autenticação e rate limiting no Worker e monitore os limites da API. Para teste pessoal, mantenha a URL privada e monitore o uso.
- A camada grátis da Gemini API pode usar conteúdo para melhorar os produtos, conforme as condições indicadas pelo Google. Evite tarefas com senhas, dados bancários ou dados pessoais sensíveis.
- A cota gratuita não é uma promessa permanente nem necessariamente ilimitada.
