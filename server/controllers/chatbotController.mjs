import ProductModel from "../models/productModel.js";

// AI Chatbot Controller
export const handleChatbot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tin nhắn",
      });
    }

    const userMessage = message.toLowerCase().trim();

    // Analyze user intent and extract keywords
    const intent = analyzeIntent(userMessage);
    console.log("Intent analyzed:", intent);
    let response = "";
    let products = [];

    switch (intent.type) {
      case "search":
        // Search for products based on keywords
        products = await searchProducts(intent.keywords, intent.filters);
        response = generateSearchResponse(products, intent.keywords);
        break;

      case "price_inquiry":
        products = await searchProducts(intent.keywords, intent.filters);
        response = generatePriceResponse(products, intent.keywords);
        break;

      case "recommendation":
        products = await getRecommendations(intent.category, intent.filters);
        response = generateRecommendationResponse(products, intent.category);
        break;

      case "latest":
        products = await getLatestProducts(intent.filters);
        response = "Đây là những sản phẩm mới nhất của chúng tôi:";
        break;

      case "bestseller":
        products = await getBestSellers(intent.filters);
        response = "Đây là những sản phẩm bán chạy nhất:";
        break;

      case "greeting":
        response =
          "Xin chào! Tôi là trợ lý nội thất của bạn. Tôi có thể giúp bạn tìm kiếm nội thất phù hợp, tư vấn về giá cả và phong cách. Bạn đang tìm loại nội thất nào?";
        break;

      case "help":
        response = `Tôi có thể giúp bạn:
• Tìm kiếm nội thất theo tên, danh mục
• Tư vấn về giá cả và khuyến mãi
• Gợi ý nội thất phù hợp
• Xem nội thất mới nhất
• Xem nội thất bán chạy

Hãy thử hỏi tôi: "Bàn ghế phòng khách" hoặc "Giường ngủ giá tốt"`;
        break;

      default:
        products = await searchProducts([userMessage], {});
        if (products.length > 0) {
          response = `Tôi tìm thấy ${products.length} sản phẩm phù hợp với yêu cầu của bạn:`;
        } else {
          response =
            "Xin lỗi, tôi không tìm thấy sản phẩm phù hợp. Bạn có thể thử tìm kiếm với từ khóa khác hoặc hỏi tôi về các danh mục sản phẩm có sẵn.";
        }
    }

    // Limit products to top 5
    products = products.slice(0, 5);

    res.json({
      success: true,
      response,
      products,
      intent: intent.type,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xử lý yêu cầu",
      response: "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.",
    });
  }
};

// Analyze user intent from message
function analyzeIntent(message) {
  const intent = {
    type: "search",
    keywords: [],
    filters: {},
    category: null,
  };

  // Greeting detection
  if (/^(xin chào|chào|hello|hi|hey)/i.test(message) || message.length < 10) {
    intent.type = "greeting";
    return intent;
  }

  // Help detection
  if (/giúp|help|hỗ trợ|hướng dẫn/i.test(message)) {
    intent.type = "help";
    return intent;
  }

  // Latest products
  if (/mới nhất|new|latest|sản phẩm mới/i.test(message)) {
    intent.type = "latest";
  }

  // Best sellers
  if (/bán chạy|best seller|hot|phổ biến/i.test(message)) {
    intent.type = "bestseller";
  }

  // Extract categories and furniture keywords first
  const furnitureKeywords = [
    "bàn",
    "ghế",
    "tủ",
    "giường",
    "sofa",
    "kệ",
    "đèn",
    "tranh",
    "thảm",
    "gương",
    "bếp",
    "ăn",
    "tivi",
    "trà",
    "làm việc",
    "văn phòng",
    "sách",
    "trang điểm",
    "quần áo",
    "nội thất",
  ];

  const hasFurnitureKeyword = furnitureKeywords.some((kw) =>
    message.includes(kw),
  );

  // Price inquiry (only if no specific furniture keyword)
  if (/giá|price|bao nhiêu|cost/i.test(message) && !hasFurnitureKeyword) {
    intent.type = "price_inquiry";
  }

  // Recommendation
  if (
    /gợi ý|recommend|tư vấn|nên|tốt nhất|best/i.test(message) &&
    !hasFurnitureKeyword
  ) {
    intent.type = "recommendation";
  }

  // Extract price range
  const priceMatch = message.match(/(\d+)\s*(triệu|tr|million|k|nghìn)/gi);
  if (priceMatch) {
    const prices = priceMatch.map((p) => {
      const num = parseInt(p);
      if (/triệu|tr|million/i.test(p)) return num * 1000000;
      if (/k|nghìn/i.test(p)) return num * 1000;
      return num;
    });

    if (prices.length >= 2) {
      intent.filters.minPrice = Math.min(...prices);
      intent.filters.maxPrice = Math.max(...prices);
    } else if (prices.length === 1) {
      if (/dưới|under|less|nhỏ hơn/i.test(message)) {
        intent.filters.maxPrice = prices[0];
      } else if (/trên|over|more|lớn hơn/i.test(message)) {
        intent.filters.minPrice = prices[0];
      } else {
        intent.filters.maxPrice = prices[0];
      }
    }
  }

  // Extract categories and specific furniture keywords
  const categories = {
    "phòng khách": ["phòng khách", "sofa", "bàn ghế", "kệ tivi", "bàn trà"],
    "phòng ngủ": ["phòng ngủ", "giường", "tủ quần áo", "bàn trang điểm"],
    "phòng bếp": ["phòng bếp", "bếp", "tủ bếp", "bàn ăn", "ghế ăn"],
    "phòng làm việc": [
      "phòng làm việc",
      "bàn làm việc",
      "ghế văn phòng",
      "kệ sách",
    ],
    "trang trí": ["trang trí", "tranh", "thảm", "đèn", "gương"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => message.includes(kw))) {
      intent.category = category;
      intent.keywords.push(...keywords.filter((kw) => message.includes(kw)));
    }
  }

  // Add individual furniture keywords
  furnitureKeywords.forEach((keyword) => {
    if (message.includes(keyword) && !intent.keywords.includes(keyword)) {
      intent.keywords.push(keyword);
    }
  });

  // Extract general keywords (remove common words)
  const commonWords = [
    "tìm",
    "kiếm",
    "cho",
    "tôi",
    "mình",
    "có",
    "không",
    "được",
    "hay",
    "của",
    "và",
    "với",
    "về",
    "trong",
    "ngoài",
    "các",
    "những",
    "một",
    "cái",
  ];

  const words = message
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word));

  // Add all meaningful words to keywords
  intent.keywords = [...new Set([...intent.keywords, ...words])];

  // If no keywords found, use the entire message
  if (intent.keywords.length === 0) {
    intent.keywords.push(userMessage);
  }

  return intent;
}

// Search products
async function searchProducts(keywords, filters = {}) {
  try {
    const query = { isAvailable: true };

    // Build search query with better keyword matching
    if (keywords.length > 0) {
      // Create regex pattern for each keyword
      const keywordPatterns = keywords
        .map((kw) => kw.trim())
        .filter((kw) => kw.length > 0);
      const regexPattern = keywordPatterns.join("|");

      console.log("Search keywords:", keywordPatterns);
      console.log("Regex pattern:", regexPattern);

      query.$or = [
        { name: { $regex: regexPattern, $options: "i" } },
        { description: { $regex: regexPattern, $options: "i" } },
        { brand: { $regex: regexPattern, $options: "i" } },
        { category: { $regex: regexPattern, $options: "i" } },
        { tags: { $elemMatch: { $regex: regexPattern, $options: "i" } } },
      ];
    }

    // Price filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    const products = await ProductModel.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name price images rating category brand");

    console.log(`Found ${products.length} products for search`);
    return products;
  } catch (error) {
    console.error("Search products error:", error);
    return [];
  }
}

// Get recommendations
async function getRecommendations(category, filters = {}) {
  try {
    const query = { isAvailable: true };

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    const products = await ProductModel.find(query)
      .sort({ soldQuantity: -1 })
      .limit(10)
      .select("name price images rating category brand");

    return products;
  } catch (error) {
    console.error("Get recommendations error:", error);
    return [];
  }
}

// Get latest products
async function getLatestProducts(filters = {}) {
  try {
    const query = { isAvailable: true };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    const products = await ProductModel.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name price images rating category brand");

    return products;
  } catch (error) {
    console.error("Get latest products error:", error);
    return [];
  }
}

// Get best sellers
async function getBestSellers(filters = {}) {
  try {
    const query = { isAvailable: true };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    const products = await ProductModel.find(query)
      .sort({ soldQuantity: -1 })
      .limit(10)
      .select("name price images rating category brand soldQuantity");

    return products;
  } catch (error) {
    console.error("Get best sellers error:", error);
    return [];
  }
}

// Generate responses
function generateSearchResponse(products, keywords) {
  if (products.length === 0) {
    return `Xin lỗi, tôi không tìm thấy sản phẩm nào về "${keywords.slice(0, 3).join(", ")}". Bạn có thể thử:\n• Tìm theo danh mục (phòng khách, phòng ngủ, phòng bếp)\n• Tìm theo loại (bàn, ghế, tủ, giường)\n• Xem sản phẩm mới nhất`;
  }

  const keywordsDisplay = keywords.slice(0, 3).join(", ");
  if (products.length === 1) {
    return `Tôi tìm thấy 1 sản phẩm về ${keywordsDisplay}:`;
  }

  return `Tôi tìm thấy ${products.length} sản phẩm về ${keywordsDisplay}:`;
}

function generatePriceResponse(products, keywords) {
  if (products.length === 0) {
    return `Xin lỗi, tôi không tìm thấy sản phẩm nào.`;
  }

  const keywordsDisplay = keywords.slice(0, 3).join(", ");
  return `Đây là các sản phẩm về ${keywordsDisplay} với thông tin giá:`;
}

function generateRecommendationResponse(products, category) {
  if (products.length === 0) {
    return "Xin lỗi, hiện tại chúng tôi chưa có sản phẩm phù hợp để gợi ý.";
  }

  const categoryText = category ? `cho ${category}` : "";
  return `Dựa trên đánh giá và độ phổ biến, đây là những sản phẩm tốt nhất ${categoryText}:`;
}
