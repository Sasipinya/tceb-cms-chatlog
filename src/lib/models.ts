import mongoose, { Schema, model, models } from 'mongoose';

const AdminNoteSchema = new Schema(
  { authorEmail: String, text: { type: String, required: true } },
  { timestamps: true, _id: true }
);

const SessionMetaSchema = new Schema(
  {
    conversation_id: { type: String, required: true, unique: true, index: true },
    sentiment:       { type: String, enum: ['positive', 'neutral', 'negative'], index: true },
    sentimentScore:  { type: Number, min: -1, max: 1 },
    topic:           { type: String, index: true },
    tags:            { type: [String], default: [], index: true },
    summary:         { type: String },
    is_answered:     { type: Boolean, default: true },
    is_flagged:      { type: Boolean, default: false, index: true },
    flag_reason:     { type: String },
    admin_notes:     { type: [AdminNoteSchema], default: [] },
    analyzed_at:     { type: Date },
  },
  { timestamps: true, versionKey: false }
);
export const SessionMeta = models.SessionMeta ?? model('SessionMeta', SessionMetaSchema);

const AnalyzeLogSchema = new Schema(
  {
    conversation_id: { type: String, required: true, index: true },
    chat_id:         { type: Number, index: true },
    triggered_by:    { type: String, default: 'manual' },
    admin_email:     { type: String },
    model:           { type: String, default: 'gemini-2.0-flash' },
    result: {
      sentiment: String, sentimentScore: Number, topic: String,
      tags: [String], summary: String, is_answered: Boolean,
      flag_reason: String, should_flag: Boolean,
    },
    success:     { type: Boolean, default: true },
    error_msg:   { type: String },
    duration_ms: { type: Number },
  },
  { timestamps: true, versionKey: false }
);
AnalyzeLogSchema.index({ createdAt: -1 });
export const AnalyzeLog = models.AnalyzeLog ?? model('AnalyzeLog', AnalyzeLogSchema);

const ChatFlagSchema = new Schema(
  {
    chat_id:         { type: Number, required: true, unique: true, index: true },
    conversation_id: { type: String, required: true, index: true },
    reason:          { type: String },
    flagged_by:      { type: String },
    is_flagged:      { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);
export const ChatFlag = models.ChatFlag ?? model('ChatFlag', ChatFlagSchema);

// ── CMS User ──────────────────────────────────────────────────────────────────
export type UserRole = 'pending' | 'viewer' | 'analyst' | 'editor' | 'admin';
export type AuthProvider = 'microsoft' | 'local';

const CmsUserSchema = new Schema(
  {
    email:        { type: String, required: true, unique: true, index: true },
    name:         { type: String },
    image:        { type: String },
    password:     { type: String, select: false },   // hashed, local users only
    provider:     { type: String, enum: ['microsoft', 'local'], default: 'microsoft' },
    role:         { type: String, enum: ['pending', 'viewer', 'analyst', 'editor', 'admin'], default: 'pending', index: true },
    approved:     { type: Boolean, default: false, index: true },
    approved_by:  { type: String },
    approved_at:  { type: Date },
    last_login:   { type: Date },
  },
  { timestamps: true, versionKey: false }
);

export const CmsUser = models.CmsUser ?? model('CmsUser', CmsUserSchema);

export type AuditAction =
  | 'login'
  | 'logout'
  | 'view_session'
  | 'analyze'
  | 'flag'
  | 'unflag'
  | 'add_annotation'
  | 'update_annotation'
  | 'add_note'
  | 'add_tag'
  | 'remove_tag'
  | 'edit_chat'
  | 'export'
  | 'user_create'
  | 'user_update'
  | 'user_delete'
  | 'user_approve';
 
const AuditLogSchema = new Schema(
  {
    user_email:  { type: String, required: true, index: true },
    user_name:   { type: String },
    action:      { type: String, required: true, index: true },
    target_type: { type: String },   // 'chat' | 'session' | 'user' | 'annotation' | 'system'
    target_id:   { type: String },   // id ของ object ที่ถูกแก้ไข
    detail:      { type: String },   // อธิบาย action เพิ่มเติม
    meta:        { type: Schema.Types.Mixed },  // ข้อมูลเพิ่มเติม เช่น old/new value
    ip:          { type: String },
  },
  { timestamps: true, versionKey: false }
);
 
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ user_email: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
 
export const AuditLog = models.AuditLog ?? model('AuditLog', AuditLogSchema);