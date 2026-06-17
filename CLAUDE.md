# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VM Marketplace is a full-stack web application for deploying and managing virtual machines on HCS (Huawei Cloud) with AI-powered recommendations. Targets academic/research institutions in Tunisia.

## Commands

### Frontend

```bash
cd frontend
npm install
npm run dev       # Dev server at localhost:3000
npm run build
npm run lint
```

### Backend (FastAPI on :8000)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### AI Engine (FastAPI on :8001, separate process)

```bash
cd backend/ai_engine
pip install -r requirements.txt
python main.py
# Requires Ollama running at http://localhost:11434 with llama3.1 model
```

## Architecture

### Services

Three separate processes must run concurrently:

| Service | Port | Purpose |
|---|---|---|
| Next.js frontend | 3000 | UI |
| FastAPI backend | 8000 | Auth, VM CRUD, payments, Terraform |
| AI Engine | 8001 | LLM inference (Ollama/llama3.1) |

The AI Engine is intentionally separate to avoid blocking the main API during LLM inference.

### Key Data Flows

**VM Provisioning (Payment → VM)**
1. Frontend sends payment to `POST /api/payment/create-payment-intent`
2. Backend confirms payment, starts a background thread
3. Progress streamed to frontend via Server-Sent Events (SSE); tracked in-memory in `progress_store` dict (resets on restart)
4. `terraform_service.py` runs `terraform init` + `apply` per VM in `terraform_states/<vm_id>/`
5. After provisioning, a second thread SSHs in as root, waits 2 min for boot, installs Netdata
6. VM metadata + public IP stored in SQLite; confirmation email sent via Resend

**AI Recommendation Flow**
1. User submits natural language workload description
2. Backend proxies to AI Engine `POST /recommend-vm-from-text`
3. Ollama extracts structured JSON: `{workload, users, app_type, budget, confidence}`
4. `mapper.py` converts to a VM flavor_id + specs based on workload tier (low/medium/high)

**VM Build Wizard**
- Multi-step form (instance → OS → storage → network → region → review → payment)
- State managed globally in `BuildVMContext` (frontend context)
- Pricing calculated client-side

### Backend Structure (`backend/app/`)

- `main.py` — FastAPI app, CORS config, route registration
- `api/` — Route handlers: `auth.py`, `vm.py`, `payment.py`, `ssh.py`, `monitoring.py`, `manageone.py`
- `models/` — SQLAlchemy ORM: `user.py`, `virtual_machine.py`
- `schemas/` — Pydantic request/response types
- `core/security.py` — JWT creation/validation, bcrypt password hashing
- `services/terraform_service.py` — Runs Terraform CLI, SSHes into VMs to install Netdata
- `services/manageone_service.py` — ManageOne IAM OAuth2 + VDC quota queries (Huawei OpenStack-compatible)

### Frontend Structure (`frontend/app/`)

- `build-vm/` — Multi-step VM configuration wizard
- `dashboard/` — User VM management (list, delete, monitor, SSH)
- `ai-recommendation/` — Text-to-VM-spec via AI engine
- `marketplace/` — Pre-configured VM templates
- `monitoring/` — Netdata iframe dashboards
- `ssh/` — xterm-based SSH terminal
- `build-cluster/` — Multi-node cluster planning (plan preview only, no provisioning yet)
- `lib/api.ts` — All API client functions
- `BuildVMContext.tsx` — Global state for VM wizard

### Terraform

Each VM gets its own state directory: `terraform_states/<cloud_vm_id>/`. Variables auto-loaded from `.auto.tfvars.json`. Template lives in `terraform_test/`. VM deletion runs `terraform destroy` in the VM's state directory.

### VM Image Catalog

VM images are hardcoded in the frontend with HCS UUIDs. Some are marked `needs_id` (UUID not yet available in the cloud environment). When adding a new OS, update the static list in the build-vm step.

## Environment Variables

**Backend** (`backend/.env`):
```
SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
HCS_ACCESS_KEY=
HCS_SECRET_KEY=
HCS_EIP_ADDRESS=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
MANAGEONE_IAM_ENDPOINT=
MANAGEONE_SC_ENDPOINT=
MANAGEONE_USERNAME=
MANAGEONE_PASSWORD=
MANAGEONE_DOMAIN_NAME=
DATABASE_URL=sqlite:///./vm_marketplace.db
TERRAFORM_DIR=../terraform_test
TERRAFORM_STATES_DIR=../terraform_states
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Known Constraints

- **No tests** — the project has no test suite.
- **In-memory progress tracking** — `progress_store` in `payment.py` resets on restart; long provisioning (5–10 min) can orphan progress if the server restarts.
- **Terraform blocks** — `terraform apply` runs synchronously in a background thread; can take several minutes.
- **Hardcoded localhost** — API URLs target localhost in development; no multi-host config exists yet.
- **SSH with password** — Netdata installation uses root password auth (not key-based).
