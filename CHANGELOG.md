# Changelog

All notable changes to the **OpsAI (Kaizen Trade Intelligence Assistant)** will be documented in this file.

---

## [1.0.0] - 2026-06-27

### Added
- **RAG Backend core**: Persistent ChromaDB indexing and retrieval pipeline.
- **Provider-Independent LLM Factory**: Support for local Ollama (`mistral`, `llama3.1`) and cloud OpenAI-compatible APIs.
- **Vite React TypeScript Frontend**: Interactive sidebar navigator, chat threads, knowledge base uploads dropzone, and telemetry analytics dashboard.
- **Structured Chat Outputs**: Extracted alert cards for *Operational Insights*, *Common Risks*, and *Recommendations*.
- **CI/CD Pipeline**: GitHub actions CI configuration validating backend tests and Vite assets compilation.
- **Deployment Blueprints**: Attached `render.yaml` database-disk blueprints and Vercel routing configs.
- **Sample trade knowledge**: Created standard `sample_trade_knowledge.csv` with core shipping terms (FOB, CIF, HS Code).

### Optimized (Performance)
- **RAG Query Cache**: Implemented query caching returning repeated responses in ~0ms, reducing downstream LLM usage.
- **Retriever Thresholding**: Exposed similarity thresholding (`SIMILARITY_THRESHOLD`) and query limit (`TOP_K`) configurations in `.env`.

### Secured
- **Upload Size Validation**: Enforced 10MB file upload limit in API endpoints.
- **Allowed Extension Checks**: Restricts uploads strictly to `.pdf`, `.csv`, and `.txt` extensions.
- **CORS settings**: Deployed flexible origins setting variables.
