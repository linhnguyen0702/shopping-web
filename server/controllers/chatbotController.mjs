import ProductModel from "../models/productModel.js";
import chatHistoryModel from "../models/chatHistoryModel.js";

// AI Chatbot Controller
export const handleChatbot = async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tin nhắn và sessionId",
      });
    }

    const userMessage = message.toLowerCase().trim();

    // Fetch previous context
    let previousContext = null;
    try {
      const chatHistory = await chatHistoryModel.findOne({ sessionId });
      if (chatHistory && chatHistory.metadata) {
        previousContext = chatHistory.metadata;
      }
    } catch (err) {
      console.log("Error fetching chat context:", err);
    }

    // Analyze user intent and extract keywords with context
    const intent = analyzeIntent(userMessage, previousContext);
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
          "Xin chào! Tôi là trợ lý mua sắm của bạn. Tôi có thể giúp bạn tìm kiếm sản phẩm phù hợp, tư vấn về mức giá và thương hiệu. Bạn đang tìm sản phẩm nào?";
        break;

      case "help":
        response = `Tôi có thể giúp bạn:
• Tìm kiếm sản phẩm theo tên, danh mục
• Tư vấn về giá cả và thông tin sản phẩm
• Gợi ý sản phẩm dựa trên nhu cầu
• Xem các sản phẩm mới nhất
• Xem các sản phẩm bán chạy

Hãy thử hỏi tôi: "Áo sơ mi nam" hoặc "Mũ bảo hiểm giá tốt"`;
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

    // Save to chat history
    try {
      await saveChatMessage(
        sessionId,
        userId,
        message,
        response,
        intent.type,
        products,
        intent,
      );
    } catch (historyError) {
      console.error("Error saving chat history:", historyError);
      // Không dừng request nếu lỗi lưu history
    }

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

// Save chat message to database
async function saveChatMessage(
  sessionId,
  userId,
  userText,
  botResponse,
  intent,
  products,
  intentDetails,
) {
  try {
    const productData = products.map((p) => ({
      productId: p._id,
      name: p.name,
      price: p.price,
      image: p.images?.[0] || "",
      category: p.category,
      brand: p.brand,
    }));

    const chatHistory = await chatHistoryModel.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: [
            {
              role: "user",
              text: userText,
              intent,
              timestamp: new Date(),
            },
            {
              role: "bot",
              text: botResponse,
              intent,
              products: productData,
              timestamp: new Date(),
            },
          ],
        },
        $set: {
          userId: userId || null,
          "metadata.lastKeywords": intentDetails.keywords,
          "metadata.lastCategory": intentDetails.category,
          "metadata.priceRange": {
            min: intentDetails.filters?.minPrice,
            max: intentDetails.filters?.maxPrice,
          },
        },
        $inc: { "metadata.totalMessages": 2 },
      },
      {
        upsert: true,
        new: true,
      },
    );

    console.log("Chat history saved:", chatHistory._id);
  } catch (error) {
    console.error("Save chat history error:", error);
  }
}

// Analyze user intent from message - IMPROVED
function analyzeIntent(message, previousContext = null) {
  const intent = {
    type: "search",
    keywords: [],
    filters: {},
    category: null,
  };

  // Greeting detection
  if (/^(xin chào|chào|hello|hi|hey)/i.test(message)) {
    intent.type = "greeting";
    return intent;
  }

  // Help detection
  if (/giúp|help|hỗ trợ|hướng dẫn|làm sao|cách|sao/i.test(message)) {
    intent.type = "help";
    return intent;
  }

  // Latest products
  if (/mới nhất|new|latest|sản phẩm mới|vừa ra|ra mắt/i.test(message)) {
    intent.type = "latest";
    return intent;
  }

  // Best sellers
  if (/bán chạy|best seller|hot|phổ biến|chạy nhất|bán nhiều/i.test(message)) {
    intent.type = "bestseller";
    return intent;
  }

  // Extract price range
  const pricePattern =
    /(\d+[\.,]?\d*)\s*(triệu|tr|từ|đến|to|-|~|tới|nghìn|k|vnd|đơn|usd)/gi;
  const priceMatches = [...message.matchAll(pricePattern)];

  if (priceMatches.length > 0) {
    let prices = priceMatches.map((match) => {
      let num = parseFloat(match[1].replace(",", "."));
      const unit = match[2].toLowerCase();

      if (/triệu|tr|million/.test(unit)) {
        num *= 1000000;
      } else if (/k|nghìn/.test(unit)) {
        num *= 1000;
      }

      return Math.floor(num);
    });

    let maxMultiplier = 1;
    prices.forEach(p => {
      if (p >= 1000000) maxMultiplier = 1000000;
      else if (p >= 1000 && maxMultiplier < 1000) maxMultiplier = 1000;
    });

    prices = prices.map(p => {
      if (p < 1000 && maxMultiplier > 1) return p * maxMultiplier;
      return p;
    });

    if (prices.length >= 2) {
      intent.filters.minPrice = Math.min(...prices);
      intent.filters.maxPrice = Math.max(...prices);
    } else if (prices.length === 1) {
      if (/dưới|under|less|nhỏ hơn|tối đa|giới hạn|max/i.test(message)) {
        intent.filters.maxPrice = prices[0];
      } else if (/trên|over|more|lớn hơn|tối thiểu|min/i.test(message)) {
        intent.filters.minPrice = prices[0];
      } else {
        // Default: use as max price
        intent.filters.maxPrice = prices[0];
      }
    }
  }

  // Recommendation intent
  if (
    /gợi ý|recommend|tư vấn|nên|tốt nhất|best choice|suggestion|đề xuất/i.test(
      message,
    )
  ) {
    intent.type = "recommendation";
  }

  // Extract other words (exclude common Vietnamese words)
  const commonWords = new Set([
     "tìm", "kiếm", "cho", "tôi", "mình", "có", "không", "được", "hay", "của", "và", 
     "với", "về", "trong", "ngoài", "các", "những", "một", "cái", "từ", "đến", "tới", 
     "là", "như", "thế", "nào", "gì", "sao", "hoặc", "nhưng", "mà", "thì", "khi", 
     "nếu", "vì", "giúp", "hỗ trợ", "bao", "nhiêu", "giá", "biết", "hiểu", "cách", 
     "bạn", "ạ", "nhé", "nha", "đó", "đây", "muốn", "xem", "khoảng", "tầm", "k", "vnd", "usd", "nghìn", "triệu"
  ]);

  const words = message
    .split(/\s+/)
    .map((w) => w.replace(/[^\w\u00C0-\u1EF9]/g, "").toLowerCase())
    .filter((word) => word.length > 0 && !commonWords.has(word) && !/^\d+$/.test(word));

  intent.keywords = [...new Set(words)];
  
  const isKeywordsEmpty = intent.keywords.length === 0;

  if (isKeywordsEmpty) {
    intent.keywords = [message];
  }

  // --- CONTEXT MERGING LOGIC ---
  if (previousContext) {
    const isOnlyPriceFilter = priceMatches.length > 0 && isKeywordsEmpty;
    
    // If the user seems to just be refining their previous search with price
    if (isOnlyPriceFilter && previousContext.lastKeywords && previousContext.lastKeywords.length > 0) {
      intent.keywords = previousContext.lastKeywords;
      intent.category = previousContext.lastCategory || intent.category;
      intent.type = "price_inquiry";
    }
  }

  // If price mentioned and keywords identified, prioritize as price inquiry
  if (priceMatches.length > 0 && intent.keywords.length > 0 && intent.type === "search" && !isKeywordsEmpty) {
    intent.type = "price_inquiry";
  }

  console.log("Intent details:", {
    type: intent.type,
    keywords: intent.keywords,
    category: intent.category,
    filters: intent.filters,
  });

  return intent;
}

// Search products - IMPROVED
async function searchProducts(keywords, filters = {}) {
  try {
    const query = { isAvailable: true };

    // Build search query with better keyword matching
    if (keywords.length > 0) {
      // Filter out common words and very short keywords
      const validKeywords = keywords
        .filter((kw) => kw && kw.length > 0)
        .map((kw) => kw.trim());

      if (validKeywords.length > 0) {
        // Use AND conditions so products must match ALL keywords
        const andConditions = [];

        // For each keyword, create search patterns
        validKeywords.forEach((keyword) => {
          const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          andConditions.push({
            $or: [
              { name: { $regex: escapedKeyword, $options: "i" } },
              { description: { $regex: escapedKeyword, $options: "i" } },
              { brand: { $regex: escapedKeyword, $options: "i" } },
              { category: { $regex: escapedKeyword, $options: "i" } },
              { tags: { $elemMatch: { $regex: escapedKeyword, $options: "i" } } },
            ]
          });
        });

        if (andConditions.length > 0) {
          query.$and = andConditions;
        }

        console.log("Search keywords (AND constraint):", validKeywords);
      }
    }

    // Price filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    const products = await ProductModel.find(query)
      .sort({ rating: -1, soldQuantity: -1, createdAt: -1 })
      .limit(15)
      .select(
        "name price images rating category brand description soldQuantity",
      );

    console.log(`Found ${products.length} products for keywords:`, keywords);

    return products || [];
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
      .sort({ rating: -1, soldQuantity: -1 })
      .limit(15)
      .select(
        "name price images rating category brand description soldQuantity",
      );

    return products || [];
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
      .limit(15)
      .select(
        "name price images rating category brand description soldQuantity",
      );

    return products || [];
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
      .sort({ soldQuantity: -1, rating: -1 })
      .limit(15)
      .select(
        "name price images rating category brand description soldQuantity",
      );

    return products || [];
  } catch (error) {
    console.error("Get best sellers error:", error);
    return [];
  }
}

// Generate responses
function generateSearchResponse(products, keywords) {
  if (products.length === 0) {
    return `Xin lỗi, tôi không tìm thấy sản phẩm nào liên quan đến "${keywords.slice(0, 3).join(", ")}". Bạn có thể thử:\n• Kiểm tra lại lỗi chính tả\n• Tìm theo danh mục hoặc thương hiệu\n• Xem sản phẩm mới nhất`;
  }

  const keywordsDisplay = keywords.slice(0, 3).join(", ");
  if (products.length === 1) {
    return `Tôi tìm thấy 1 sản phẩm liên quan đến ${keywordsDisplay}:`;
  }

  return `Tôi tìm thấy ${products.length} sản phẩm liên quan đến ${keywordsDisplay}:`;
}

function generatePriceResponse(products, keywords) {
  if (products.length === 0) {
    return `Xin lỗi, tôi không tìm thấy sản phẩm nào.`;
  }

  const keywordsDisplay = keywords.slice(0, 3).join(", ");
  return `Đây là các sản phẩm liên quan đến ${keywordsDisplay} với thông tin giá:`;
}

function generateRecommendationResponse(products, category) {
  if (products.length === 0) {
    return "Xin lỗi, hiện tại chúng tôi chưa có sản phẩm phù hợp để gợi ý.";
  }

  const categoryText = category ? `thuộc nhóm ${category}` : "";
  return `Dựa trên đánh giá và độ phổ biến, đây là những sản phẩm tốt nhất ${categoryText}:`;
}

// Get chat history - EXPORT
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId là bắt buộc",
      });
    }

    const chatHistory = await chatHistoryModel.findOne({ sessionId });

    if (!chatHistory) {
      return res.json({
        success: true,
        messages: [],
      });
    }

    res.json({
      success: true,
      messages: chatHistory.messages || [],
      metadata: chatHistory.metadata,
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử chat",
    });
  }
};
