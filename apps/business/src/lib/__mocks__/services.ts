module.exports = {
  driverService: {
    getDrivers: jest.fn(),
    createDriver: jest.fn(),
    updateDriver: jest.fn(),
    deleteDriver: jest.fn(),
    getDriverStats: jest.fn(),
  },
  deliveryService: {
    getDeliveries: jest.fn(),
    getDelivery: jest.fn(),
    createDelivery: jest.fn(),
    updateDelivery: jest.fn(),
    deleteDelivery: jest.fn(),
    assignDriver: jest.fn(),
    updateStatus: jest.fn(),
    getDeliveryByTrackingCode: jest.fn(),
  },
  businessService: {
    getBusiness: jest.fn(),
    updateBusiness: jest.fn(),
    getBusinessStats: jest.fn(),
    createBusiness: jest.fn(),
  },
}