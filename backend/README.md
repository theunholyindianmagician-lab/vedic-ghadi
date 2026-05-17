# vedic-ghadi (Python)

Substrate-derived Vedic clock library + CLI + FastAPI service.

```bash
pip install -e .                # CLI only
pip install -e ".[server]"      # + FastAPI service
pip install -e ".[dev]"         # + pytest

vedic-ghadi
vedic-ghadi --loop
vedic-ghadi --at "2026-05-17 16:30" --json
uvicorn vedic_ghadi.api:app --port 8765
```

See the project root README for full architecture + deployment notes.
