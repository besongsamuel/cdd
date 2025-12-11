export type MemberType = "leader" | "regular";

export type RequestType = "prayer" | "support" | "testimony";

export type RequestStatus = "pending" | "approved" | "completed";

export type DonationStatus = "pending" | "received" | "verified";

export interface Member {
  id: string;
  name: string;
  type: MemberType;
  bio?: string;
  picture_url?: string;
  passions?: string[];
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
  status: DonationStatus;
  etransfer_email?: string;
  notes?: string;
  received_at?: string;
  created_at: string;
  category_name?: string; // Joined field
}
