'use strict';

const mongoose = require('mongoose');

const postSearchSchema = new mongoose.Schema(
  {
    postId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Post',
      required: true,
      unique:   true,
    },
    title: {
      type:     String,
      required: true,
    },
    description: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
    ownerUsername: {
      type: String,
    },
    likesCount: {
      type:    Number,
      default: 0,
    },
    createdAt: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

postSearchSchema.index({ title: 'text' });

postSearchSchema.index({ owner: 1 });
postSearchSchema.index({ ownerUsername: 1 });
postSearchSchema.index({ createdAt: 1 });

module.exports = mongoose.model('PostSearch', postSearchSchema);
