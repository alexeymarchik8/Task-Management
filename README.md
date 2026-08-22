# Task Management

Монорепозиторий на npm workspaces.

## Структура

- `apps/client` — React + TypeScript + Vite
- `apps/server` — Express.js + TypeScript

## Команды (из корня)

```bash
npm install

npm run dev:client   # запустить клиент (http://localhost:5173)
npm run dev:server   # запустить сервер (http://localhost:3000)

npm run lint         # проверить линтером весь монорепо
npm run lint:fix
npm run format       # прогнать Prettier
npm run format:check
```
