export type Profile = {
  id: string;
  full_name: string;
  household_name: string | null;
  household_id?: string;
  phone: string | null;
};

export type Waiver = {
  id: string;
  household_id?: string;
  child_name: string;
  emergency_contact: string;
  medical_notes: string | null;
  signature_name: string;
  signed_at: string;
};

export type PhotoAsset = {
  id: string;
  caption: string | null;
  image_path: string;
  created_at: string;
  public_url?: string;
};

export type TreeIdentification = {
  id: string;
  species_name: string;
  confidence: number;
  notes: string | null;
  created_at: string;
  image_path: string | null;
  public_url?: string;
};
