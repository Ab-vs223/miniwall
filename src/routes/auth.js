'use strict';

const { protect } = require('../middleware/auth');
const express                        = require('express');
const { body, validationResult }     = require('express-validator');
const User                           = require('../models/User');
const { generateToken }              = require('../config/jwt');

const router = express.Router();

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;

    // check for dup before attempting to insert
    const existingEmail    = await User.findOne({ email: email.toLowerCase() });
    const existingUsername = await User.findOne({ username });

    if (existingEmail)    return res.status(409).json({ message: 'Email already in use' });
    if (existingUsername) return res.status(409).json({ message: 'Username already taken' });

    // password is hashed inside the User bcryptjs
    const user = await User.create({ username, email, password });

    // return token so the client is logged in after register
    return res.status(201).json({
      _id:      user._id,
      username: user.username,
      email:    user.email,
      token:    generateToken(user._id),
    });
  } catch (err) {
    console.error('[register]', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', loginRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    // generic message to avoid user enumeration 
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      _id:      user._id,
      username: user.username,
      email:    user.email,
      token:    generateToken(user._id),
    });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email
  });
});

module.exports = router;
