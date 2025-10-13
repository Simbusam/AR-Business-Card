const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    // Core Metadata
    name: {
        type: String,
        required: [true, 'Template name is required'],
        maxlength: [80, 'Name cannot exceed 80 characters'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    // Content Structure
    sceneStructure: [{
        name: {
            type: String,
            required: true
        },
        defaultObjects: [{
            contentType: {
                type: String,
                enum: ['3D_model', '2D_image', 'video', 'button', 'light'],
                required: true
            },
            defaultPosition: {
                x: { type: Number, default: 0 },
                y: { type: Number, default: 0 },
                z: { type: Number, default: 0 }
            },
            required: Boolean,
            settings: {
                opacity: { type: Number, default: 1 },
                scale: { type: Number, default: 1 },
                rotation: {
                    x: { type: Number, default: 0 },
                    y: { type: Number, default: 0 },
                    z: { type: Number, default: 0 }
                }
            }
        }],
        triggers: [{
            type: {
                type: String,
                enum: ['onLoad', 'onClick', 'onProximity', 'timer'],
                required: true
            },
            defaultActions: [{
                type: String,
                enum: ['show', 'hide', 'animate', 'playSound', 'navigate']
            }]
        }]
    }],

    // Visual Style
    stylePresets: {
        colors: {
            primary: { type: String, default: '#FFFFFF' },
            secondary: { type: String, default: '#000000' },
            background: { type: String, default: '#F0F0F0' }
        },
        lighting: {
            intensity: { type: Number, default: 1 },
            type: { type: String, enum: ['directional', 'point', 'ambient'], default: 'ambient' }
        }
    },

    // Technical Specifications
    compatibleTypes: {
        type: [String],
        enum: ['marker', 'surface', 'world', 'face'],
        default: ['surface']
    },
    polyBudget: {
        type: Number,
        min: 1000,
        max: 500000
    },

    // Ownership & Sharing
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamAccess: [{
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        permission: {
            type: String,
            enum: ['view', 'edit', 'duplicate']
        }
    }],
    isPublic: {
        type: Boolean,
        default: false
    },

    // Versioning
    version: {
        major: { type: Number, default: 1 },
        minor: { type: Number, default: 0 }
    },
    isDeprecated: {
        type: Boolean,
        default: false
    },

    // Statistics
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUsed: Date,

    // Soft Delete
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// Indexes
templateSchema.index({ name: 'text', description: 'text' });
templateSchema.index({ compatibleTypes: 1 });
templateSchema.index({ createdBy: 1, isPublic: 1 });

// Virtuals
templateSchema.virtual('versionString').get(function() {
    return `v${this.version.major}.${this.version.minor}`;
});

// Middleware
templateSchema.pre('save', function(next) {
    if (this.isModified('sceneStructure')) {
        this.markModified('sceneStructure');
    }
    if (this.isModified('usageCount')) {
        this.lastUsed = new Date();
    }
    next();
});

// Query Helpers
templateSchema.query.byCompatibility = function(arType) {
    return this.where({ compatibleTypes: arType });
};
templateSchema.query.excludeDeleted = function() {
    return this.where({ deletedAt: null });
};

templateSchema.query.byOwner = function(userId) {
    return this.where({ createdBy: userId });
};

const Template = mongoose.model('Template', templateSchema);
module.exports = Template;
