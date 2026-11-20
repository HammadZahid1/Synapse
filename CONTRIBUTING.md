# Contributing to Synapse

Thank you for contributing to Synapse! This is a frontend-only neural network visualization and training application.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Project Structure

- `src/lib/ml/` — Machine learning engine (matrix ops, network, backprop, training)
- `src/lib/datasets/` — Dataset generators and validation
- `src/lib/storage/` — IndexedDB persistence
- `src/features/` — Feature pages
- `src/components/` — Shared UI components
- `src/stores/` — Zustand state stores
- `src/hooks/` — Custom React hooks

## Commit Convention

We follow conventional commits:

- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance or tooling
- `refactor:` — Code refactoring
- `docs:` — Documentation changes
- `test:` — Adding or updating tests

## Testing

All ML engine and training code should have corresponding tests in `*.test.ts` files. Run `npm test` to execute the full suite.

## Pull Requests

1. Fork the repository
2. Create a feature branch from `master`
3. Make your changes with appropriate tests
4. Ensure `npm test`, `npm run lint`, and `npx tsc --noEmit` all pass
5. Open a pull request
