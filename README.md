# OpsAI - AI Operations Copilot for Trade Intelligence

[![Build Status](https://github.com/himanshu-builds98/OpsAI/actions/workflows/ci.yml/badge.svg)](https://github.com/himanshu-builds98/OpsAI/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/Tech--Stack-React%20%7C%20FastAPI%20%7C%20ChromaDB-darkgreen.svg)](#-tech-stack--architecture)

**OpsAI** is a production-grade, RAG-based AI assistant built for import-export, logistics, supply chain operations, trade documentation, and compliance learning. Designed with a modular, provider-independent architecture, it supports local operations (Ollama) as well as cloud-native deployments (OpenAI-compatible APIs) with semantic search in ChromaDB.

---

## 🎯 Features

- **Decoupled RAG Pipeline**: Combines local SentenceTransformer embeddings (`BAAI/bge-small-en-v1.5`) and ChromaDB vector persistence with a decoupled LLM layer.
- **Provider-Independent LLM Factory**: Hot-swap between local Ollama instances (`mistral`, `llama3.1`) and cloud OpenAI configurations.
- **Dynamic Response Engine**: Custom response modes (Quick Explanation, Detailed Learning, and Comparison Tables) with auto intent detection.
- **Actionable Trade Insights**: Every answer includes parsed, styled alert blocks detailing **Operational Insights**, **Common Risks**, and **Recommendations**.
- **Performance Optimizations**:
  - **In-Memory Query Cache**: Repeated queries return in ~0ms, bypassing downstream retrieval and LLM processing.
  - **Tunable Retrieval**: Configurable similarity thresholds and `top_k` candidates.
- **Telemetry & Admin Dashboard**: Monitor API metrics (queries count, latency times, popular terms) and gaps analytics (failed queries).
- **Security-First Design**: Enforced 10MB file size upload limit, file-extension whitelisting (`.pdf`, `.csv`, `.txt`), CORS boundaries, and secure error parsing.
- 
---

## 🗺️ Future Roadmap

- [ ] **Cross-Lingual Support**: Implement multilingual trade jargon translation for international customs operators.
- [ ] **HS Code Classification Automation**: Add a specialized invoice scanner parsing cargo names to match and recommend Harmonized System codes.
- [ ] **Commercial Invoice Auto-Validation**: Feed parsed invoice data against Letter of Credit conditions to verify compliance.
- [ ] **Managed Chroma Cluster**: Migrate local persistent databases to managed cloud instances for horizontal scaling.
# OpsAI
