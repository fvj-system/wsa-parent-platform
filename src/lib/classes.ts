export type ClassStatus = "draft" | "scheduled" | "published" | "full" | "cancelled" | "completed" | "archived";
export type BookingStatus = "pending" | "confirmed" | "attended" | "waitlisted" | "cancelled" | "no_show";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";

export type ClassRecord = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  class_date: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  price_child: number | null;
  price_family: number | null;
  capacity: number | null;
  image_url: string | null;
  what_to_bring: string | null;
  age_range: string | null;
  registration_link_child: string | null;
  registration_link_family: string | null;
  is_featured: boolean;
  status: ClassStatus;
  created_at: string;
  updated_at: string;
  enrolled_count?: number | null;
  repeat_family_count?: number | null;
  reminder_status?: string | null;
  class_type?: string | null;
  date?: string | null;
  age_min?: number | null;
  age_max?: number | null;
  price_cents?: number | null;
  max_capacity?: number | null;
  spots_remaining?: number | null;
  weather_note?: string | null;
  internal_notes?: string | null;
  waiver_required?: boolean;
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

export function getClassDateValue(classItem: ClassRecord) {
  return classItem.class_date ?? classItem.date ?? null;
}

export function getClassPrimaryPrice(classItem: ClassRecord) {
  if (typeof classItem.price_child === "number") return classItem.price_child;
  if (typeof classItem.price_cents === "number") return classItem.price_cents / 100;
  return null;
}

export function getClassFamilyPrice(classItem: ClassRecord) {
  return typeof classItem.price_family === "number" ? classItem.price_family : null;
}

export function getClassCapacity(classItem: ClassRecord) {
  if (typeof classItem.capacity === "number") return classItem.capacity;
  if (typeof classItem.max_capacity === "number") return classItem.max_capacity;
  return null;
}

export function getClassSpotsLeft(classItem: ClassRecord) {
  if (typeof classItem.spots_remaining === "number") return classItem.spots_remaining;

  const capacity = getClassCapacity(classItem);
  if (capacity === null || typeof classItem.enrolled_count !== "number") return null;

  return Math.max(capacity - classItem.enrolled_count, 0);
}

export function getClassChildRegistrationLink(classItem: ClassRecord) {
  return classItem.registration_link_child || classItem.registration_link_family || null;
}

export function getClassFamilyRegistrationLink(classItem: ClassRecord) {
  return classItem.registration_link_family || classItem.registration_link_child || null;
}
