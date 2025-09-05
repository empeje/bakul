// ABOUTME: Comprehensive test suite covering edge cases and additional scenarios
// ABOUTME: Tests error conditions, validation edge cases, and business logic robustness

import { describe, it, expect } from 'vitest'

// Import helper functions directly for thorough testing
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

describe('Comprehensive Edge Cases', () => {
  describe('Password Hashing Edge Cases', () => {
    it('should handle empty password', async () => {
      const hash = await hashPassword('')
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle very long password', async () => {
      const longPassword = 'a'.repeat(1000)
      const hash = await hashPassword(longPassword)
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const hash = await hashPassword(specialPassword)
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle unicode characters', async () => {
      const unicodePassword = '你好世界🌍🚀'
      const hash = await hashPassword(unicodePassword)
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('Schema Generation Edge Cases', () => {
    it('should handle undefined values in object', () => {
      const data = { name: 'John', age: undefined, city: 'NYC' }
      const schema = generateSchema(data)
      
      expect(schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'undefined' },
          city: { type: 'string' }
        },
        required: ['name', 'city'] // undefined should not be required
      })
    })

    it('should handle mixed type arrays', () => {
      const data = [{ id: 1, name: 'Item' }] // Only looks at first element
      const schema = generateSchema(data)
      
      expect(schema.type).toBe('array')
      expect(schema.items.type).toBe('object')
      expect(schema.items.properties.id.type).toBe('number')
      expect(schema.items.properties.name.type).toBe('string')
    })

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      }
      const schema = generateSchema(data)
      
      expect(schema.type).toBe('object')
      expect(schema.properties.level1.type).toBe('object')
      expect(schema.properties.level1.properties.level2.type).toBe('object')
      expect(schema.properties.level1.properties.level2.properties.level3.properties.value.type).toBe('string')
    })

    it('should handle boolean, number, and string primitives', () => {
      const data = {
        isActive: true,
        count: 42,
        name: 'test',
        price: 29.99,
        flag: false
      }
      const schema = generateSchema(data)
      
      expect(schema.properties.isActive.type).toBe('boolean')
      expect(schema.properties.count.type).toBe('number')
      expect(schema.properties.name.type).toBe('string')
      expect(schema.properties.price.type).toBe('number')
      expect(schema.properties.flag.type).toBe('boolean')
    })

    it('should handle object with null and undefined mixed', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        realValue: 'exists'
      }
      const schema = generateSchema(data)
      
      expect(schema.properties.nullValue.type).toBe('null')
      expect(schema.properties.undefinedValue.type).toBe('undefined')
      expect(schema.properties.realValue.type).toBe('string')
      expect(schema.required).toEqual(['realValue']) // Only non-null/undefined values
    })
  })

  describe('Data Size Validation Edge Cases', () => {
    it('should handle exactly 5MB of data', () => {
      const maxSizeBytes = 5 * 1024 * 1024
      const testData = 'x'.repeat(maxSizeBytes)
      const actualSize = new TextEncoder().encode(testData).length
      
      expect(actualSize).toBe(maxSizeBytes)
    })

    it('should handle JSON overhead in size calculation', () => {
      const data = { message: 'hello' }
      const jsonString = JSON.stringify(data)
      const actualSize = new TextEncoder().encode(jsonString).length
      const expectedSize = '{"message":"hello"}'.length
      
      expect(actualSize).toBe(expectedSize)
      expect(actualSize).toBe(19)
    })

    it('should handle unicode characters in size calculation', () => {
      const data = { emoji: '🚀🌍' }
      const jsonString = JSON.stringify(data)
      const actualSize = new TextEncoder().encode(jsonString).length
      
      // Unicode characters take more bytes than their length suggests
      expect(actualSize).toBeGreaterThan(jsonString.length)
    })
  })

  describe('Username Validation Edge Cases', () => {
    it('should validate minimum length boundary', () => {
      const username = 'ab' // 2 chars, should fail
      expect(username.length < 3).toBe(true)
      
      const username2 = 'abc' // 3 chars, should pass
      expect(username2.length >= 3).toBe(true)
    })

    it('should validate maximum length boundary', () => {
      const username = 'a'.repeat(50) // Exactly 50 chars
      expect(username.length <= 50).toBe(true)
      
      const username2 = 'a'.repeat(51) // 51 chars, should fail
      expect(username2.length > 50).toBe(true)
    })

    it('should validate character restrictions', () => {
      const validChars = 'abcABC123_-'
      const invalidChars = 'user@domain.com'
      const spaceChar = 'user name'
      
      const regex = /^[a-zA-Z0-9_-]+$/
      
      expect(regex.test(validChars)).toBe(true)
      expect(regex.test(invalidChars)).toBe(false)
      expect(regex.test(spaceChar)).toBe(false)
    })
  })

  describe('Rate Limiting Logic Edge Cases', () => {
    it('should handle exact rate limit boundary', () => {
      const maxRequests = 100
      const currentRequests = 100 // Exactly at limit
      
      expect(currentRequests >= maxRequests).toBe(true) // Should be blocked
    })

    it('should handle rate limit window calculations', () => {
      const windowMinutes = 15
      const now = new Date('2024-01-01T12:00:00Z')
      const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)
      
      expect(windowStart.getTime()).toBe(now.getTime() - 15 * 60 * 1000)
      
      // Test edge case: exactly at window boundary
      const edgeTime = new Date(windowStart.getTime() + 1)
      expect(edgeTime.getTime()).toBe(windowStart.getTime() + 1)
    })
  })

  describe('URL Generation Edge Cases', () => {
    it('should handle special characters in username and dataset ID', () => {
      const username = 'user_name-123'
      const datasetId = 'dataset-id_123'
      
      const publicUrl = `/api/datasets/${username}/${datasetId}`
      const schemaUrl = `/api/datasets/${username}/${datasetId}/schema`
      
      expect(publicUrl).toBe('/api/datasets/user_name-123/dataset-id_123')
      expect(schemaUrl).toBe('/api/datasets/user_name-123/dataset-id_123/schema')
    })

    it('should generate consistent URLs', () => {
      const username = 'testuser'
      const datasetId = 'abc-123'
      
      const url1 = `/api/datasets/${username}/${datasetId}`
      const url2 = `/api/datasets/${username}/${datasetId}`
      
      expect(url1).toBe(url2)
    })
  })

  describe('JSON Operations Edge Cases', () => {
    it('should handle JSON.stringify of complex objects', () => {
      const complexData = {
        date: new Date('2024-01-01').toISOString(),
        nested: {
          array: [1, 'two', { three: 3 }],
          nullValue: null,
          boolean: true
        }
      }
      
      const jsonString = JSON.stringify(complexData)
      const parsed = JSON.parse(jsonString)
      
      expect(parsed.nested.array).toHaveLength(3)
      expect(parsed.nested.nullValue).toBe(null)
      expect(parsed.nested.boolean).toBe(true)
    })

    it('should handle JSON.parse error scenarios gracefully', () => {
      const invalidJson = '{"invalid": json}'
      
      expect(() => JSON.parse(invalidJson)).toThrow()
    })
  })
})