// ABOUTME: Main entry point for Bakul API - AI data storage layer
// ABOUTME: Provides user registration, dataset management, and public data access

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

type Bindings = CloudflareBindings

const app = new OpenAPIHono<{ Bindings: Bindings }>()

// Register security scheme
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  description: 'Bearer token using API key from registration'
})

// Landing page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bakul - AI Data Storage Layer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .hero { text-align: center; margin: 40px 0; }
          .section { margin: 30px 0; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="hero">
          <h1>🧺 Bakul</h1>
          <p>The missing storage layer for AI chatbots</p>
        </div>
        
        <div class="section">
          <h2>What is Bakul?</h2>
          <p>In Javanese, "bakul" refers to a woven bamboo basket. In the AI world, Bakul bridges the gap between AI-generated data (CSVs, datasets) and AI-generated visualizations (React components, dashboards).</p>
        </div>

        <div class="section">
          <h2>How it works</h2>
          <ol>
            <li>Register for an API key at <code>/api/register</code></li>
            <li>Ask AI to generate data and save it using our API</li>
            <li>Ask AI to create visualizations that consume your public dataset URLs</li>
            <li>Get beautiful, data-driven UIs powered by real data</li>
          </ol>
        </div>

        <div class="section">
          <h2>API Documentation</h2>
          <p>Explore the API at <a href="/api/doc">/api/doc</a></p>
        </div>

        <div class="section">
          <h2>Example Dataset URL</h2>
          <pre>GET /api/datasets/{username}/{dataset-id}</pre>
          <p>All datasets are publicly readable for easy integration with AI-generated visualizations.</p>
        </div>
      </body>
    </html>
  `)
})

// OpenAPI documentation
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Bakul API',
    description: 'The missing storage layer for AI chatbots - store and retrieve datasets'
  },
  servers: [
    {
      url: '/',
      description: 'Development server'
    }
  ]
})


// Swagger UI
app.get('/api/doc', swaggerUI({ url: '/api/openapi.json' }))

// Helper functions
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}


async function getUserByApiKey(db: D1Database, apiKey: string) {
  const result = await db.prepare(`
    SELECT u.id, u.username, u.created_at
    FROM users u
    JOIN api_keys ak ON u.id = ak.user_id
    WHERE ak.api_key = ?
  `).bind(apiKey).first()
  return result
}

async function checkRateLimit(db: D1Database, key: string): Promise<boolean> {
  const windowMinutes = 15
  const maxRequests = 100
  
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)
  
  // Clean old entries and get current count
  await db.prepare(`
    DELETE FROM rate_limits 
    WHERE key = ? AND window_start < ?
  `).bind(key, windowStart.toISOString()).run()
  
  const current = await db.prepare(`
    SELECT request_count FROM rate_limits WHERE key = ?
  `).bind(key).first()
  
  if (!current) {
    await db.prepare(`
      INSERT INTO rate_limits (key, request_count, window_start) VALUES (?, 1, ?)
    `).bind(key, now.toISOString()).run()
    return true
  }
  
  if ((current.request_count as number) >= maxRequests) {
    return false
  }
  
  await db.prepare(`
    UPDATE rate_limits SET request_count = request_count + 1 WHERE key = ?
  `).bind(key).run()
  
  return true
}

function generateSchema(data: any): any {
  if (data === null) return { type: 'null' }
  if (Array.isArray(data)) {
    if (data.length === 0) return { type: 'array', items: {} }
    return {
      type: 'array',
      items: generateSchema(data[0])
    }
  }
  
  const type = typeof data
  if (type === 'object') {
    const properties: any = {}
    const required: string[] = []
    
    for (const [key, value] of Object.entries(data)) {
      properties[key] = generateSchema(value)
      if (value !== null && value !== undefined) {
        required.push(key)
      }
    }
    
    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    }
  }
  
  return { type }
}

// Health check route
const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  tags: ['System'],
  summary: 'Health check',
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
            timestamp: z.string()
          })
        }
      }
    }
  }
})

app.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// User registration route
const registerRoute = createRoute({
  method: 'post',
  path: '/api/register',
  tags: ['Authentication'],
  summary: 'Register new user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).openapi({
              description: 'Username (3-50 chars, alphanumeric, underscore, dash only)'
            }),
            password: z.string().min(8).max(100).openapi({
              description: 'Password (8-100 chars)'
            })
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            apiKey: z.string(),
            instructions: z.string()
          })
        }
      }
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    },
    429: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    }
  }
})

app.openapi(registerRoute, async (c) => {
  const { username, password } = c.req.valid('json')
  const db = c.env.DB
  
  // Check rate limit
  const clientIP = c.req.header('cf-connecting-ip') || 'unknown'
  if (!await checkRateLimit(db, `register:${clientIP}`)) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  
  try {
    // Check if username exists
    const existing = await db.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first()
    
    if (existing) {
      return c.json({ error: 'Username already exists' }, 400)
    }
    
    // Create user
    const passwordHash = await hashPassword(password)
    const userResult = await db.prepare(`
      INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id
    `).bind(username, passwordHash).first()
    
    if (!userResult) {
      return c.json({ error: 'Failed to create user' }, 500)
    }
    
    // Generate API key
    const apiKey = uuidv4()
    await db.prepare(`
      INSERT INTO api_keys (user_id, api_key) VALUES (?, ?)
    `).bind(userResult.id, apiKey).run()
    
    return c.json({
      message: 'User registered successfully',
      apiKey,
      instructions: 'Use this API key to authenticate your requests. Keep it secure!'
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// API key rotation route
const rotateKeyRoute = createRoute({
  method: 'post',
  path: '/api/rotate-key',
  tags: ['Authentication'],
  summary: 'Rotate API key',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'API key rotated successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            apiKey: z.string()
          })
        }
      }
    },
    401: {
      description: 'Invalid API key',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    },
    429: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    }
  }
})

app.openapi(rotateKeyRoute, async (c) => {
  const db = c.env.DB
  const apiKey = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!apiKey) {
    return c.json({ error: 'Authorization header required' }, 401)
  }
  
  // Check rate limit
  if (!await checkRateLimit(db, `rotate:${apiKey}`)) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  
  try {
    const user = await getUserByApiKey(db, apiKey)
    if (!user) {
      return c.json({ error: 'Invalid API key' }, 401)
    }
    
    // Generate new API key
    const newApiKey = uuidv4()
    
    // Update API key
    await db.prepare(`
      UPDATE api_keys SET api_key = ? WHERE user_id = ?
    `).bind(newApiKey, user.id).run()
    
    return c.json({
      message: 'API key rotated successfully',
      apiKey: newApiKey
    })
    
  } catch (error) {
    console.error('Key rotation error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Create dataset route
const createDatasetRoute = createRoute({
  method: 'post',
  path: '/api/datasets',
  tags: ['Datasets'],
  summary: 'Create new dataset',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1).max(100).openapi({
              description: 'Dataset name'
            }),
            data: z.any().openapi({
              description: 'JSON data (max 5MB) - schema will be auto-generated'
            })
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Dataset created successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            datasetId: z.string(),
            publicUrl: z.string(),
            schemaUrl: z.string()
          })
        }
      }
    },
    400: {
      description: 'Bad request (e.g., data too large)',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    }
  }
})

app.openapi(createDatasetRoute, async (c) => {
  const { name, data } = c.req.valid('json')
  const db = c.env.DB
  const apiKey = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!apiKey) {
    return c.json({ error: 'Authorization header required' }, 401)
  }
  
  // Check rate limit
  if (!await checkRateLimit(db, apiKey)) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  
  try {
    const user = await getUserByApiKey(db, apiKey)
    if (!user) {
      return c.json({ error: 'Invalid API key' }, 401)
    }
    
    // Check data size (5MB limit)
    const dataString = JSON.stringify(data)
    const dataSizeBytes = new TextEncoder().encode(dataString).length
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    
    if (dataSizeBytes > maxSizeBytes) {
      return c.json({ error: 'Dataset too large (5MB limit)' }, 400)
    }
    
    // Auto-generate schema from data
    const generatedSchema = generateSchema(data)
    
    // Create dataset
    const datasetId = uuidv4()
    await db.prepare(`
      INSERT INTO datasets (id, user_id, username, name, data, schema) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      datasetId,
      user.id,
      user.username,
      name,
      dataString,
      JSON.stringify(generatedSchema)
    ).run()
    
    return c.json({
      message: 'Dataset created successfully',
      datasetId,
      publicUrl: `/api/datasets/${user.username}/${datasetId}`,
      schemaUrl: `/api/datasets/${user.username}/${datasetId}/schema`
    })
    
  } catch (error) {
    console.error('Dataset creation error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update dataset route
const updateDatasetRoute = createRoute({
  method: 'put',
  path: '/api/datasets/{id}',
  tags: ['Datasets'],
  summary: 'Update existing dataset',
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Dataset ID'
      })
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.any().openapi({
              description: 'JSON data (max 5MB) - schema will be auto-generated'
            })
          })
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Dataset updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            datasetId: z.string(),
            publicUrl: z.string(),
            schemaUrl: z.string()
          })
        }
      }
    },
    401: { description: 'Unauthorized' },
    404: { description: 'Dataset not found' }
  }
})

app.openapi(updateDatasetRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { data } = c.req.valid('json')
  const db = c.env.DB
  const apiKey = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!apiKey) {
    return c.json({ error: 'Authorization header required' }, 401)
  }
  
  // Check rate limit
  if (!await checkRateLimit(db, apiKey)) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  
  try {
    const user = await getUserByApiKey(db, apiKey)
    if (!user) {
      return c.json({ error: 'Invalid API key' }, 401)
    }
    
    // Check if dataset exists and belongs to user
    const dataset = await db.prepare(`
      SELECT id FROM datasets WHERE id = ? AND user_id = ?
    `).bind(id, user.id).first()
    
    if (!dataset) {
      return c.json({ error: 'Dataset not found or not owned by user' }, 404)
    }
    
    // Check data size (5MB limit)
    const dataString = JSON.stringify(data)
    const dataSizeBytes = new TextEncoder().encode(dataString).length
    const maxSizeBytes = 5 * 1024 * 1024 // 5MB
    
    if (dataSizeBytes > maxSizeBytes) {
      return c.json({ error: 'Dataset too large (5MB limit)' }, 400)
    }
    
    // Auto-generate schema from data
    const generatedSchema = generateSchema(data)
    
    // Update dataset
    await db.prepare(`
      UPDATE datasets 
      SET data = ?, schema = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).bind(
      dataString,
      JSON.stringify(generatedSchema),
      id,
      user.id
    ).run()
    
    return c.json({
      message: 'Dataset updated successfully',
      datasetId: id,
      publicUrl: `/api/datasets/${user.username}/${id}`,
      schemaUrl: `/api/datasets/${user.username}/${id}/schema`
    })
    
  } catch (error) {
    console.error('Dataset update error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get dataset route (public)
const getDatasetRoute = createRoute({
  method: 'get',
  path: '/api/datasets/{username}/{id}',
  tags: ['Public'],
  summary: 'Get dataset (public)',
  request: {
    params: z.object({
      username: z.string().openapi({ description: 'Username' }),
      id: z.string().uuid().openapi({ description: 'Dataset ID' })
    })
  },
  responses: {
    200: {
      description: 'Dataset retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            data: z.any(),
            metadata: z.object({
              created_at: z.string(),
              updated_at: z.string(),
              username: z.string(),
              id: z.string()
            })
          })
        }
      }
    },
    404: {
      description: 'Dataset not found',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    }
  }
})

app.openapi(getDatasetRoute, async (c) => {
  const { username, id } = c.req.valid('param')
  const db = c.env.DB
  
  try {
    const dataset = await db.prepare(`
      SELECT data, name, created_at, updated_at 
      FROM datasets 
      WHERE id = ? AND username = ?
    `).bind(id, username).first()
    
    if (!dataset) {
      return c.json({ error: 'Dataset not found' }, 404)
    }
    
    const data = JSON.parse(dataset.data as string)
    
    return c.json({
      name: dataset.name,
      data,
      metadata: {
        created_at: dataset.created_at,
        updated_at: dataset.updated_at,
        username,
        id
      }
    })
    
  } catch (error) {
    console.error('Dataset retrieval error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get dataset schema route (public)
const getSchemaRoute = createRoute({
  method: 'get',
  path: '/api/datasets/{username}/{id}/schema',
  tags: ['Public'],
  summary: 'Get dataset schema (public)',
  request: {
    params: z.object({
      username: z.string().openapi({ description: 'Username' }),
      id: z.string().uuid().openapi({ description: 'Dataset ID' })
    })
  },
  responses: {
    200: {
      description: 'Schema retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            name: z.string(),
            schema: z.any().nullable(),
            metadata: z.object({
              created_at: z.string(),
              updated_at: z.string(),
              username: z.string(),
              id: z.string()
            })
          })
        }
      }
    },
    404: {
      description: 'Dataset not found',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() })
        }
      }
    }
  }
})

app.openapi(getSchemaRoute, async (c) => {
  const { username, id } = c.req.valid('param')
  const db = c.env.DB
  
  try {
    const dataset = await db.prepare(`
      SELECT schema, name, created_at, updated_at 
      FROM datasets 
      WHERE id = ? AND username = ?
    `).bind(id, username).first()
    
    if (!dataset) {
      return c.json({ error: 'Dataset not found' }, 404)
    }
    
    const schema = dataset.schema ? JSON.parse(dataset.schema as string) : null
    
    return c.json({
      name: dataset.name,
      schema,
      metadata: {
        created_at: dataset.created_at,
        updated_at: dataset.updated_at,
        username,
        id
      }
    })
    
  } catch (error) {
    console.error('Schema retrieval error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app