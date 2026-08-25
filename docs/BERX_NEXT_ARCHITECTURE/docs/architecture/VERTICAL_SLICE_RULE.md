# Vertical Slice Rule

A feature is implemented only when all layers exist and are connected:

1. MySQL schema / migration
2. OSSN component registration
3. PHP domain class
4. ownership + authorization
5. actions
6. `/api/v1/*` contract
7. shared TypeScript types
8. API client method
9. screen/navigation entry
10. loading state
11. empty state
12. error/retry state
13. success state
14. optimistic update only where safe
15. notification/side effect where required
16. analytics event
17. unit test
18. integration test
19. authenticated runtime test
20. checkpoint evidence

A screen can exist as PLANNED without implementation. A route can exist as a skeleton without being counted as implemented.
