# Team 3si Dashboard Service

A simple and modern **Express + TypeScript** API, generated with [`create-express-api`](https://github.com/w3cj/create-express-api). Intended to serve as the backend for a React application.

---

## 🚀 Features

- ⚙️ Express server with TypeScript
- 🔄 Live reload with `ts-node-dev`
- 🌱 Environment variable support via `.env`
- 📦 Minimal and clean project structure
- 🧪 Basic `/api/hello` route for testing
- 🤝 CORS enabled for frontend integration

---

## 🛠 Setup & Development

### 1. Clone & Install

```bash
pnpm install
```

### 2. Environment Variables
Copy and configure your environment:

```bash
cp .env.sample .env
```

Edit .env as needed:

```bash
PORT=3000
```

### 3. Setup Https certs for local dev

Setup mkcert:
```bash
brew install mkcert
brew install nss  # if you use Firefox
```

then run and restart browser:
```bash
mkcert -install
```

Finally running this will create the cert directory with the needed .pem's:

```bash
pnpm mkcert
```

### 4. Run in Development

```bash
pnpm dev
```

Your API will be running at:

| Address Type       | URL                    |
|--------------------|------------------------|
| localhost          | https://localhost:3000 |
| IPv4 (127.0.0.1)   | https://127.0.0.1:3000 |
| IPv6 (::1)         | https://[::1]:3000     |

### ⚙️ Available Scripts
| Script | Purpose                          |
|--------|----------------------------------|
| start  | Run compiled app (production)    |
| dev    | Run in dev mode with live reload |
| mkcert | Run to generate HTTPS certs      |
| build  | Compile TypeScript to JS         |
| lint   | Run ESLint                       |



### Includes API Server utilities:

- [morgan](https://www.npmjs.com/package/morgan)
  - HTTP request logger middleware for node.js
- [helmet](https://www.npmjs.com/package/helmet)
  - Helmet helps you secure your Express apps by setting various HTTP headers. It's not a silver bullet, but it can help!
- [cors](https://www.npmjs.com/package/cors)
  - CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.

### Development utilities:

- [typescript](https://www.npmjs.com/package/typescript)
  - TypeScript is a language for application-scale JavaScript.
- [tsx](https://www.npmjs.com/package/tsx)
  - The easiest way to run TypeScript in Node.js
- [eslint](https://www.npmjs.com/package/eslint)
  - ESLint is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
- [vitest](https://www.npmjs.com/package/vitest)
  - Next generation testing framework powered by Vite.
- [zod](https://www.npmjs.com/package/zod)
  - Validated TypeSafe env with zod schema
- [supertest](https://www.npmjs.com/package/supertest)
  - HTTP assertions made easy via superagent.
