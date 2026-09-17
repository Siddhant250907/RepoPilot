# Broken Login Demo Project

A demo authentication microservice with a token validation bug.

### Bug Description
Login requests fail intermittently due to missing timestamp verification in the JWT decoder.

### Verification Criteria
`npm test` or `pytest` passes after RepoPilot detects and fixes the token parsing error.
