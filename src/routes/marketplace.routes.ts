// src/routes/marketplace.routes.ts
import { Router, Request, Response } from 'express';
import { discoverSkills, publishSkill, purchaseSkill } from '../services/marketplace.service';
import { Skill } from '../models/skill.model';

const router = Router();

router.post('/publish', async (req: Request, res: Response) => {
  try {
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
    res.status(500).json({ error: 'Failed to discover skills' });
  }
});

router.post('/purchase', async (req: Request, res: Response) => {
    try {
        const { buyerAgentId, skillId } = req.body;
        if (!buyerAgentId || !skillId) {
            return res.status(400).json({ error: 'buyerAgentId and skillId are required' });
        }
        const result = await purchaseSkill(buyerAgentId, skillId);
        res.status(200).json(result);
    } catch (error) {
        const err = error as Error;
        res.status(400).json({ error: err.message });
    }
});

export default router;
