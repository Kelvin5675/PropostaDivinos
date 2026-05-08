const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

router.get('/plans', invitationController.getPlans);
router.get('/public/:slug', invitationController.getPublicInvitation);
router.post('/:invitation_id/rsvp', invitationController.submitRsvp);

// Professional Platform Routes
router.post('/orders', invitationController.createOrder); // Public: Place order
router.get('/orders', invitationController.getOrders); // Admin: List orders
router.post('/generate-ia', invitationController.generateWithIA); // Admin: AI Generation
router.post('/', invitationController.createInvitation); // Admin: Save invitation
router.get('/dashboard/:token', invitationController.getDashboardData); // Public: Couples Dashboard

module.exports = router;
