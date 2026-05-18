# ManageOne API Integration

This project includes a minimal backend integration for Huawei ManageOne.

Current scope:

- Authenticate against ManageOne IAM.
- List VDCs.
- Query VDC quota details.
- Return a simplified quota summary for the frontend or debug tools.

No VDC, VDC user, AK/SK, or ECS resource is created by these endpoints yet.

## Environment Variables

Add these values to `backend/.env`:

```env
MANAGEONE_IAM_ENDPOINT=https://iam-apigateway-proxy.mesrscloud.rnu.tn
MANAGEONE_SC_ENDPOINT=https://sc.mesrscloud.rnu.tn:443
MANAGEONE_USERNAME=
MANAGEONE_PASSWORD=
MANAGEONE_DOMAIN_NAME=
MANAGEONE_VERIFY_SSL=false
```

Do not commit real credentials.

## Backend Endpoints

All endpoints require the platform user JWT token.

```text
GET /api/manageone/health
GET /api/manageone/vdcs
GET /api/manageone/vdcs/{vdc_id}/quotas
```

## Why This Matters

Terraform creates the ECS resource. ManageOne prepares and governs the cloud
context around that deployment:

- VDC selection
- VDC user management
- AK/SK generation
- quota validation
- cloud-side isolation and traceability

The first useful project step is quota validation before Terraform, to avoid
late failures such as `Quota pre-deduction failed`.
