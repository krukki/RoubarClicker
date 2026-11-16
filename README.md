# Roubar Clicker

Clique na cara do Roubar, junte dinheiro e construa a República do Roubar.
Um jogo de clicker que roda direto no navegador, no celular e no PC, e salva
o progresso sozinho.

## Como jogar

- Clique na moeda para ganhar dinheiro.
- Compre construções (Dedo Nervoso, Clone do Roubar, Fazenda de Roubars...)
  para ganhar dinheiro sem clicar.
- Compre melhorias para dobrar a produção.
- Clique no Roubar Dourado quando ele aparecer: ele dá um bônus temporário.
- Embaixo da moeda fica a cidade: cada tipo de construção tem o próprio lote,
  os Clones andam pela rua com o rosto do Roubar e o céu muda com a hora do
  dia. Toque num lote para ver quanto ele rende e quais melhorias faltam.
- Toda melhoria muda alguma coisa na cidade (o cartão da melhoria na loja diz
  o quê). As melhorias de clique, imposto, decreto e Roubar Dourado ganham
  lotes próprios, e as Obras da República mudam a cidade inteira.
- Fique de olho: às vezes o Roubar Dourado se esconde entre os prédios.
- Quando juntar R$ 1 bilhão no total, você pode renascer: recomeça do zero,
  mas com um bônus permanente de produção.

O jogo salva sozinho a cada 30 segundos e continua rendendo (pela metade,
por até 8 horas) enquanto está fechado. Em Opções dá para gerar um código e
levar o progresso para outro aparelho.

## Publicar no GitHub Pages

1. No GitHub, abra o repositório e vá em **Settings > Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Escolha o branch **main** e a pasta **/ (root)** e clique em **Save**.
4. Depois de um ou dois minutos o jogo fica em
   `https://krukki.github.io/RoubarClicker/`.

No celular, abra o link e use "Adicionar à tela inicial" para instalar como
se fosse um aplicativo.

## Rodar no seu computador

Abra o arquivo `index.html` no navegador. Para testar também a instalação e
o modo sem internet, rode um servidor local:

```
npm start
```

e abra `http://localhost:8080`.

## Mudar os textos e as piadas

Todos os nomes, descrições, conquistas e notícias ficam em `js/data.js`.
Para trocar uma piada, edite só esse arquivo.

| Arquivo | O que tem |
|---|---|
| `index.html` | Estrutura da página |
| `css/style.css` | Visual |
| `js/data.js` | Construções, melhorias, conquistas e notícias |
| `js/game.js` | Regras: custos, produção, salvar, renascer |
| `js/ui.js` | Tela, animações e sons |
| `js/town-art.js` | Desenhos da cidade (SVG) |
| `js/town.js` | A cidade: construções, clones, dia e noite |
| `js/main.js` | Liga tudo e cuida do salvamento |
| `sw.js`, `manifest.webmanifest` | Instalação e modo sem internet |
| `tests/` | Testes automáticos das regras (`npm test`) |

## Ideias para depois

- Piadas internas da turma nos textos.
- Mais fotos, com expressões que mudam conforme o jogo.
- Ranking online entre amigos.
- Minijogos (roleta, raspadinha da República).
- Eventos de época (Natal, Carnaval, aniversário do Roubar).
- Skins de moeda desbloqueáveis.
- Árvore de melhorias permanentes compradas com Roubars de Ouro.
- Tradução para inglês.
