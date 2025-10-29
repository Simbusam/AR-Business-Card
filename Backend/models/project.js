// models/Project.js
const mongoose = require('mongoose');
const validator = require('validator');

const assetSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Asset URL is required'],
    validate: {
      validator: function(v) {
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
          // Allow localhost/127.0.0.1 during development
          require_tld: false
        });
      },
      message: 'Invalid asset URL'
    }
  },
  type: {
    type: String,
    enum: ['image', 'video', '3d_model', 'audio', 'document'],
    required: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Asset name cannot exceed 100 characters']
  },
  size: {
    type: Number,
    min: [0, 'Size cannot be negative'],
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  publicId: String // For cloud storage references
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [50, 'Project name cannot exceed 50 characters'],
    minlength: [3, 'Project name must be at least 3 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // role: {
    //   type: String,
    //   enum: ['admin', 'user'],
    //   default: 'viewer'
    // },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sceneData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  thumbnail: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
          require_tld: false
        });
      },
      message: 'Invalid thumbnail URL'
    }
  },
  assets: [assetSchema],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  settings: {
    versionControl: {
      type: Boolean,
      default: false
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    saveInterval: {
      type: Number,
      default: 300000, // 5 minutes in milliseconds
      min: [60000, 'Save interval cannot be less than 1 minute']
    }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });
projectSchema.index({ isPublic: 1, isArchived: 1 });
projectSchema.index({ 'collaborators.user': 1 });

// Virtual for formatted created date
projectSchema.virtual('createdAtFormatted').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Static method to find public projects
projectSchema.statics.findPublicProjects = function() {
  return this.find({ isPublic: true, isArchived: false })
    .populate('owner', 'name email')
    .sort({ updatedAt: -1 });
};

// Instance method to add collaborator
projectSchema.methods.addCollaborator = function(userId, role = 'viewer') {
  if (this.owner.equals(userId)) {
    throw new Error('Owner cannot be added as collaborator');
  }
  
  const existing = this.collaborators.find(c => c.user.equals(userId));
  if (existing) {
    existing.role = role;
  } else {
    this.collaborators.push({ user: userId, role });
  }
  
  return this.save();
};

// Middleware to clean up assets when project is deleted
projectSchema.pre('remove', async function(next) {
  // This would be where you'd add logic to delete actual asset files from storage
  // For example: await cloudStorage.deleteAssets(this.assets);
  next();
});

module.exports = mongoose.model('Project', projectSchema);