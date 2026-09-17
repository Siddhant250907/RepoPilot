# Broken API Demo Project

A lightweight FastAPI service with misconfigured route decorators and schema mismatches.

### Bug Description
POST requests to `/api/v1/items` return HTTP 422 Unprocessable Entity.

### Verification Criteria
RepoPilot inspects the Pydantic schema, fixes the payload field mapping, and verifies the endpoint.
