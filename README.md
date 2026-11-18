# 🌿 Aves & Trilhas — Ecoturismo 4.0

> Plataforma de ecoturismo acessível e inclusiva — VALORA IFRJ.
> Com suporte a surdos, vibração háptica, detector de cantos ao vivo e IA.

🔗 **Demo ao vivo:** [https://valoraifrjaves.netlify.app/](https://valoraifrjaves.netlify.app/)

---

## ✨ Funcionalidades

- 🦜 **20 espécies de aves** com fichas completas (nome científico, bioma, status IUCN)
- 📸 **Fotos automáticas** via Wikipedia/Wikimedia Commons API
- 🗺️ **Mapa interativo** com Leaflet.js — trilhas e GPS em tempo real
- 🛤️ **3 trilhas** com expansão, fotos e dados ecológicos
- 📝 **Quiz ecológico** — 5 perguntas por trilha (15 no total)
- 📳 **Vibração háptica** ao explorar cards de aves
- 🔔 **Sistema visual para surdos** — flash de tela + banner visual (sem depender de som)
- 🎤 **Detector de aves ao vivo** — microfone + Web Audio API analisa sons em tempo real
- 🤖 **IA de identificação** — identifica aves em fotos via Claude Vision API
- 📋 **Registro de avistamentos** salvo localmente (localStorage)
- 📱 **100% mobile-first** — otimizado para 430px

---

## 🗂️ Estrutura

```
valorateste/
├── index.html              ← HTML limpo (332 linhas)
├── README.md
└── src/
    ├── styles/
    │   ├── variables.css   ← Design tokens (cores, fontes, espaçamentos)
    │   └── base.css        ← Todos os componentes UI
    ├── data/
    │   ├── aves.js         ← 20 aves com dados completos + fotos base64
    │   ├── sons.js         ← Áudios base64 dos cantos
    │   ├── trilhas.js      ← 3 trilhas + 15 questões de quiz
    │   └── perfis-som.js   ← Perfis do sintetizador Web Audio
    └── modules/
        ├── ui.js           ← Acessibilidade / leitores de tela
        ├── som.js          ← Web Audio API + síntese de cantos
        ├── fotos.js        ← Carregamento automático via Wikimedia
        ├── aves.js         ← Galeria + modal + player de canto
        ├── trilhas.js      ← Trilhas expansíveis
        ├── quiz.js         ← Engine do quiz
        ├── camera.js       ← Câmera + identificação por IA
        ├── registros.js    ← Sistema de avistamentos (localStorage)
        ├── mapa.js         ← Leaflet + GPS + Overpass API
        ├── notif.js        ← Notificações visuais para surdos
        ├── detector.js     ← Detector de aves pelo microfone
        └── main.js         ← Ponto de entrada e inicialização
```

---

## 🚀 Como usar

### Abrir direto no navegador
Baixe a pasta completa e abra `index.html` localmente.
> ⚠️ Algumas funções (câmera, microfone, GPS, fotos Wikimedia) precisam de servidor HTTP.
> Use Live Server no VSCode ou `python -m http.server 8080`.

### GitHub Pages (recomendado)
1. **Settings → Pages**
2. Source: `Deploy from a branch` → `main` → `/ (root)`
3. Save → disponível em `https://luiz1717.github.io/valorateste/`

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 / CSS3 / JavaScript | Base da aplicação |
| [Leaflet.js 1.9.4](https://leafletjs.com/) | Mapa interativo |
| [Google Fonts — Lora + DM Sans](https://fonts.google.com/) | Tipografia |
| Wikipedia REST API | Fotos automáticas das aves |
| Wikimedia Commons API | Fallback de fotos |
| Web Audio API | Síntese de cantos + detector ao vivo |
| Vibration API | Feedback háptico |
| MediaDevices API | Detector de cantos (microfone) |
| Claude Vision API | Identificação de aves por foto |
| OpenStreetMap + Overpass | Mapa e trilhas GPS |
| VLibras | Plugin de acessibilidade em Libras |

---

## ♿ Acessibilidade para Surdos

Este projeto implementa um sistema especialmente desenvolvido para usuários surdos:

- **Flash de tela** em vez de alertas sonoros
- **Banners visuais** de alta visibilidade para notificações
- **Vibração háptica** sincronizada com os cantos das aves
- **Barras de frequência animadas** representando o canto visualmente
- **VLibras** integrado para conteúdo em Língua Brasileira de Sinais
- Sem dependência de áudio para nenhuma funcionalidade essencial

---

## 📄 Licença

Projeto acadêmico — IFRJ / Projeto VALORA.

---

*Desenvolvido com 💚 para o ecoturismo acessível brasileiro.*
