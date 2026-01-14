import express from 'express';
const router = express.Router();
import * as vetProfileController from '../controllers/vetProfileController';

router.get('/', vetProfileController.getVetProfiles);

router.get('/:id', vetProfileController.getVetProfileById);

router.post('/', vetProfileController.createVetProfile);

// --- FIX: ADD THE PUT ROUTE FOR UPDATING THE PROFILE ---
router.put('/:id', vetProfileController.updateVetProfile); 
// --- --------------------------------------------------

export default router;