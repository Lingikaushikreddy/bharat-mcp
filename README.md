# bharat-mcp

[![CI](https://github.com/Lingikaushikreddy/bharat-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Lingikaushikreddy/bharat-mcp/actions/workflows/ci.yml)

Model Context Protocol (MCP) servers for Indian fintech and govtech APIs, so an AI assistant can work with systems like Razorpay and the GST Network through one typed interface.

> **Status: early development.** The monorepo, shared library and Razorpay API client are in place. The MCP servers themselves are scaffolds and don't expose tools yet. See [Roadmap](#roadmap).

## What's here

| Package                                                           | What it contains                                                                                               | Status                                         |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [`@bharat-mcp/shared`](packages/shared)                           | Common types, Zod schemas and a tool-wrapper for input validation, an error hierarchy, and a structured logger | Implemented                                    |
| [`@bharat-mcp/mcp-server-razorpay`](packages/mcp-server-razorpay) | `RazorpayClient`: authenticated calls to the Razorpay REST API with request timeouts and retry backoff         | Client implemented; MCP tools not yet wired up |
| [`@bharat-mcp/mcp-server-gstn`](packages/mcp-server-gstn)         | Server entry point for GST Network tools                                                                       | Scaffold                                       |

## Getting started

Requires Node.js 20+ and pnpm 9+.

```bash
git clone https://github.com/Lingikaushikreddy/bharat-mcp.git
cd bharat-mcp
pnpm install
pnpm build        # turbo run build across all packages
pnpm test         # vitest
pnpm lint
pnpm type-check
```

The Razorpay client reads credentials from the environment:

```bash
export RAZORPAY_KEY_ID=rzp_test_xxx
export RAZORPAY_KEY_SECRET=xxx
```

Use Razorpay **test mode** keys while developing.

## Repository layout

```
packages/
  shared/                 common schemas, errors, logger, utilities
  mcp-server-razorpay/    Razorpay client + MCP server entry point
  mcp-server-gstn/        GSTN MCP server entry point
turbo.json                Turborepo pipeline
```

## Roadmap

Planned work is written up in [`PRD.md`](PRD.md) and [`DEVELOPMENT_PHASE_REPORT.md`](DEVELOPMENT_PHASE_REPORT.md).

- [x] Turborepo monorepo, TypeScript config, lint/format, CI
- [x] Shared schemas, errors and logger
- [x] Razorpay REST client with retries
- [ ] Razorpay MCP tools (orders, payments, refunds)
- [ ] GSTN MCP tools
- [ ] Further integrations (UPI, DigiLocker) under consideration

## Contributing

Issues and pull requests are welcome. Please run `pnpm lint && pnpm type-check && pnpm test` before opening a PR.
