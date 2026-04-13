const nowIso = () => new Date().toISOString();

export class InMemoryBeneficiaryStore {
  #byId = new Map();
  #idByMobile = new Map();
  #matchesByBeneficiaryId = new Map();
  #nextId = 1;

  async upsertByMobile(input) {
    const existingId = this.#idByMobile.get(input.mobileNumber);
    if (existingId) {
      const existing = this.#byId.get(existingId);
      const updated = {
        ...existing,
        aadhaarStatus: input.aadhaarStatus,
        registrationMode: input.registrationMode,
        profile: input.profile,
        updatedAt: nowIso(),
      };
      this.#byId.set(existingId, updated);
      return { beneficiary: updated, created: false };
    }

    const id = String(this.#nextId++);
    const createdAt = nowIso();
    const beneficiary = {
      id,
      mobileNumber: input.mobileNumber,
      aadhaarStatus: input.aadhaarStatus,
      registrationMode: input.registrationMode,
      profile: input.profile,
      createdAt,
      updatedAt: createdAt,
    };
    this.#idByMobile.set(input.mobileNumber, id);
    this.#byId.set(id, beneficiary);
    return { beneficiary, created: true };
  }

  async getById(id) {
    return this.#byId.get(String(id));
  }

  async saveMatches(beneficiaryId, matches) {
    this.#matchesByBeneficiaryId.set(String(beneficiaryId), {
      beneficiaryId: String(beneficiaryId),
      createdAt: nowIso(),
      matches,
    });
  }

  async getMatches(beneficiaryId) {
    return this.#matchesByBeneficiaryId.get(String(beneficiaryId));
  }

  async getSummary() {
    const beneficiaries = Array.from(this.#byId.values());
    const totalRegistrations = beneficiaries.length;

    const byDistrict = {};
    for (const beneficiary of beneficiaries) {
      const district = beneficiary.profile.district || 'unknown';
      byDistrict[district] = (byDistrict[district] || 0) + 1;
    }

    return {
      totalRegistrations,
      districtBreakdown: byDistrict,
    };
  }

  async getRecent(limit = 20, offset = 0) {
    const all = Array.from(this.#byId.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
      limit,
      offset,
    };
  }
}
