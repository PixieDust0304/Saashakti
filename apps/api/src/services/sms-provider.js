export class MockSmsProvider {
  #lastOtpByPhone = new Map();

  async sendOtp(mobileNumber, otp) {
    this.#lastOtpByPhone.set(mobileNumber, otp);
    return { accepted: true, provider: 'mock-sms' };
  }

  getLastOtp(mobileNumber) {
    return this.#lastOtpByPhone.get(mobileNumber);
  }
}
