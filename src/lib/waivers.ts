export type WaiverRecord = {
  id: string;
  user_id: string;
  household_id?: string;
  student_id: string | null;
  child_name?: string;
  emergency_contact?: string;
  medical_notes?: string | null;
  waiver_type: string;
  accepted_at: string;
  signature_name: string;
  signature_data: string | null;
  version: string;
  save_on_file?: boolean;
};
