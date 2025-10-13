const arExperienceSchema = new mongoose.Schema({
    // Core Metadata
    title: {
      type: String,
      required: [true, 'Experience title is required'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    slug: {
      type: String,
      unique: true,
      match: [/^[a-z0-9-]+$/, 'Slug must be URL-friendly']
    },
  
    // Experience Configuration
    type: {
      type: String,
      required: true,
      enum: ['marker_based', 'surface', 'world', 'face', 'geo'],
      default: 'marker_based'
    },
    environment: {
      lighting: {
        type: String,
        enum: ['indoor', 'outdoor', 'studio', 'custom']
      },
      recommendedSpace: String // e.g., "2m x 2m floor space"
    },
  
    // Content Composition
    scenes: [{
      name: String,
      objects: [{
        content: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ARContent',
          required: true
        },
        transform: {
          position: { x: Number, y: Number, z: Number },
          rotation: { x: Number, y: Number, z: Number },
          scale: { x: Number, y: Number, z: Number }
        },
        physics: {
          collision: Boolean,
          gravity: Boolean,
          mass: Number
        },
        animation: {
          autoPlay: Boolean,
          loop: Boolean,
          startTime: Number
        }
      }],
      triggers: [{
        type: {
          type: String,
          enum: ['click', 'proximity', 'gaze', 'marker', 'time']
        },
        target: mongoose.Schema.Types.ObjectId, // Reference to object
        action: {
          type: String,
          enum: ['show', 'hide', 'animate', 'navigate', 'play_sound']
        },
        parameters: mongoose.Schema.Types.Mixed
      }]
    }],
  
    // Tracking & Recognition
    markers: [{
      patternUrl: String,
      width: Number, // in meters
      isPrimary: Boolean
    }],
    imageTargets: [{
      imageUrl: String,
      physicalWidth: Number
    }],
  
    // Project Organization
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    version: {
      major: { type: Number, default: 1 },
      minor: { type: Number, default: 0 },
      patch: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
  
    // Access Control
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    collaborators: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['editor', 'viewer'] }
    }],
    privacy: {
      type: String,
      enum: ['private', 'team', 'public'],
      default: 'private'
    },
  
    // Performance Metrics
    loadTime: Number, // in seconds
    polyCount: Number,
    textureMemory: Number, // in MB
  
    // Timestamps
    publishedAt: Date,
    lastAccessed: Date
  }, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Indexes
  arExperienceSchema.index({ title: 'text', description: 'text' });
  arExperienceSchema.index({ project: 1, status: 1 });
  arExperienceSchema.index({ 'scenes.objects.content': 1 });
  
  // Virtuals
  arExperienceSchema.virtual('fullVersion').get(function() {
    return `v${this.version.major}.${this.version.minor}.${this.version.patch}`;
  });
  
  // Middleware
  arExperienceSchema.pre('save', function(next) {
    if (!this.slug && this.title) {
      this.slug = this.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    next();
  });
  
  // Query Helpers
  arExperienceSchema.query.byProject = function(projectId) {
    return this.where({ project: projectId });
  };
  
  arExperienceSchema.query.published = function() {
    return this.where({ status: 'published' });
  };
  
  const ARExperience = mongoose.model('ARExperience', arExperienceSchema);