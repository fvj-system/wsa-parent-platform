export type ClassStatus = "draft" | "published" | "full" | "cancelled" | "completed";
export type BookingStatus = "pending" | "confirmed" | "attended" | "waitlisted" | "cancelled" | "no_show";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";

export type ClassRecord = {
  id: string;
  title: string;
  description: string | null;
  class_type: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  age_min: number | null;
  age_max: number | null;
  price_cents: number;
  max_capacity: number;
  spots_remaining: number;
  what_to_bring: string | null;
  weather_note: string | null;
  internal_notes?: string | null;
  waiver_required: boolean;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
};

export type ClassBookingRecord = {
  id: string;
  class_id: string;
  user_id: string;
  household_id?: string;
  student_id: string | null;
  registration_group_id?: string;
  group_lead?: boolean;
  attendee_count?: number;
  pricing_mode?: "per_child" | "family";
  waiver_id?: string | null;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_paid_cents: number;
  booked_at: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};
