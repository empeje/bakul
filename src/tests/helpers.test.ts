// ABOUTME: Unit tests for helper functions in Bakul API
// ABOUTME: Tests schema generation, password hashing, and validation without external dependencies

import { describe, it, expect } from 'vitest'

// Import helper functions (we'll need to extract them first)
function hashPassword(password: string): Promise<string> {
  return new Promise(async (resolve) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    resolve(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''))
  })
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

describe('Helper Functions', () => {
  describe('hashPassword', () => {
    it('should hash a password consistently', async () => {
      const password = 'testPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 produces 64 char hex string
      expect(hash1).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1')
      const hash2 = await hashPassword('password2')
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('generateSchema', () => {
    it('should generate schema for simple object', () => {
      const data = { name: 'John', age: 30, active: true }
      const schema = generateSchema(data)
      
      expect(schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          active: { type: 'boolean' }
        },
        required: ['name', 'age', 'active']
      })
    })

    it('should generate schema for array', () => {
      const data = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
      const schema = generateSchema(data)
      
      expect(schema).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' }
          },
          required: ['id', 'name']
        }
      })
    })

    it('should handle null values', () => {
      const data = null
      const schema = generateSchema(data)
      
      expect(schema).toEqual({ type: 'null' })
    })

    it('should handle empty array', () => {
      const data: any[] = []
      const schema = generateSchema(data)
      
      expect(schema).toEqual({
        type: 'array',
        items: {}
      })
    })

    it('should handle nested objects', () => {
      const data = {
        user: {
          id: 1,
          profile: {
            name: 'John'
          }
        }
      }
      const schema = generateSchema(data)
      
      expect(schema).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              profile: {
                type: 'object',
                properties: {
                  name: { type: 'string' }
                },
                required: ['name']
              }
            },
            required: ['id', 'profile']
          }
        },
        required: ['user']
      })
    })
  })
})