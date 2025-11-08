// Shipping Service - Tính phí vận chuyển cho các đơn vị khác nhau

// Cấu hình đơn vị vận chuyển
const shippingProviders = {
  ghn: {
    name: "Giao Hàng Nhanh (GHN)",
    logo: "🚚",
    services: {
      standard: {
        name: "Tiêu chuẩn",
        baseRate: 15000, // VNĐ
        perKgRate: 5000,
        estimatedDays: "3-5 ngày",
      },
      express: {
        name: "Nhanh",
        baseRate: 25000,
        perKgRate: 8000,
        estimatedDays: "1-2 ngày",
      },
    },
  },
  ghtk: {
    name: "Giao Hàng Tiết Kiệm (GHTK)",
    logo: "📦",
    freeShipping: true, // Miễn phí vận chuyển
    services: {
      standard: {
        name: "Tiêu chuẩn",
        baseRate: 0, // Free shipping
        perKgRate: 0,
        estimatedDays: "2-3 ngày",
      },
      express: {
        name: "Nhanh",
        baseRate: 0, // Free shipping
        perKgRate: 0,
        estimatedDays: "1-2 ngày",
      },
    },
  },
  "viettel-post": {
    name: "Viettel Post",
    logo: "📮",
    freeShipping: true, // Miễn phí vận chuyển
    services: {
      standard: {
        name: "Tiêu chuẩn",
        baseRate: 0, // Free shipping
        perKgRate: 0,
        estimatedDays: "3-5 ngày",
      },
      express: {
        name: "Nhanh",
        baseRate: 0, // Free shipping
        perKgRate: 0,
        estimatedDays: "1-2 ngày",
      },
    },
  },
  "j&t": {
    name: "J&T Express",
    logo: "🚛",
    services: {
      standard: {
        name: "Tiêu chuẩn",
        baseRate: 13000,
        perKgRate: 4200,
        estimatedDays: "3-5 ngày",
      },
      express: {
        name: "Nhanh",
        baseRate: 23000,
        perKgRate: 7200,
        estimatedDays: "1-2 ngày",
      },
    },
  },
  "grab-express": {
    name: "Grab Express",
    logo: "🏍️",
    services: {
      instant: {
        name: "Giao ngay",
        baseRate: 35000,
        perKgRate: 10000,
        estimatedDays: "Trong ngày",
      },
      sameday: {
        name: "Trong ngày",
        baseRate: 28000,
        perKgRate: 8500,
        estimatedDays: "Trong ngày",
      },
    },
  },
};

/**
 * Tính phí vận chuyển cho một sản phẩm
 * @param {Object} product - Sản phẩm cần tính phí
 * @param {Number} quantity - Số lượng
 * @param {String} provider - Đơn vị vận chuyển (ghn, ghtk, viettel-post, j&t, grab-express)
 * @param {String} serviceType - Loại dịch vụ (standard, express, instant, sameday)
 * @returns {Number} - Phí vận chuyển
 */
export const calculateShippingFee = (
  product,
  quantity,
  provider = "ghn",
  serviceType = "standard"
) => {
  // Kiểm tra sản phẩm có miễn phí vận chuyển không
  if (product.shipping?.freeShipping) {
    return 0;
  }

  // Lấy thông tin đơn vị vận chuyển
  const shippingProvider = shippingProviders[provider];
  if (!shippingProvider) {
    throw new Error("Đơn vị vận chuyển không hợp lệ");
  }

  const service = shippingProvider.services[serviceType];
  if (!service) {
    throw new Error("Loại dịch vụ không hợp lệ");
  }

  // Lấy trọng lượng sản phẩm (mặc định 0.5kg nếu không có)
  const weight = product.shipping?.weight || 0.5;
  const totalWeight = weight * quantity;

  // Tính phí cơ bản + phí theo cân nặng
  let shippingFee = service.baseRate + totalWeight * service.perKgRate;

  // Áp dụng phụ phí cho các loại sản phẩm đặc biệt
  const shippingClass = product.shipping?.shippingClass || "standard";
  switch (shippingClass) {
    case "fragile": // Hàng dễ vỡ
      shippingFee *= 1.2;
      break;
    case "bulky": // Hàng cồng kềnh
      shippingFee *= 1.5;
      break;
    case "express": // Giao nhanh
      shippingFee *= 1.3;
      break;
    default:
      break;
  }

  // Làm tròn đến nghìn
  return Math.ceil(shippingFee / 1000) * 1000;
};

/**
 * Tính tổng phí vận chuyển cho giỏ hàng
 * @param {Array} cartItems - Danh sách sản phẩm trong giỏ
 * @param {String} provider - Đơn vị vận chuyển
 * @param {String} serviceType - Loại dịch vụ
 * @returns {Object} - Thông tin vận chuyển chi tiết
 */
export const calculateCartShipping = (
  cartItems,
  provider = "ghn",
  serviceType = "standard"
) => {
  let totalShippingFee = 0;
  const itemsWithShipping = [];

  cartItems.forEach((item) => {
    const shippingFee = calculateShippingFee(
      item,
      item.quantity || 1,
      provider,
      serviceType
    );
    totalShippingFee += shippingFee;

    itemsWithShipping.push({
      productId: item._id,
      name: item.name,
      quantity: item.quantity || 1,
      shippingFee,
    });
  });

  const shippingProvider = shippingProviders[provider];
  const service = shippingProvider.services[serviceType];

  return {
    provider,
    providerName: shippingProvider.name,
    providerLogo: shippingProvider.logo,
    serviceType,
    serviceName: service.name,
    estimatedDelivery: service.estimatedDays,
    totalShippingFee,
    itemsWithShipping,
  };
};

/**
 * Lấy danh sách tất cả đơn vị vận chuyển có sẵn
 * @returns {Array} - Danh sách đơn vị vận chuyển
 */
export const getAvailableShippingProviders = () => {
  return Object.entries(shippingProviders).map(([key, value]) => ({
    id: key,
    name: value.name,
    logo: value.logo,
    freeShipping: value.freeShipping || false,
    services: Object.entries(value.services).map(
      ([serviceKey, serviceValue]) => ({
        id: serviceKey,
        name: serviceValue.name,
        estimatedDelivery: serviceValue.estimatedDays,
        baseRate: serviceValue.baseRate,
      })
    ),
  }));
};

/**
 * Lấy phương án vận chuyển tốt nhất (rẻ nhất)
 * @param {Array} cartItems - Danh sách sản phẩm
 * @returns {Object} - Phương án vận chuyển tốt nhất
 */
export const getBestShippingOption = (cartItems) => {
  let bestOption = null;
  let lowestFee = Infinity;

  Object.keys(shippingProviders).forEach((provider) => {
    const providerServices = shippingProviders[provider].services;
    Object.keys(providerServices).forEach((serviceType) => {
      const shippingInfo = calculateCartShipping(
        cartItems,
        provider,
        serviceType
      );
      if (shippingInfo.totalShippingFee < lowestFee) {
        lowestFee = shippingInfo.totalShippingFee;
        bestOption = shippingInfo;
      }
    });
  });

  return bestOption;
};

export default {
  calculateShippingFee,
  calculateCartShipping,
  getAvailableShippingProviders,
  getBestShippingOption,
  shippingProviders,
};
