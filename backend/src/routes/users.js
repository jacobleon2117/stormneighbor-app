const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/profile', auth, (req, res) => {
  res.json({ message: 'User profile endpoint - coming soon!' });
});

module.exports = router;
