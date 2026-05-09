# Contributing to Arc

Thanks for your interest in contributing! 🚀

## Getting Started

1. Fork the repo
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Arc.git
   cd Arc
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

## Development Workflow

- Create a feature branch from `main`
- Make your changes
- Test locally with `npm run dev`
- Run `npm run build` to ensure no build errors
- Commit with clear messages
- Open a pull request

## Code Style

- This project uses **TypeScript** with strict mode
- Components are in `src/components/` organized by feature
- State management uses **Zustand** stores in `src/store/`
- Styling uses **TailwindCSS 4 + DaisyUI 5**
- Run `npm run format` before committing

## Commit Conventions

We follow conventional commits:

```
feat: add new feature
fix: fix a bug
docs: documentation changes
refactor: code restructuring
chore: build/config changes
style: formatting, missing semicolons (no code change)
```

## Questions?

Feel free to open an issue for discussion before making major changes.
