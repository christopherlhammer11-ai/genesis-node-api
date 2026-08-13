// src/routes/marketplace.routes.ts
import { Router, Request, Response } from 'express';
import { discoverSkills, getSkillById, publishSkill } from '../services/marketplace.service';
import { createPurchaseQuote, getPaymentConfig, verifyPurchase } from '../services/payment.service';
import { Skill } from '../models/skill.model';
import { validateSkillPublication, validatePurchaseRequest } from '../utils/validation';

const router = Router();

router.get('/config', async (_req: Request, res: Response) => {
  res.status(200).json(await getPaymentConfig());
});

router.get('/discover', async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    const skills = await discoverSkills(query);
    res.status(200).json({
      query,
      count: skills.length,
      skills,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message || 'Failed to discover skills' });
  }
});

router.get('/skills/:skillId', async (req: Request, res: Response) => {
  try {
    const skill = await getSkillById(req.params.skillId);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.status(200).json(skill);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message || 'Failed to load skill' });
  }
});

router.post('/publish', async (req: Request, res: Response) => {
  try {
    const validationResult = validateSkillPublication(req.body);
    if (!validationResult.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.errors,
      });
    }

    const skill: Skill = req.body;
    const newSkill = await publishSkill(skill);
    res.status(201).json({ message: 'Skill published successfully', skill: newSkill });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ error: err.message });
  }
});

router.post('/discover', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const skills = await discoverSkills(query || '');
    res.status(200).json({
      query: query || '',
      count: skills.length,
      skills,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message || 'Failed to discover skills' });
  }
});

router.post('/purchase', async (req: Request, res: Response) => {
    try {
        const validationResult = validatePurchaseRequest(req.body);
        if (!validationResult.valid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.errors,
            });
        }

        const { buyerAgentId, skillId } = req.body;
        const skill = await getSkillById(skillId);
        if (!skill) return res.status(404).json({ error: 'Skill not found' });
        const result = await createPurchaseQuote(buyerAgentId, skill);
        res.status(200).json(result);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ error: err.message });
    }
});

router.post('/purchase/verify', async (req: Request, res: Response) => {
  try {
    const { signature, quoteToken, skillId } = req.body || {};
    if (![signature, quoteToken, skillId].every((value) => typeof value === 'string' && value.length > 0)) {
      return res.status(400).json({ error: 'signature, quoteToken, and skillId are required' });
    }
    const skill = await getSkillById(skillId);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.status(200).json(await verifyPurchase(signature, quoteToken, skill));
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ error: err.message });
  }
});

export default router;
