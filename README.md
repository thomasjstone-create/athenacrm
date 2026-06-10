Athena CRM - Local Run

Quick start

1. Install dependencies

```bash
npm install
```

2. (Optional) Set webhook secret

```bash
export WEBHOOK_SECRET=your-secret
```

3. Start server

```bash
npm start
```

Server serves the original UI at `/` and exposes a contacts API at `/api/contacts`.
A webhook endpoint is available at `/api/webhook` which accepts JSON payloads in the forms:

- `{ "name": "Alice", "email": "a@a.com" }`
- `{ "contact": { "fullName": "Bob", "email_address": "b@b.com" } }`

If `WEBHOOK_SECRET` is set, include it as header `x-webhook-secret: your-secret` or in the body `secret` field.

Example webhook POST:

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret" \
  -d '{"contact": {"fullName":"Jane Doe","email_address":"jane@example.com","company":"ACME"}}'
```

Next steps

- Wire the frontend to call the API for full CRUD
- Add authentication and validation for production
