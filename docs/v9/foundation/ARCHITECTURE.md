# BERX Integration Architecture

Existing direction retained:
- OSSN/PHP + MySQL backend.
- BERX REST API under `/api/v1/`.
- React Native + TypeScript mobile client.
- Web client.
- Server-authoritative permissions and domain state.
- No fake/default functionality.

Flow:
Screen → Feature → Domain → API Client → `/api/v1/` → OSSN/MySQL

Screens never own business rules. They render domain state and dispatch commands.
Exact endpoint names must be mapped from the current BERX source; this archive intentionally does not invent backend endpoints.
