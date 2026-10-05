# React + Vite

## Requirements

This app needs **Node.js 20.19 or newer** (`>=20.19`). Vite 8 and its plugins declare that range, and `package.json` sets the same `engines` field so `npm install` warns immediately if your Node is older, instead of failing later with a stack of engine errors.

Check your version with `node -v`. If it is below 20.19, install a current Node (for example with [nvm](https://github.com/nvm-sh/nvm)) before running `npm install`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
