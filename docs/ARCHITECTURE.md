# Architecture notes

## Starter architecture

```text
React + TypeScript (Vite)
        |
        | HTTP / JSON
        v
FastAPI REST API
        |
        v
Health endpoint (current starter)
```

## Planned evolution

```text
React UI -> FastAPI -> Scan orchestration -> Static analyzers
                          |                       |
                          v                       v
                     PostgreSQL             Normalized findings
                          |
                          v
                 AI explanation/fix service
                 (suggestions require review)
```

## Security principles

- Treat repository content as untrusted input.
- Do not execute uploaded code on the API process.
- Keep secrets in environment variables, never in Git.
- Require explicit authorization for GitHub operations.
- Separate deterministic analyzer output from AI-generated suggestions.
- If dynamic tests are introduced, run them in a hardened isolated environment with CPU, memory, time, filesystem, and network limits.
