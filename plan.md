# GlamAI - Frontend & Backend Integration Guide

## Project Overview

GlamAI is an AI-powered beauty analysis and makeup planning mobile application. This document outlines the integration between the Next.js frontend and FastAPI backend.

---

## Tech Stack

### Frontend (`/frontend`)
- **Framework**: Next.js 16.1.1 (App Router)
- **State Management**: Redux Toolkit + RTK Query
- **Authentication**: Context API with JWT tokens
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + Custom components
- **Icons**: Lucide React + Material Symbols

### Backend (`/backend`)
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Neon Cloud)
- **AI Services**: Azure AI (Vision, Speech, Search, OpenAI)
- **Storage**: Azure Blob Storage
- **Authentication**: JWT (HS256)

---

## Environment Setup

### Frontend Environment (`.env.local`)

Copy from `frontend/.env.example`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1

# Google OAuth (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Feature Flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
```

### Backend Environment

The backend requires Azure service credentials. See `backend/.env` for reference.

---

## API Connectivity

### Base Configuration

**Frontend API Base URL**: `${NEXT_PUBLIC_API_URL}/api/v1/`

**Token Storage**: LocalStorage
- `access_token` - JWT access token (30 min expiry)
- `refresh_token` - JWT refresh token (7 days expiry)

### Authentication Flow

1. **Registration/Login**
   - User submits credentials → Backend validates → Returns tokens
   - Frontend stores tokens in localStorage
   - AuthContext sets `isAuthenticated = true`

2. **Token Refresh**
   - On 401 error, `baseQuery.ts` automatically attempts refresh
   - If refresh succeeds, retry original request
   - If refresh fails, clear tokens and redirect to login

3. **Protected Routes**
   - `(protected)/layout.tsx` checks `authChecked` and `isAuthenticated`
   - Redirects to `/login` if not authenticated

---

## API Endpoints Reference

### Authentication (`/api/v1/auth`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/register` | POST | Register new user | No |
| `/login` | POST | Email/password login | No |
| `/oauth/google` | POST | Google OAuth sign-in | No |
| `/refresh` | POST | Refresh access token | No |
| `/me` | GET | Get current user profile | Yes |
| `/logout` | POST | Logout | Yes |

### Profile (`/api/v1/profile`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/analyze-face` | POST | Upload face image for AI analysis | Yes |
| `/allergies` | PUT | Update allergy profile | Yes |
| `/profile` | GET | Get user profile | Yes |
| `/dashboard` | GET | Get dashboard data | Yes |
| `/setup` | POST | Initial profile setup | Yes |
| `/update` | PUT | Update profile | Yes |

### Vanity/Products (`/api/v1/vanity`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/products` | GET | List all products | Yes |
| `/products` | POST | Add product manually | Yes |
| `/products/scan` | POST | Scan product (barcode/OCR) | Yes |
| `/products/{id}` | GET | Get product details | Yes |
| `/products/{id}` | PUT | Update product | Yes |
| `/products/{id}` | DELETE | Delete product | Yes |
| `/stats` | GET | Get vanity statistics | Yes |

### Events (`/api/v1/events`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | List events | Yes |
| `/` | POST | Create event | Yes |
| `/upcoming` | GET | Get upcoming events | Yes |
| `/{id}` | GET | Get event details | Yes |
| `/{id}` | PUT | Update event | Yes |
| `/{id}` | DELETE | Delete event | Yes |
| `/{id}/start-session` | POST | Start makeup session for event | Yes |

### Makeup Sessions (`/api/v1/makeup`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/start` | POST | Start new makeup session | Yes |
| `/{id}` | GET | Get session details | Yes |
| `/{id}/generate-plan` | POST | Generate AI makeup plan | Yes |
| `/{id}/complete-step` | POST | Mark step complete | Yes |
| `/{id}/submit-final` | POST | Submit final look | Yes |
| `/style-session` | POST | Create style session | Yes |
| `/{id}/hair-suggestion` | GET | Get AI hair suggestions | Yes |
| `/{id}/accessory-recommendation` | GET | Get accessory suggestions | Yes |

---

## Frontend Structure

```
frontend/
├── app/
│   ├── (auth)/              # Auth routes (login, signup)
│   ├── (protected)/         # Protected routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── face-analysis/   # Camera & results
│   │   ├── vanity/          # Product inventory
│   │   ├── events/          # Event scheduling
│   │   ├── profile/         # User profile
│   │   └── allergy-setup/   # Allergen configuration
│   ├── onboarding/          # First-time user flow
│   ├── splash/              # Splash screen
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Entry point
├── components/
│   ├── ui/                  # Button, Input, Card, Badge
│   └── common/              # BottomNav, Logo, Sparkle
├── redux/
│   ├── store.ts
│   ├── baseQuery.ts         # Auth token handling
│   └── services/            # RTK Query APIs
├── context/
│   └── AuthContext.tsx      # Auth state
└── lib/
    ├── utils.ts             # Helper functions
    ├── getBaseUrl.ts        # API URL config
    └── types/               # TypeScript interfaces
```

---

## Running the Application

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

**Access Points**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs (Swagger)

---

## Mobile-Only Design

The frontend is designed exclusively for mobile devices:
- Maximum width: 430px (centered on larger screens)
- Touch-optimized interactions
- Bottom navigation with FAB
- Safe area padding for notched devices
- No desktop breakpoints

---

## Key Features

1. **Face Analysis** - AI-powered skin analysis using Azure Vision
2. **Vanity Management** - Track and organize makeup products
3. **Product Scanning** - Barcode/OCR scanning with safety checks
4. **Allergy Profile** - Flag products with allergens
5. **Event Scheduling** - Plan makeup for upcoming events
6. **Makeup Sessions** - Step-by-step AI makeup guidance

---

## Design System

### Colors
- Primary: `#ee2b8c` (Pink/Magenta)
- Secondary: `#8b5cf6` (Purple)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Danger: `#ef4444` (Red)
- Background: `#f8f6f7` (Light) / `#221019` (Dark)

### Typography
- Display: Plus Jakarta Sans
- Serif: Playfair Display

### Components
- Rounded corners (8px - 24px)
- Gradient buttons
- Glass-morphism effects
- Animated sparkles

---

## Security Considerations

1. **Tokens** - Never commit tokens to git
2. **CORS** - Backend configured for localhost:3000
3. **HTTPS** - Required in production
4. **Input Validation** - Handled by Pydantic (backend) and Zod/form validation (frontend)

---

## Deployment Checklist

- [ ] Update `NEXT_PUBLIC_API_URL` for production
- [ ] Configure production database
- [ ] Set up Azure services (production credentials)
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and error tracking
