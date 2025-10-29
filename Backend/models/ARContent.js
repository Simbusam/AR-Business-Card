const arContentSchema = new mongoose.Schema({
    // Basic Metadata
    name: {
      type: String,
      required: [true, 'Content name is required'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
  
    // Content Identification
    type: {
      type: String,
      required: true,
      enum: {
        values: ['3D_model', '2D_image', 'video', 'audio', 'marker', 'animation'],
        message: '{VALUE} is not a valid content type'
      },
      index: true
    },
    subType: {
      type: String,
      enum: ['gltf', 'glb', 'fbx', 'obj', 'png', 'jpg', 'mp4', 'webm', 'gif']
    },
  
    // File References
    sourceFile: {
      url: {
        type: String,
        required: [true, 'File URL is required'],
        match: [/^https?:\/\//, 'URL must start with http:// or https://']
      },
      sizeMB: {
        type: Number,
        min: [0.01, 'File size must be at least 0.01MB']
      },
      dimensions: {
        width: Number,
        height: Number,
        depth: Number
      },
      polyCount: Number  // For 3D models
    },
    thumbnail: {
      url: String,
      width: Number,
      height: Number
    },
  
    // Organization
    tags: {
      type: [String],
      validate: {
        validator: function(tags) {
          return tags.length <= 15;
        },
        message: 'Cannot have more than 15 tags'
      }
    },
    category: {
      type: String,
      enum: ['furniture', 'characters', 'vehicles', 'nature', 'ui_elements']
    },
  
    // Ownership and Permissions
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    license: {
      type: String,
      enum: ['royalty_free', 'creative_commons', 'proprietary'],
      default: 'royalty_free'
    },
    isPublic: {
      type: Boolean,
      default: false
    },
  
    // Technical Specifications
    optimization: {
      lodLevels: [Number],  // Level of Detail distances
      textureResolution: String,
      compression: {
        algorithm: String,
        ratio: Number
      }
    },
  
    // Usage Tracking
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastAccessed: Date,
  
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }, {
    // Schema Options
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
  
  // Indexes
  arContentSchema.index({ name: 'text', description: 'text', tags: 'text' });
  arContentSchema.index({ createdAt: -1 });
  arContentSchema.index({ viewCount: -1 });
  
  // Virtuals
  arContentSchema.virtual('formattedSize').get(function() {
    return `${this.sourceFile.sizeMB.toFixed(2)} MB`;
  });
  
  // Middleware
  arContentSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });
  
  // Query Helpers
  arContentSchema.query.byType = function(type) {
    return this.where({ type });
  };
  
  const ARContent = mongoose.model('ARContent', arContentSchema);