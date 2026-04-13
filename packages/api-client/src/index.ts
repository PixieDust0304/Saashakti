import type {
  AadhaarStatus,
  ApiErrorBody,
  BeneficiaryProfilePayload,
  CreateBeneficiaryResponse,
  DashboardRecentResponse,
  DashboardSummary,
  GetMeResponse,
  HealthResponse,
  IntakeRequest,
  IntakeResponse,
  KycResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  ReadyResponse,
  RegistrationMode,
  RunMatchingResponse,
} from './types.js';

export * from './types.js';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(status: number, body: ApiErrorBody, requestId?: string) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.requestId = requestId;
  }
}

export interface SaashaktiClientOptions {
  baseUrl: string;
  /** Session bearer token (from /v1/otp/verify). Can be set later via setToken. */
  token?: string | null;
  /** Override fetch for tests or SSR. Defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Extra headers to attach to every request. */
  defaultHeaders?: Record<string, string>;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method: HttpMethod;
  path: string;
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

const buildUrl = (base: string, path: string, query?: RequestOptions['query']): string => {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
};

export class SaashaktiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;
  private token: string | null;

  constructor(options: SaashaktiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.fetchImpl = options.fetch ?? fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.token = options.token ?? null;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(opts: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      ...this.defaultHeaders,
    };

    if (opts.body !== undefined) {
      headers['content-type'] = 'application/json';
    }

    if (opts.auth) {
      if (!this.token) {
        throw new ApiError(401, {
          code: 'unauthenticated',
          message: 'No session token — call verifyOtp first',
        });
      }
      headers.authorization = `Bearer ${this.token}`;
    }

    const url = buildUrl(this.baseUrl, opts.path, opts.query);
    const res = await this.fetchImpl(url, {
      method: opts.method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    const requestId = res.headers.get('x-request-id') ?? undefined;
    const text = await res.text();
    const payload = text.length > 0 ? (JSON.parse(text) as unknown) : undefined;

    if (!res.ok) {
      const errBody =
        payload && typeof payload === 'object' && 'error' in payload
          ? ((payload as { error: ApiErrorBody }).error)
          : { code: 'unknown_error', message: res.statusText };
      throw new ApiError(res.status, errBody, requestId);
    }

    return payload as T;
  }

  // -- Health --
  health(): Promise<HealthResponse> {
    return this.request<HealthResponse>({ method: 'GET', path: '/health' });
  }

  ready(): Promise<ReadyResponse> {
    return this.request<ReadyResponse>({ method: 'GET', path: '/ready' });
  }

  // -- OTP + session --
  requestOtp(mobileNumber: string): Promise<OtpRequestResponse> {
    return this.request<OtpRequestResponse>({
      method: 'POST',
      path: '/v1/otp/request',
      body: { mobileNumber },
    });
  }

  async verifyOtp(mobileNumber: string, code: string): Promise<OtpVerifyResponse> {
    const res = await this.request<OtpVerifyResponse>({
      method: 'POST',
      path: '/v1/otp/verify',
      body: { mobileNumber, code },
    });
    this.token = res.session.token;
    return res;
  }

  // -- Aadhaar --
  startAadhaar(): Promise<{ status: AadhaarStatus }> {
    return this.request<{ status: AadhaarStatus }>({
      method: 'POST',
      path: '/v1/aadhaar/start',
      auth: true,
    });
  }

  getAadhaarStatus(): Promise<{ status: AadhaarStatus }> {
    return this.request<{ status: AadhaarStatus }>({
      method: 'GET',
      path: '/v1/aadhaar/status',
      auth: true,
    });
  }

  /**
   * Mock e-KYC fetch. Public + rate-limited; pulls a deterministic
   * fake KYC record from the backend so the admin-web intake form
   * can pre-fill name, age, gender, address, district, pincode, etc.
   */
  fetchAadhaarKyc(aadhaarNumber: string): Promise<KycResponse> {
    return this.request<KycResponse>({
      method: 'GET',
      path: '/v1/aadhaar/kyc',
      query: { aadhaarNumber },
    });
  }

  // -- Beneficiary --
  createBeneficiary(registrationMode: RegistrationMode = 'self'): Promise<CreateBeneficiaryResponse> {
    return this.request<CreateBeneficiaryResponse>({
      method: 'POST',
      path: '/v1/beneficiary',
      body: { registrationMode },
      auth: true,
    });
  }

  getMe(): Promise<GetMeResponse> {
    return this.request<GetMeResponse>({
      method: 'GET',
      path: '/v1/beneficiary/me',
      auth: true,
    });
  }

  saveProfile(profile: BeneficiaryProfilePayload): Promise<{ profile: GetMeResponse['profile'] }> {
    return this.request<{ profile: GetMeResponse['profile'] }>({
      method: 'PUT',
      path: '/v1/beneficiary/profile',
      body: profile,
      auth: true,
    });
  }

  // -- Matching --
  runMatching(): Promise<RunMatchingResponse> {
    return this.request<RunMatchingResponse>({
      method: 'POST',
      path: '/v1/matching/run',
      auth: true,
    });
  }

  getMatches(): Promise<RunMatchingResponse> {
    return this.request<RunMatchingResponse>({
      method: 'GET',
      path: '/v1/matching/me',
      auth: true,
    });
  }

  // -- Rich intake (public, rate-limited) --
  submitIntake(request: IntakeRequest): Promise<IntakeResponse> {
    return this.request<IntakeResponse>({
      method: 'POST',
      path: '/v1/intake',
      body: request,
    });
  }

  // -- Dashboard (public) --
  getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>({
      method: 'GET',
      path: '/v1/dashboard/summary',
    });
  }

  getDashboardRecent(limit: number = 20): Promise<DashboardRecentResponse> {
    return this.request<DashboardRecentResponse>({
      method: 'GET',
      path: '/v1/dashboard/recent',
      query: { limit },
    });
  }
}

export const createClient = (options: SaashaktiClientOptions): SaashaktiClient =>
  new SaashaktiClient(options);
