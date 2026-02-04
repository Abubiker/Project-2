# Invoice/Billing Generator for Freelancers

MVP scaffold for an invoice generator with Express, Vue, and PostgreSQL.

## Structure
- `backend/` Express API with JWT auth and Postgres models
- `frontend/` Vue 3 + Vite UI scaffold

## Features in this scaffold
- Регистрация / вход
- Клиенты: список и добавление
- Счета: дашборд, создание счета, расчет итогов, авто-нумерация
- Автозаполнение: детали клиента подтягиваются при выборе
- Шаблоны счетов (валюта, налог, позиции, комментарий)
- Экспорт в PDF и отправка на email
- Заглушки для Stripe

## Quick start (local)
1. Create database and apply schema:
   - `backend/db/schema.sql`
2. Create `.env` from `backend/.env.example`
3. Install dependencies:
   - `npm install` in `backend/`
   - `npm install` in `frontend/`
4. Run:
   - `npm run dev` in `backend/`
   - `npm run dev` in `frontend/`

## Quick start (Docker)
1. `docker compose up --build`
2. Open `http://localhost:5173`

## Notes
- Для email нужен SMTP (переменные `SMTP_*` в `backend/.env.example`).
- Если база уже была создана, нужно применить изменения из `backend/db/schema.sql` (таблица `invoice_counters`).
