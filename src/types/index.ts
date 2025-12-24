export type MemberType = "leader" | "regular";

export type RequestType = "prayer" | "support" | "testimony";

export type RequestStatus = "pending" | "approved" | "completed";

export type DonationStatus = "pending" | "received" | "verified";

export type DepartmentRequestStatus = "pending" | "approved" | "rejected";

export interface Title {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  type: MemberType;
  bio?: string;
  picture_url?: string;
  profile_picture_position?: { x: number; y: number };
  passions?: string[];
  email?: string;
  phone?: string;
  user_id?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  title_id?: string;
  title_name?: string; // Joined field for display
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface RegularProgram {
  id: string;
  day: string;
  time: string;
  location: string;
  description: string;
  order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  type: RequestType;
  content: string;
  name?: string;
  email?: string;
  phone?: string;
  status: RequestStatus;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface ChurchInfo {
  id: string;
  founder_1_name: string;
  founder_1_image_url: string;
  founder_2_name: string;
  founder_2_image_url: string;
  description: string;
  updated_at: string;
}

export interface GalleryPhoto {
  id: string;
  image_url: string;
  event_id?: string;
  event_name?: string;
  caption?: string;
  taken_at?: string;
  created_at: string;
}

export interface DonationCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface YearlyBudget {
  id: string;
  year: number;
  category_id: string;
  target_amount: number;
  allocated_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  category_name?: string; // Joined field
}

export interface Donation {
  id: string;
  amount: number;
  donor_name?: string;
  donor_email?: string;
  category_id?: string;
  member_id?: string;
  status: DonationStatus;
  etransfer_email?: string;
  notes?: string;
  received_at?: string;
  created_at: string;
  category_name?: string; // Joined field
}

export interface Department {
  id: string;
  name: string;
  description?: string; // markdown
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  member_id: string;
  is_lead: boolean;
  joined_at: string;
  member_name?: string; // joined from members
  member_picture_url?: string; // joined from members
  member_email?: string; // joined from members
  member_phone?: string; // joined from members
}

export interface DepartmentJoinRequest {
  id: string;
  department_id: string;
  member_name: string;
  member_email?: string;
  member_phone?: string;
  status: DepartmentRequestStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  department_name?: string; // joined from departments
}

export interface MinistryDetails {
  meeting_day?: string;
  meeting_time?: string;
  meeting_location?: string;
  meeting_frequency?: string;
  who_can_join?: {
    age_range_min?: number;
    age_range_max?: number | null;
    gender?: string;
    open_to_visitors?: boolean;
  };
  activities?: string[];
  cta_type?: string;
  cta_value?: string;
}

export interface Ministry {
  id: string;
  name: string;
  description?: string; // markdown
  image_url?: string;
  display_order: number;
  is_active: boolean;
  details?: MinistryDetails;
  created_at: string;
  updated_at: string;
}

export interface MinistryMember {
  id: string;
  ministry_id: string;
  member_id: string;
  is_lead: boolean;
  joined_at: string;
  member_name?: string; // joined from members
  member_picture_url?: string; // joined from members
  member_email?: string; // joined from members
  member_phone?: string; // joined from members
}

export interface MinistryJoinRequest {
  id: string;
  ministry_id: string;
  member_name: string;
  member_email?: string;
  member_phone?: string;
  status: DepartmentRequestStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  ministry_name?: string; // joined from ministries
}

export interface SuggestionCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetBreakdown {
  ministry_programs: number;
  community_outreach: number;
  staff_administration: number;
  facilities_operations: number;
}

export interface FinancialYear {
  id: string;
  year: number;
  total_donations?: number;
  total_expenses?: number;
  budget_breakdown?: BudgetBreakdown;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  category_id?: string;
  custom_category?: string;
  suggestion_text: string;
  submitter_name?: string;
  submitter_phone?: string;
  member_id?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category_name?: string; // joined from suggestion_categories
}

// Message Board Types
export type BoardAccessType =
  | "public"
  | "authenticated"
  | "role_based"
  | "department"
  | "ministry";
export type BoardAccessRuleType =
  | "title"
  | "department"
  | "ministry"
  | "member";
export type BoardAccessLevel = "read" | "write" | "moderate";
export type MessageReactionType = "like" | "love" | "prayer" | "check";
export type MessageReportStatus =
  | "pending"
  | "reviewed"
  | "resolved"
  | "dismissed";

export interface MessageBoard {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  access_type: BoardAccessType;
  created_by?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  display_order: number;
  pinned_announcement?: string;
  created_by_name?: string; // joined from members
}

export interface BoardAccessRule {
  id: string;
  board_id: string;
  rule_type: BoardAccessRuleType;
  rule_value: string;
  access_level: BoardAccessLevel;
  created_at: string;
  rule_value_name?: string; // joined from titles/departments/ministries/members
}

export interface BoardModerator {
  id: string;
  board_id: string;
  member_id: string;
  assigned_by?: string;
  assigned_at: string;
  member_name?: string; // joined from members
  member_picture_url?: string; // joined from members
}

export interface MessageThread {
  id: string;
  board_id: string;
  title: string;
  created_by?: string;
  is_locked: boolean;
  is_pinned: boolean;
  locked_by?: string;
  locked_at?: string;
  archived_at?: string;
  last_message_at?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  created_by_name?: string; // joined from members
  created_by_picture_url?: string; // joined from members
}

export interface Message {
  id: string;
  thread_id: string;
  author_id?: string;
  content: string;
  content_html?: string;
  reply_to_id?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  author_name?: string; // joined from members
  author_picture_url?: string; // joined from members
  reply_to?: Message; // nested reply
  reactions?: MessageReaction[]; // joined reactions
  replies?: Message[]; // nested replies for threaded view
  replyCount?: number; // count of direct replies
}

export interface MessageEdit {
  id: string;
  message_id: string;
  content: string;
  edited_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  member_id: string;
  reaction_type: MessageReactionType;
  created_at: string;
  member_name?: string; // joined from members
}

export interface MessageReport {
  id: string;
  message_id: string;
  reported_by?: string;
  reason: string;
  status: MessageReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  reported_by_name?: string; // joined from members
  message?: Message; // joined message
}

export interface BoardNotificationPreference {
  id: string;
  member_id: string;
  board_id: string;
  email_notifications: boolean;
  in_app_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModerationLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  moderator_id?: string;
  reason?: string;
  created_at: string;
  moderator_name?: string; // joined from members
}

export interface Notification {
  id: string;
  member_id: string;
  type: string;
  board_id?: string;
  thread_id?: string;
  message_id?: string;
  is_read: boolean;
  created_at: string;
  board_name?: string; // joined from message_boards
  thread_title?: string; // joined from message_threads
  message_preview?: string; // joined from messages
}

export interface MessageView {
  id: string;
  message_id: string;
  member_id: string;
  seen_at: string;
}

export interface Testimony {
  id: string;
  content: string;
  author_name: string;
  author_email?: string;
  is_featured: boolean;
  is_approved: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}
