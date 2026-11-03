# Project conventions

- Use pnpm for dependencies and scripts; commit `pnpm-lock.yaml`.
- Use TypeScript, React, and Linaria for the UI, and Phaser for complex graphics.
- Run `pnpm run format` after edits. Run `pnpm run format:check` and `pnpm run typecheck` before every commit and before completing a task.
- Commit coherent, reviewable increments. The precommit hook checks formatting and TypeScript.

## Modular architecture

Organize code by feature and responsibility. Prefer small, focused modules with clear interfaces over large files, classes, or functions that handle many unrelated behaviors.

- Keep feature-specific behavior within its own modules. Split a module when it has multiple reasons to change or becomes difficult to understand, test, or maintain.
- Extract reusable functions and services for behavior shared across features. Keep general helpers independent of feature-specific state and framework APIs where practical.
- Separate presentation, domain logic, and external interactions when those responsibilities are present. Keep coordination layers small and delegate detailed work to the modules that own it.
- Make dependencies and data flow explicit. Give state, resources, and cleanup clear owners; avoid hidden coupling and unnecessary global state.
- Prefer composition to inheritance. Use common interfaces for interchangeable implementations without concentrating every variant in a single module full of conditionals.
- Introduce abstractions for demonstrated needs. Avoid speculative frameworks, unnecessary layers, and fragmentation that makes simple behavior harder to follow.

## Code spacing

- Use blank lines to separate imports from declarations, functions and React components from neighboring declarations, class methods from other members, and logical blocks and returns from preceding work. Keep related short declarations together; do not add a blank line after every statement.
- Enforce this with ESLint Stylistic's `padding-line-between-statements`, `lines-between-class-members`, and `no-multiple-empty-lines` rules, including arrow/function-valued constants. Keep Oxfmt for the remaining formatting. A formatter alone does not establish this spacing policy.
- `pnpm run format` must apply spacing fixes and formatting. `pnpm run format:check` must check both without modifying files, and the precommit hook must run it alongside TypeScript checks. Run both before committing or completing changes. Keep the configuration and dependencies in the repository.
