export class InMemoryOtpStore {
  #records = new Map();

  async get(mobileNumber) {
    return this.#records.get(mobileNumber);
  }

  async set(mobileNumber, record) {
    this.#records.set(mobileNumber, record);
  }

  async clear(mobileNumber) {
    this.#records.delete(mobileNumber);
  }
}
