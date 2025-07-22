const express = require('express');
const router = express.Router();

router.get('/current', (req, res) => {
  res.json({ message: 'Weather endpoint - coming soon!' });
});

module.exports = router;
