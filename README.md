# O Último Movimento

Jogo point-and-click de navegador com enigmas de lógica de programação, feito para o **Decifrathon** — evento do **IFSC, Câmpus Garopaba**, voltado a alunos do ensino médio.

A ideia é misturar investigação e atmosfera de terror/fantasia com desafios que usam raciocínio típico de programação (cifras, busca, booleanos, estruturas de decisão etc.), de forma jogável e acessível.

## O que você precisa

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- Um navegador atualizado (Chrome, Edge ou Firefox)
- Git (opcional, se for clonar o repositório)

Não é necessário instalar dependências com `npm install`: o projeto roda com o Node.js puro e arquivos estáticos.

## Como rodar

### 1. Baixar o projeto

Com Git:

```bash
git clone <url-do-repositorio>
cd "MARTE - VERSÃO FINAL"
```

Ou baixe o ZIP no GitHub (**Code → Download ZIP**), extraia a pasta e abra o terminal nela.

### 2. Subir o servidor local

Na pasta do projeto:

```bash
npm start
```

O comando `npm run dev` faz a mesma coisa.

O servidor sobe em:

```text
http://localhost:3456
```

Abra esse endereço no navegador.

> Se a porta `3456` estiver ocupada, você pode escolher outra:
>
> ```bash
> # Windows (PowerShell)
> $env:PORT=4000; npm start
>
> # Linux / macOS
> PORT=4000 npm start
> ```

### Alternativa sem o script do projeto

```bash
npm run start:static
```

Isso usa o pacote `serve` via `npx` para servir a pasta.

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm start` | Sobe o servidor de desenvolvimento |
| `npm run dev` | Igual ao `start` |
| `npm run start:static` | Serve os arquivos com `npx serve` |
| `npm test` | Testes do enigma E00 |
| `npm run test:e01` | Testes do enigma E01 |
| `npm run test:fluxo` | Testes de fluxo |
| `npm run test:ui` | Testes de interface |

## Como jogar (visão geral)

1. Abra `http://localhost:3456`
2. Explore os ambientes em primeira pessoa (point-and-click)
3. Resolva os enigmas para avançar
4. Use o **Inventário** para guardar e reler itens/documentos encontrados

O progresso fica salvo no navegador (`localStorage`).

## Estrutura do projeto (resumo)

```text
├── index.html          # Página principal
├── ambientes/          # Metadados e hotspots das salas
├── assets/             # Imagens e conceitos
├── scripts/            # Servidor local e testes
└── src/
    ├── app.js          # Entrada da aplicação
    ├── cenas/          # Salas / telas
    ├── enigmas/        # Lógica dos puzzles
    ├── interface/      # HUD, inventário, painéis
    └── core/           # Estado, áudio etc.
```

## Sobre o Decifrathon

O **Decifrathon** é um evento do **Instituto Federal de Santa Catarina (IFSC) — Câmpus Garopaba** em que os participantes enfrentam desafios de lógica e programação de forma lúdica. Este projeto foi desenvolvido como experiência interativa para esse contexto: enigmas embutidos numa narrativa explorável no navegador.

## Licença / uso

Projeto educacional para o Decifrathon (IFSC Garopaba). Uso e distribuição conforme combinado pela equipe do evento.
