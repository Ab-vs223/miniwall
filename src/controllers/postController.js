'use strict';

const { validationResult } = require('express-validator');
const Post       = require('../models/Post');
const PostSearch = require('../models/PostSearch');

// sync the denormalised PostSearch document 
const syncSearch = async (post) => {
  await PostSearch.findOneAndUpdate(
    { postId: post._id },
    {
      postId:        post._id,
      title:         post.title,
      description:   post.description,
      owner:         post.owner,
      ownerUsername: post.ownerUsername,
      likesCount:    post.likesCount,
      createdAt:     post.createdAt,
    },
    { upsert: true, new: true }
  );
};

const createPost = async (req, res) => {
  // result
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description } = req.body;

    const post = await Post.create({
      title,
      description,
      owner:         req.user._id,
      ownerUsername: req.user.username,
    });

    await syncSearch(post);

    return res.status(201).json(post);
  } catch (err) {
    console.error('[createPost]', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ likesCount: -1, createdAt: -1 })
      .populate('owner', 'username email');

    return res.json(posts);
  } catch (err) {
    console.error('[getPosts]', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('owner', 'username email');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    return res.json(post);
  } catch (err) {
    console.error('[getPost]', err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found' });
    return res.status(500).json({ message: 'Server error' });
  }
};

const updatePost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // only the owner may edit
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to update this post' });
    }

    const { title, description } = req.body;
    if (title)       post.title       = title;
    if (description) post.description = description;

    const updated = await post.save();

    // keep search table in sync
    await syncSearch(updated);

    return res.json(updated);
  } catch (err) {
    console.error('[updatePost]', err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found' });
    return res.status(500).json({ message: 'Server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to delete this post' });
    }

    await post.deleteOne();

    await PostSearch.findOneAndDelete({ postId: post._id });

    return res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('[deletePost]', err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found' });
    return res.status(500).json({ message: 'Server error' });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // owner cannot like their own post
    if (post.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot like your own post' });
    }

    const alreadyLiked = post.likes.some(
      (uid) => uid.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      // remove user from likes array
      post.likes   = post.likes.filter((uid) => uid.toString() !== req.user._id.toString());
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // add user to likes array
      post.likes.push(req.user._id);
      post.likesCount += 1;
    }

    const saved = await post.save();

    // keep denormalised likesCount in sync on the search table
    await PostSearch.findOneAndUpdate(
      { postId: post._id },
      { likesCount: saved.likesCount }
    );

    return res.json({
      likesCount: saved.likesCount,
      liked:      !alreadyLiked,
    });
  } catch (err) {
    console.error('[likePost]', err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found' });
    return res.status(500).json({ message: 'Server error' });
  }
};

const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // owner cannot comment on their own post
    if (post.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot comment on your own post' });
    }

    const comment = {
      user:     req.user._id,
      username: req.user.username,
      text:     req.body.text,
    };

    post.comments.push(comment);
    await post.save();

    // return just the newly added comment (last in array)
    const newComment = post.comments[post.comments.length - 1];
    return res.status(201).json(newComment);
  } catch (err) {
    console.error('[addComment]', err.message);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Post not found' });
    return res.status(500).json({ message: 'Server error' });
  }
};

const searchPosts = async (req, res) => {
  try {
    const { keyword, owner, from, to } = req.query;

    const filter = {};

    if (keyword && keyword.trim()) {
      filter.$text = { $search: keyword.trim() };
    }

    if (owner && owner.trim()) {
      filter.ownerUsername = { $regex: owner.trim(), $options: 'i' };
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const results = await PostSearch.find(filter).sort({ likesCount: -1, createdAt: -1 });

    return res.json(results);
  } catch (err) {
    console.error('[searchPosts]', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  addComment,
  searchPosts,
};
