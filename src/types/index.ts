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
  passions?: string[];
  email?: string;
  phone?: string;
  user_id?: string;
  is_admin?: boolean;
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
