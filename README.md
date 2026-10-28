# Pronto — aplicativo web instalável (PWA)

## Recursos
- Cadastro, edição, exclusão e conclusão de tarefas.
- Marcação independente de urgência e necessidade de gasto.
- Custo estimado em reais e soma de orçamento pendente.
- Filtros: Todas, Urgentes, Com gasto e Concluídas.
- Tema claro/escuro.
- Armazenamento local no navegador e suporte a cache/offline após a primeira visita.
- Layout adaptado para iPhone, com suporte a área segura e botão de ação inferior.

## Instalação no iPhone
O app precisa ser servido por HTTPS para instalação confiável e funcionamento do service worker. O jeito mais simples é publicar gratuitamente no GitHub Pages ou Netlify.

### Opção A: GitHub Pages
1. No Linux, entre em https://github.com e crie uma conta, se precisar.
2. Crie um repositório público chamado `pronto-app`.
3. Envie todos os arquivos desta pasta para a raiz do repositório (index.html, style.css, app.js, manifest.webmanifest, sw.js e os dois ícones).
4. No repositório, abra **Settings → Pages**.
5. Em **Build and deployment**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
6. Aguarde o GitHub informar o endereço publicado, geralmente `https://SEU-USUARIO.github.io/pronto-app/`.
7. Abra esse endereço no Safari do iPhone.
8. Toque em **Compartilhar → Adicionar à Tela de Início → Adicionar**.

### Opção B: Netlify Drop
1. Entre em https://app.netlify.com/drop no Linux.
2. Extraia o ZIP e arraste a pasta `Pronto-Web` para a página do Netlify Drop (ou compacte o conteúdo da pasta e envie, conforme a interface).
3. Abra o endereço HTTPS criado no Safari do iPhone.
4. Toque em **Compartilhar → Adicionar à Tela de Início → Adicionar**.

## Aviso importante sobre dados
Nesta primeira versão, as tarefas ficam no armazenamento do navegador daquele aparelho. Não há conta, servidor de dados ou sincronização entre aparelhos. Se você limpar os dados do Safari, pode perder as tarefas. Antes de usar para algo importante, faça backup manual dos dados ou espere a próxima versão com exportação/backup.

## Teste local no Linux
Na pasta extraída, execute:
`python3 -m http.server 8000`
e abra `http://localhost:8000` no navegador do Linux. Isso serve para testar a interface, mas não instala como app no iPhone por si só.

## Limitações da primeira versão
- Sem notificações push ou lembretes agendados.
- Sem sincronização via iCloud.
- Sem backup automático.
- A fonte web pode carregar de Google Fonts enquanto houver internet; o app continua utilizável offline com fontes de sistema.
