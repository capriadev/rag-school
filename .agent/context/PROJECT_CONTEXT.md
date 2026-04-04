# Project Context

## Goal
Monorepo with separated runtimes for web and local training, sharing domain logic and contracts.

## Structure
- apps/web: Next.js chat/query runtime
- apps/train: local training runtime (Express)
- packages/*: shared modules

## Rules
- Keep business logic out of UI components.
- Shared logic must live in packages over time.
- Use small atomic commits.
