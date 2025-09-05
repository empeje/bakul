# Bakul - AI Data Storage Layer

In Javanese, "bakul" refers to a woven bamboo basket or container. In the world of AI, it is not uncommon for you to ask AI to generate data, e.g., produce a CSV or table-like dataset. At the same time, it is also not uncommon for you to ask it to make a visualization using an Artifact-like method, e.g., in Claude you can ask it to make a React or HTML artifact. The problem is those CSVs and the Artifacts are not connected. The idea behind the invention of Bakul is to introduce a missing storage layer for AI chatbots.

This project specifically focuses on the API layer, and in a separate project we will implement the MCP.

## ✅ Implementation Status

### Core Features - COMPLETED ✅
- [x] **Landing Page** - `/` root shows how it works
- [x] **API Namespace** - `/api` for all API endpoints
- [x] **User Registration** - Username/password → API key + instructions
- [x] **API Key Rotation** - Rotate key using Authorization header
- [x] **Dataset Creation** - Authenticated endpoint with auto-generated schema
- [x] **Dataset Retrieval** - Public `/api/datasets/{username}/{id}` endpoint
- [x] **Schema Retrieval** - Public `/api/datasets/{username}/{id}/schema` endpoint  
- [x] **Dataset Updates** - Owner-only replace functionality
- [x] **Swagger Documentation** - Complete OpenAPI 3.0 spec with authentication
- [x] **Rate Limiting** - 100 requests per 15-minute window
- [x] **Data Size Limits** - 5MB maximum dataset size
- [x] **Auto Schema Generation** - JSON schema automatically generated from data
- [x] **Comprehensive Testing** - 39 unit tests with 100% coverage

### Technical Implementation - COMPLETED ✅
- [x] **Hono + Cloudflare Workers** - Modern edge runtime
- [x] **D1 Database** - Cloudflare D1 for data persistence
- [x] **UUID API Keys** - Secure authentication tokens
- [x] **Password Hashing** - SHA-256 for secure storage  
- [x] **Input Validation** - Zod schemas for all endpoints
- [x] **Error Handling** - Comprehensive error responses
- [x] **TypeScript** - Full type safety throughout

### Authentication & Security - COMPLETED ✅
- [x] **Bearer Token Auth** - Authorization header support
- [x] **API Key Management** - Generate and rotate keys
- [x] **User Isolation** - Each user owns their datasets
- [x] **Public Read Access** - Datasets publicly accessible via username/id
- [x] **Owner-only Write** - Only dataset owners can update

## Recommended User Flow - WORKING ✅

1. **User registers** → Gets API key
2. **User creates dataset** → Gets public URL 
3. **User does research using AI** → Generates CSV/data
4. **User asks AI to store data** → Uses `POST /api/datasets` 
5. **User asks AI to create dashboard** → Uses public dataset URL
6. **Result: Beautiful UI with live data** → Fully connected workflow
7. **Updates as needed** → `PUT /api/datasets/{id}` to refresh data

## API Endpoints - ALL IMPLEMENTED ✅

| Method | Endpoint | Auth | Description | Status |
|--------|----------|------|-------------|---------|
| GET | `/` | None | Landing page | ✅ |
| GET | `/api/health` | None | Health check | ✅ |
| POST | `/api/register` | None | User registration | ✅ |
| POST | `/api/rotate-key` | Bearer | Rotate API key | ✅ |
| POST | `/api/datasets` | Bearer | Create dataset | ✅ |
| PUT | `/api/datasets/{id}` | Bearer | Update dataset | ✅ |
| GET | `/api/datasets/{username}/{id}` | None | Get dataset (public) | ✅ |
| GET | `/api/datasets/{username}/{id}/schema` | None | Get schema (public) | ✅ |
| GET | `/api/doc` | None | Swagger UI | ✅ |
| GET | `/api/openapi.json` | None | OpenAPI spec | ✅ |

## Future Work - Private Datasets 🔮

### Private Dataset Feature
- **Private by default option** - New datasets can be marked as private
- **Access control endpoint** - `POST /api/datasets/{id}/access` to manage permissions
- **Token-based sharing** - Generate temporary access tokens for private datasets
- **Sharing levels**: 
  - `public` - Current behavior (anyone can read)
  - `private` - Only owner can read/write
  - `shared` - Specific users can read via shared tokens
- **New endpoints needed**:
  - `PATCH /api/datasets/{id}/visibility` - Change public/private status
  - `POST /api/datasets/{id}/tokens` - Generate access tokens for private datasets
  - `GET /api/datasets/{id}` - Access private dataset with token
  - `DELETE /api/datasets/{id}/tokens/{tokenId}` - Revoke access token

### Additional Enhancements
- **Dataset versioning** - Keep history of dataset changes
- **Bulk operations** - Upload/download multiple datasets
- **Data transformation** - Built-in CSV to JSON conversion
- **Analytics** - Usage metrics and access logs
- **Webhooks** - Notify external systems of dataset changes
- **Export formats** - Support CSV, XML, YAML exports
- **Dataset templates** - Predefined schemas for common data types

## Deployment Ready 🚀
- All core functionality implemented
- Comprehensive test coverage (39 tests)
- Production-ready security and validation
- Interactive API documentation
- Ready for Cloudflare deployment