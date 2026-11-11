<div align="center">

# ⇄ ROUTEX — Smart Query Router

**Multi-agent AI system built with CrewAI + Groq that routes every query to the right specialist agent.**

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-ff5a50)
![Groq](https://img.shields.io/badge/Groq-LLM-f55036)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)
![LangSmith](https://img.shields.io/badge/Tracing-LangSmith-1C3C3C)

</div>

## ✨ Features
- **Router agent** classifies each query as MATH, EXPLAIN, CODE, TRANSLATE, SUMMARIZE or WRITE (with confidence + reasoning)
- **6 specialist agents** (Math Expert, Teacher, Code Assistant, Translator, Summarizer, Writer)
- **Live routing map** that animates the path of every query
- **Agent chaining**: pipelines like Summarize → Translate (output of one agent feeds the next)
- **Conversation memory** toggle (last 4 turns sent as context) and **text-to-speech** on every answer
- **Auto / manual mode**, live intent hint while typing, voice input, markdown + code rendering, export to `.md`
- **Firebase** Google/Email login + **Firestore** cloud history (localStorage in demo mode)
- **Evaluation Lab** (batch accuracy test + confusion matrix via `/api/batch`)
- **Analytics dashboard** (KPIs, agent distribution, latency chart)
- **Rule-based fallback** if the LLM output is invalid; **LangSmith** traces for every run

## 🗂 Structure
```
smart-query-router/
├── api/index.py              # Vercel serverless entrypoint
├── backend/app/
│   ├── main.py               # FastAPI routes
│   ├── router_service.py     # classify -> specialist pipeline
│   ├── agents.py             # CrewAI agents + metadata
│   ├── heuristics.py         # fallback classifier
│   ├── tracing.py            # LangSmith helper
│   ├── config.py, schemas.py
├── frontend/
│   ├── index.html
│   ├── css/ (base, layout, components)
│   └── js/ (main, chat, viz, analytics, auth, store, firebase, api, config, ui, background)
├── tests/test_heuristics.py
├── docs/                     # PPT + report
├── vercel.json  firebase.json  firestore.rules  render.yaml
├── requirements.txt  .env.example
```

## 🚀 Run locally (Windows)
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # then add your keys
uvicorn backend.app.main:app --reload
```
Open http://127.0.0.1:8000 (the backend also serves the frontend locally).

## 🔭 LangSmith
Set `LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` in `.env` (and in Vercel env vars). Each request appears as a `smart_query_router` trace with child runs `router_agent_classify` and `specialist_agent_answer`.

## 🔥 Firebase setup
1. Console → create project → add **Web app** → copy config into `frontend/js/config.js`
2. Enable **Authentication** (Google + Email/Password) and **Firestore**
3. Put your project id in `.firebaserc`, then:
```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,hosting
```
If frontend is on Firebase Hosting, set `API_BASE` in `config.js` to your Vercel URL and add the Firebase domain to Authentication → Authorized domains.

## ▲ Vercel deploy
```bash
npm i -g vercel
vercel            # preview
vercel --prod
```
Add env vars in the Vercel dashboard: `GROQ_API_KEY`, `LANGSMITH_*`. 
> CrewAI is large. If Vercel reports the function exceeds the size limit, deploy the backend with `render.yaml` on Render and point `API_BASE` to it.

## 🧪 Tests and evaluation
```bash
pip install pytest && pytest          # unit tests
python tests/eval_fallback.py            # fallback classifier on 36 labelled queries (30/36 correct)
```
Use the **Evaluation Lab** in the UI to measure the LLM router on your own labelled queries.
