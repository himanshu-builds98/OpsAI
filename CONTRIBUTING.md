# Contributing to OpsAI

We welcome contributions from developers, trade compliance experts, and students! By participating in this project, you agree to abide by our code of conduct and style guidelines.

---

## 🛠️ Local Development Setup

Follow the local setup instructions in the [README.md](../README.md) to bootstrap your backend and frontend.

### Style Guide
- **Python**: Enforce PEP 8 rules. We use `flake8` for syntax and layout linting.
- **TypeScript & React**: Follow clean React hooks and TypeScript typing standards. Ensure code formatting aligns with ESLint/Prettier.

---

## 🔄 Pull Request Guidelines

1. **Branch Naming**:
   - `feat/some-feature` for new developments.
   - `fix/some-bug` for bug fixes.
   - `docs/some-update` for documentation changes.
2. **Commit Messages**: Focus on descriptive messages mapping:
   - `feat: add LRU query caching to RAG pipeline`
   - `fix: resolve file size limits validator type mismatch`
3. **Lint & Test Verification**:
   Ensure all Python and TypeScript tests pass locally before committing:
   ```bash
   # In backend
   pytest backend/tests/
   
   # In frontend
   npm run build
   ```
4. **Decoupled Architecture**: Do not hardcode specific LLM models or database connection strings. Use `config.py` settings to preserve provider independence.
