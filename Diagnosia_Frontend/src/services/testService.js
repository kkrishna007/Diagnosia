


export const testService = {
  async getAllTests(params = {}) {
    const response = await apiService.tests.getAll(params);
    return response;
  },

  async getTestById(id) {
    const response = await apiService.tests.getById(id);
    return response;
  },

  async getCategories() {
    const response = await apiService.tests.getCategories();
    return response;
  },

  async searchTests(query) {
    const response = await apiService.tests.search(query);
    return response;
  },

  // TODO: Implement getAvailableSlots using backend API if needed

  // TODO: Implement createBooking using backend API if needed

  // TODO: Implement getBookingById using backend API if needed

  // TODO: Implement cancelBooking using backend API if needed
};