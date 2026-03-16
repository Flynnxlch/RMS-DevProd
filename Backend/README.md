# MinLT Backend API

Backend API server for MinLT Risk Management System using Bun, Prisma, and PostgreSQL (Supabase).

## Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL database (Supabase recommended)
- Node.js 18+ (for Prisma CLI if not using Bun)

## Setup

> **New to Supabase?** See [RSetup.md](./RSetup.md) for a complete step-by-step guide from creating a Supabase project to running your first migration.

### 1. Install Dependencies

```bash
bun install
```

**Required packages to add:**
- `@prisma/client`
- `prisma` (dev dependency)
- `bcryptjs`
- `jsonwebtoken`
- `@types/bcryptjs` (dev dependency)
- `@types/jsonwebtoken` (dev dependency)

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase connection string:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/minlt?schema=public"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN="http://localhost:5173"
```

For Supabase, get your connection string from the Supabase dashboard:
1. Go to Project Settings > Database
2. Copy the connection string under "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password

### 3. Database Setup

#### Generate Prisma Client

```bash
bun run prisma:generate
```

#### Run Migrations

```bash
bun run prisma:migrate
```

This will:
- Create the initial migration
- Apply it to your database
- Generate the Prisma Client

#### Seed Database (Optional)

```bash
bun run prisma:seed
```

This creates:
- Admin user: `admin@adminlte.io` / `admin123`
- Admin Cabang user: `admincabang@adminlte.io` / `admin123`
- Regular user: `user@adminlte.io` / `user123`
- Sample risk with analysis, mitigation, and evaluation

## Development

### Start Development Server

```bash
bun run dev
```

The server will run on `http://localhost:3001` (or the port specified in `.env`).

### Prisma Studio

View and edit database data:

```bash
bun run prisma:studio
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (creates registration request)
- `GET /api/auth/me` - Get current user (requires auth)

### Risks

- `GET /api/risks` - Get all risks (filtered by user role)
- `POST /api/risks` - Create new risk
- `GET /api/risks/:id` - Get risk by ID
- `PUT /api/risks/:id` - Update risk
- `DELETE /api/risks/:id` - Delete risk
- `POST /api/risks/:id/analysis` - Create/update risk analysis
- `POST /api/risks/:id/mitigation` - Create/update risk mitigation
- `POST /api/risks/:id/evaluations` - Create/update risk evaluation

### User Requests

- `GET /api/user-requests/registration` - Get registration requests (admin only)
- `POST /api/user-requests/registration/:id/approve` - Approve registration (admin only)
- `POST /api/user-requests/registration/:id/reject` - Reject registration (admin only)
- `GET /api/user-requests/other` - Get other requests (admin only)
- `POST /api/user-requests/other` - Create other request
- `POST /api/user-requests/other/:id/approve` - Approve other request (admin only)
- `POST /api/user-requests/other/:id/reject` - Reject other request (admin only)

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/chart-data` - Get chart data

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Roles

- `ADMIN_PUSAT` - Can access all data across all regions
- `ADMIN_CABANG` - Can access data for their region only
- `USER_BIASA` - Can only access their own risks

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

### Key Models

- **User** - System users with roles and region assignments
- **Risk** - Risk entries with status tracking
- **RiskAnalysis** - Risk analysis data (inherent score/level)
- **RiskMitigation** - Mitigation plans with residual risk assessment
- **RiskEvaluation** - Monthly evaluations with current risk assessment
- **UserRegistrationRequest** - Pending user registration requests
- **OtherRequest** - Other user requests (admin access, password reset, etc.)

## Migration Workflow

### Create a new migration

```bash
bun run prisma:migrate
```

### Apply migrations to production

```bash
bunx prisma migrate deploy
```

### Reset database (development only)

```bash
bunx prisma migrate reset
```

## Troubleshooting

### Prisma Client not found

Run `bun run prisma:generate` to generate the Prisma Client.

### Database connection errors

1. Verify your `DATABASE_URL` in `.env`
2. Check that your database is accessible
3. For Supabase, ensure you're using the correct connection string format

### Migration errors

If migrations fail:
1. Check the error message for specific issues
2. Ensure your database user has proper permissions
3. For Supabase, check that the schema is set correctly in the connection string

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a strong `JWT_SECRET`
3. Update `CORS_ORIGIN` to your production frontend URL
4. Run migrations: `bunx prisma migrate deploy`
5. Start server: `bun run start`

## License

MIT
