# Campaign Settings

A D&D like Campaign Settings dashboard for role playing games

## Requirements

- Node.js >= 22
- pnpm (the version is pinned in `package.json`'s `packageManager` field; with
  Corepack enabled, `corepack enable` picks it up automatically)

This project uses **pnpm only** — there is no `package-lock.json`.

## Installation

- run `pnpm install`

## Configuration

### Create .env file

You need to create your `.env` file at the root of your project directory

```
POSTGRES_DB=your_DB_name
POSTGRES_USER=your_admin_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432
AUTH_SECRET=your-secret-key

DATABASE_URL="postgresql://admin:your_secure_password@localhost:5432/your_DB_name"
```

you can generate your-secret-key with this command:

`pnpm dlx auth secret`

### Generate Prisma client

- run `pnpm prisma generate`
- run `pnpm prisma db push` in order to create the db

### Populate your DB with initial data

You can populate your DB with some initial data, you can run this command: `pnpm db:seed`

### Run the code

- launch db server `docker-compose up`
- launch be/fe server: `pnpm dev`

You can also use the vsCode debug server configuration given in this project
