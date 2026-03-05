const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

router.get('/plans', invitationController.getPlans);
router.get('/public/:slug', invitationController.getPublicInvitation);
router.post('/:invitation_id/rsvp', invitationController.submitRsvp);

module.exports = router;
