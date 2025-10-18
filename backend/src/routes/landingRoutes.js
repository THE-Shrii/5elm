const express = require('express');
const { sql } = require('../config/sqlserver');
const { registerVisitorSQL, getSubscriptionsSQL } = require('../controllers/landingController');

const router = express.Router();

// POST /api/v1/landing/register - SQL Server-based visitor registration
router.post('/register', registerVisitorSQL);

// GET /api/v1/landing/subscriptions - Fetch all landing page subscriptions
router.get('/subscriptions', getSubscriptionsSQL);

// POST /api/v1/landing/lead - Legacy route (kept for compatibility)
router.post('/lead', async (req, res) => {
  const { firstName, lastName, email, phone, consent } = req.body;

  if(!firstName || !lastName || !email) 
    return res.status(400).json({ error: 'First name, last name, and email are required.'})

  try {
    await sql.query`
    INSERT INTO LandingLeads (FirstName, LastName, Email, Phone, Consent)
    VALUES (${firstName}, ${lastName}, ${email}, ${phone || null},  ${consent ? 1 : 0});
    `;

    res.json({
      success: true,
      message: 'Lead captured successfully. Verification email will be sent soon!',
      
    });
  } catch (err) {
    console.error('SQL Insert Error:', err);
    res.status(500).json({ error: 'Failed to save lead. Possibly duplicate email.'})
  }
});

module.exports = router;