// src/utils/validation.ts

import { Skill } from '../models/skill.model';

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
