'use strict';

const express        = require('express');
const { body }       = require('express-validator');
const { protect }    = require('../middleware/auth');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  addComment,
  searchPosts,
} = require('../controllers/postController');

const router = express.Router();

const postRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
];

const updateRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
];

const commentRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
];

// must be before /:id
router.get('/search', protect, searchPosts);

// list all posts / create one
router.route('/')
  .get(protect, getPosts)
  .post(protect, postRules, createPost);

router.route('/:id')
  .get(protect, getPost)
  .put(protect, updateRules, updatePost)
  .delete(protect, deletePost);

// owner can't like their own post
router.post('/:id/like', protect, likePost);

// owner can't comment on their own post
router.post('/:id/comment', protect, commentRules, addComment);

module.exports = router;
