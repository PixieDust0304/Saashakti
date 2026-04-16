export type AadhaarStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'mock_verified';

export interface KycAddress {
  house?: string;
  street?: string;
  landmark?: string;
  locality?: string;
  vtc: string;
  district: string;
  state: string;
  pincode: string;
  country: string;
}

export interface KycRecord {
  aadhaarLast4: string;
  name: string;
  gender: 'F' | 'M' | 'T';
  dob: string;
  age: number;
  address: KycAddress;
  mobileNumber?: string;
  source: 'mock' | 'uidai' | 'karza' | 'signzy' | 'nsdl';
  fetchedAt: string;
}

export interface AadhaarProvider {
  readonly name: string;
  startVerification(mobileNumber: string): Promise<{ status: AadhaarStatus }>;
  getStatus(mobileNumber: string): Promise<{ status: AadhaarStatus }>;
  fetchKyc(aadhaarNumber: string): Promise<KycRecord>;
}
