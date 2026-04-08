'use strict';

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    username: {
      type:     String,
      required: true,
    },
    text: {
      type:     String,
      required: [true, 'Comment text is required'],
      trim:     true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      trim:      true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    ownerUsername: {
      type:     String,
      required: true,
    },
    
    likesCount: {
      type:    Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    comments: [commentSchema],
  },
  { timestamps: true }
);

postSchema.index({ likesCount: -1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
