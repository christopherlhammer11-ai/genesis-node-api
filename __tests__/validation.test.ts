/**
 * Genesis Node API Validation Tests
 *
 * Test framework: Vitest (add to package.json devDependencies if not present)
 * Install: npm install -D vitest @vitest/ui
 * Run tests: npx vitest
 * Run once: npx vitest run
 *
 * Tests cover:
 * - validateSkillPublication() function
 * - validatePurchaseRequest() function
 * - Error handling and validation logic
 * - Edge cases and invalid inputs
 */

import { describe, it, expect } from 'vitest';

// Replicate the validation types and functions from src/utils/validation.ts
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a skill object for the POST /publish endpoint
 */
export function validateSkillPublication(skill: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!skill || typeof skill !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'body', message: 'Request body must be a valid object' }],
    };
  }

  if (!skill.id || typeof skill.id !== 'string') {
    errors.push({ field: 'id', message: 'id is required and must be a string' });
  }

  if (!skill.name || typeof skill.name !== 'string') {
    errors.push({ field: 'name', message: 'name is required and must be a string' });
  }

  if (!skill.description || typeof skill.description !== 'string') {
    errors.push({ field: 'description', message: 'description is required and must be a string' });
  }

  if (!skill.version || typeof skill.version !== 'string') {
    errors.push({ field: 'version', message: 'version is required and must be a string' });
  }

  if (!skill.creatorAgentId || typeof skill.creatorAgentId !== 'string') {
    errors.push({ field: 'creatorAgentId', message: 'creatorAgentId is required and must be a string' });
  }

  // Validate pricing
  if (!skill.pricing || typeof skill.pricing !== 'object') {
    errors.push({ field: 'pricing', message: 'pricing is required and must be an object' });
  } else {
    if (!['per-call', 'subscription'].includes(skill.pricing.type)) {
      errors.push({ field: 'pricing.type', message: "pricing.type must be 'per-call' or 'subscription'" });
    }
    if (typeof skill.pricing.amount !== 'number' || skill.pricing.amount < 0) {
      errors.push({ field: 'pricing.amount', message: 'pricing.amount is required and must be a non-negative number' });
    }
    if (!skill.pricing.currency || typeof skill.pricing.currency !== 'string') {
      errors.push({ field: 'pricing.currency', message: 'pricing.currency is required and must be a string' });
    }
  }

  // Validate dependencies
  if (!Array.isArray(skill.dependencies)) {
    errors.push({ field: 'dependencies', message: 'dependencies must be an array' });
  }

  // Validate interface
  if (!skill.interface || typeof skill.interface !== 'object') {
    errors.push({ field: 'interface', message: 'interface is required and must be an object' });
  } else {
    if (!skill.interface.inputType || typeof skill.interface.inputType !== 'object') {
      errors.push({ field: 'interface.inputType', message: 'interface.inputType is required and must be an object' });
    }
    if (!skill.interface.outputType || typeof skill.interface.outputType !== 'object') {
      errors.push({ field: 'interface.outputType', message: 'interface.outputType is required and must be an object' });
    }
  }

  if (!skill.packageUrl || typeof skill.packageUrl !== 'string') {
    errors.push({ field: 'packageUrl', message: 'packageUrl is required and must be a string' });
  }

  if (!skill.checksum || typeof skill.checksum !== 'string') {
    errors.push({ field: 'checksum', message: 'checksum is required and must be a string' });
  }

  // Validate performanceMetrics
  if (!skill.performanceMetrics || typeof skill.performanceMetrics !== 'object') {
    errors.push({ field: 'performanceMetrics', message: 'performanceMetrics is required and must be an object' });
  } else {
    if (typeof skill.performanceMetrics.avgLatencyMs !== 'number' || skill.performanceMetrics.avgLatencyMs < 0) {
      errors.push({ field: 'performanceMetrics.avgLatencyMs', message: 'avgLatencyMs must be a non-negative number' });
    }
    if (typeof skill.performanceMetrics.successRate !== 'number' || skill.performanceMetrics.successRate < 0 || skill.performanceMetrics.successRate > 1) {
      errors.push({ field: 'performanceMetrics.successRate', message: 'successRate must be a number between 0 and 1' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates purchase request body
 */
export function validatePurchaseRequest(body: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'body', message: 'Request body must be a valid object' }],
    };
  }

  if (!body.buyerAgentId || typeof body.buyerAgentId !== 'string') {
    errors.push({ field: 'buyerAgentId', message: 'buyerAgentId is required and must be a string' });
  }

  if (!body.skillId || typeof body.skillId !== 'string') {
    errors.push({ field: 'skillId', message: 'skillId is required and must be a string' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper function to create a valid skill object for testing
function createValidSkill(overrides: any = {}): any {
  return {
    id: 'skill-123',
    name: 'Test Skill',
    description: 'A test skill',
    version: '1.0.0',
    creatorAgentId: 'agent-456',
    pricing: {
      type: 'per-call',
      amount: 10,
      currency: 'FLUX',
    },
    dependencies: [],
    interface: {
      inputType: { type: 'object' },
      outputType: { type: 'string' },
    },
    packageUrl: 'https://example.com/skill.tar.gz',
    checksum: 'abc123def456',
    performanceMetrics: {
      avgLatencyMs: 500,
      successRate: 0.99,
    },
    ...overrides,
  };
}

describe('validateSkillPublication', () => {
  describe('Valid Skill Objects', () => {
    it('should accept valid skill object', () => {
      const skill = createValidSkill();
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept skill with subscription pricing', () => {
      const skill = createValidSkill({
        pricing: {
          type: 'subscription',
          amount: 99.99,
          currency: 'FLUX',
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(true);
    });

    it('should accept skill with zero cost', () => {
      const skill = createValidSkill({
        pricing: {
          type: 'per-call',
          amount: 0,
          currency: 'FLUX',
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(true);
    });

    it('should accept skill with high latency', () => {
      const skill = createValidSkill({
        performanceMetrics: {
          avgLatencyMs: 30000,
          successRate: 0.95,
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(true);
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject missing id', () => {
      const skill = createValidSkill({ id: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'id')).toBe(true);
    });

    it('should reject missing name', () => {
      const skill = createValidSkill({ name: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should reject missing description', () => {
      const skill = createValidSkill({ description: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'description')).toBe(true);
    });

    it('should reject missing version', () => {
      const skill = createValidSkill({ version: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'version')).toBe(true);
    });

    it('should reject missing creatorAgentId', () => {
      const skill = createValidSkill({ creatorAgentId: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'creatorAgentId')).toBe(true);
    });

    it('should reject missing pricing', () => {
      const skill = createValidSkill({ pricing: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'pricing')).toBe(true);
    });

    it('should reject missing dependencies', () => {
      const skill = createValidSkill({ dependencies: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'dependencies')).toBe(true);
    });

    it('should reject missing interface', () => {
      const skill = createValidSkill({ interface: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'interface')).toBe(true);
    });

    it('should reject missing packageUrl', () => {
      const skill = createValidSkill({ packageUrl: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'packageUrl')).toBe(true);
    });

    it('should reject missing checksum', () => {
      const skill = createValidSkill({ checksum: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'checksum')).toBe(true);
    });

    it('should reject missing performanceMetrics', () => {
      const skill = createValidSkill({ performanceMetrics: undefined });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'performanceMetrics')).toBe(true);
    });
  });

  describe('Invalid Pricing', () => {
    it('should reject invalid pricing type', () => {
      const skill = createValidSkill({
        pricing: {
          type: 'invalid-type',
          amount: 10,
          currency: 'FLUX',
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'pricing.type')).toBe(true);
    });

    it('should reject negative pricing amount', () => {
      const skill = createValidSkill({
        pricing: {
          type: 'per-call',
          amount: -10,
          currency: 'FLUX',
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'pricing.amount')).toBe(true);
    });

    it('should reject missing pricing currency', () => {
      const skill = createValidSkill({
        pricing: {
          type: 'per-call',
          amount: 10,
          currency: undefined,
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'pricing.currency')).toBe(true);
    });
  });

  describe('Invalid Performance Metrics', () => {
    it('should reject negative latency', () => {
      const skill = createValidSkill({
        performanceMetrics: {
          avgLatencyMs: -100,
          successRate: 0.95,
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'performanceMetrics.avgLatencyMs')).toBe(true);
    });

    it('should reject success rate below 0', () => {
      const skill = createValidSkill({
        performanceMetrics: {
          avgLatencyMs: 500,
          successRate: -0.1,
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'performanceMetrics.successRate')).toBe(true);
    });

    it('should reject success rate above 1', () => {
      const skill = createValidSkill({
        performanceMetrics: {
          avgLatencyMs: 500,
          successRate: 1.5,
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'performanceMetrics.successRate')).toBe(true);
    });

    it('should accept success rate of 0', () => {
      const skill = createValidSkill({
        performanceMetrics: {
          avgLatencyMs: 500,
          successRate: 0,
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(true);
    });

    it('should accept success rate of 1', () => {
      const skill = createValidSkill({
        performanceMetrics: {
          avgLatencyMs: 500,
          successRate: 1,
        },
      });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(true);
    });
  });

  describe('Type Validation', () => {
    it('should reject null body', () => {
      const result = validateSkillPublication(null);

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('body');
    });

    it('should reject undefined body', () => {
      const result = validateSkillPublication(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('body');
    });

    it('should reject string instead of object', () => {
      const result = validateSkillPublication('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('body');
    });

    it('should reject non-string id', () => {
      const skill = createValidSkill({ id: 123 });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'id')).toBe(true);
    });

    it('should reject non-array dependencies', () => {
      const skill = createValidSkill({ dependencies: 'not-an-array' });
      const result = validateSkillPublication(skill);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'dependencies')).toBe(true);
    });
  });
});

describe('validatePurchaseRequest', () => {
  describe('Valid Purchase Request', () => {
    it('should accept valid purchase request', () => {
      const request = {
        buyerAgentId: 'buyer-123',
        skillId: 'skill-456',
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject missing buyerAgentId', () => {
      const request = {
        buyerAgentId: undefined,
        skillId: 'skill-456',
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'buyerAgentId')).toBe(true);
    });

    it('should reject missing skillId', () => {
      const request = {
        buyerAgentId: 'buyer-123',
        skillId: undefined,
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'skillId')).toBe(true);
    });

    it('should reject empty buyerAgentId', () => {
      const request = {
        buyerAgentId: '',
        skillId: 'skill-456',
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'buyerAgentId')).toBe(true);
    });

    it('should reject empty skillId', () => {
      const request = {
        buyerAgentId: 'buyer-123',
        skillId: '',
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'skillId')).toBe(true);
    });
  });

  describe('Type Validation', () => {
    it('should reject null body', () => {
      const result = validatePurchaseRequest(null);

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('body');
    });

    it('should reject undefined body', () => {
      const result = validatePurchaseRequest(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('body');
    });

    it('should reject non-string buyerAgentId', () => {
      const request = {
        buyerAgentId: 123,
        skillId: 'skill-456',
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'buyerAgentId')).toBe(true);
    });

    it('should reject non-string skillId', () => {
      const request = {
        buyerAgentId: 'buyer-123',
        skillId: 456,
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'skillId')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should accept request with extra fields', () => {
      const request = {
        buyerAgentId: 'buyer-123',
        skillId: 'skill-456',
        extraField: 'extra-value',
        anotherField: 123,
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(true);
    });

    it('should handle long agent IDs', () => {
      const longId = 'a'.repeat(1000);
      const request = {
        buyerAgentId: longId,
        skillId: 'skill-456',
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(true);
    });

    it('should handle special characters in IDs', () => {
      const request = {
        buyerAgentId: 'buyer-@#$%_123',
        skillId: 'skill-456.v2',
      };
      const result = validatePurchaseRequest(request);

      expect(result.valid).toBe(true);
    });
  });
});
