# BERX — NEXT ARCHITECTURE / 250-SCREEN MASTER PLAN

Это отдельный архитектурный слой над существующим BERX-проектом. Он НЕ заменяет исходный код и НЕ утверждает, что 250 экранов уже реализованы.

Цель: зафиксировать единую production-архитектуру, доменную модель, контракты, вертикальные срезы и полный реестр 250 реальных UI surfaces/states, чтобы реализация шла без дублирования и ложных PASS.

## Канон
- Backend: OSSN/PHP/MySQL — единственный source of truth.
- Frontend: React Native + TypeScript; web client сохраняется как отдельный клиент до завершения rebind.
- Supabase: reference/history only, не runtime backend.
- API: `/api/v1/*`, один resource per REST file.
- Domain classes: бизнес-логика в PHP-классах; REST — тонкие adapters.
- UI: 250 meaningful screens/states, не 250 пустых routes.
- Statuses: PLANNED / IMPLEMENTING / STATIC_VERIFIED / RUNTIME_VERIFIED / BLOCKED / NOT_IMPLEMENTED.

## Как реализовывать
Каждый vertical slice проходит:
`schema → domain class → authorization → action → REST contract → API client → screen → loading/empty/error/success states → telemetry → runtime test → checkpoint`.

Нельзя закрывать vertical slice только созданием файла.
