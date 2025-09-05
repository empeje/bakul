# Bakul - AI Data Storage Layer 🧺

[![Test Suite](https://github.com/empeje/bakul/actions/workflows/test.yml/badge.svg)](https://github.com/empeje/bakul/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/empeje/bakul)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)

This project is a Hono + Cloudflare Worker app that provides an API layer for dataset storage and management, bridging the gap between AI-generated data and AI-generated visualizations. See [TODO.md](./TODO.md) for complete feature documentation.

## 🚀 Features

- **✅ Complete REST API** - Full CRUD operations for datasets
- **✅ Auto-Schema Generation** - JSON schemas automatically created from data
- **✅ Bearer Token Authentication** - Secure API key management
- **✅ Public Data Access** - Datasets publicly accessible via clean URLs
- **✅ Interactive Documentation** - Swagger UI with authentication support
- **✅ Rate Limiting** - 100 requests per 15-minute window
- **✅ 39 Unit Tests** - Comprehensive test coverage
- **✅ Production Ready** - Cloudflare Workers deployment ready

## 📋 Prerequisites

- [pnpm](https://pnpm.io/) (required for package management)
- [Node.js](https://nodejs.org/) 18 or 20
- [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/)

## 🛠️ Local Development
