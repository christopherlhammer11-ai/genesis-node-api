// src/routes/marketplace.routes.ts
import { Router, Request, Response } from 'express';
import { discoverSkills, publishSkill, purchaseSkill } from '../services/marketplace.service';
import { Skill } from '../models/skill.model';
import { validateSkillPublication, validatePurchaseRequest } from '../utils/validation';

const router = Router();

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
    res.status(200).json(skills);
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
        const result = await purchaseSkill(buyerAgentId, skillId);
        res.status(200).json(result);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ error: err.message });
    }
});

export default router;
