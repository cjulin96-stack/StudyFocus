# Configurar o Professor IA do StudyFocus

O site usa Gemini TTS por meio de um Cloudflare Worker. A chave do Gemini fica somente como Secret no servidor; nunca coloque a chave no HTML, no GitHub ou no navegador.

> Como esta configuração envolve contas e credenciais de serviços externos, um responsável ou professor deve criar e administrar as contas e guardar a chave. Não envie a chave para o chat.

## 1. Criar o serviço de voz

1. Um responsável/professor entra no painel Cloudflare e cria um Worker chamado `studyfocus-voice`.
2. No editor do Worker, copie todo o conteúdo do arquivo `cloudflare-worker.js` deste repositório e publique.
3. Nas configurações do Worker, adicione um **Secret** chamado exatamente `GEMINI_API_KEY` e coloque nele a chave criada no Google AI Studio. Use Secret, não variável de texto comum.
4. Adicione um binding de **Rate Limiting** chamado exatamente `STUDYFOCUS_LIMITER`. Configure um limite inicial de 20 solicitações por 60 segundos e use um namespace ID numérico único da conta Cloudflare.
5. Publique novamente o Worker se o painel solicitar.

O limitador reduz abuso, mas é aproximado e pode contar usuários que compartilham o mesmo IP como um grupo. Ajuste o limite se uma turma inteira usar a mesma rede.

## 2. Conectar o site

1. Abra o StudyFocus e entre em uma aula.
2. Abra **Configurar conexão do Professor IA**.
3. Cole o endereço HTTPS do Worker, por exemplo o endereço `workers.dev` fornecido pelo Cloudflare.
4. Escolha a voz e toque em **Salvar conexão**.
5. Toque em **Professor IA** para gerar a narração.

O endereço do Worker é salvo apenas no armazenamento local deste navegador. A chave da API não é salva no site.

## 3. Observações

- O Worker usa o modelo `gemini-3.1-flash-tts-preview`, com saída de áudio em português brasileiro.
- O áudio é gerado quando o aluno toca no botão; esta primeira versão não é uma conversa por voz bidirecional.
- O plano gratuito da API tem limites e condições próprias. Consulte os termos e a página de preços antes de usar com uma turma.
- No nível gratuito do Gemini API, o Google informa que o conteúdo pode ser usado para melhorar os produtos. Não envie nomes, dados pessoais, notas individuais ou informações privadas de alunos.
- O áudio pode levar alguns segundos para ser gerado. Em alguns celulares, será necessário tocar no botão de reprodução do próprio player.
- A conexão só funciona no domínio oficial do GitHub Pages deste projeto, por segurança.
