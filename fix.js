import fs from 'fs';

const path = 'd:/orebishopping-yt/server/controllers/chatbotController.mjs';
let content = fs.readFileSync(path, 'utf8');

// Replace lines 51-65: greetings and help
const part1 = `      case "greeting":
        response =
          "Xin chào! Tôi là trợ lý mua sắm của bạn. Tôi có thể giúp bạn tìm kiếm sản phẩm phù hợp, tư vấn về mức giá và thương hiệu. Bạn đang tìm sản phẩm nào?";
        break;

      case "help":
        response = \`Tôi có thể giúp bạn:
• Tìm kiếm sản phẩm theo tên, danh mục
• Tư vấn về giá cả và thông tin sản phẩm
• Gợi ý sản phẩm dựa trên nhu cầu
• Xem các sản phẩm mới nhất
• Xem các sản phẩm bán chạy

Hãy thử hỏi tôi: "Áo sơ mi nam" hoặc "Mũ bảo hiểm giá tốt"\`;
        break;`;

content = content.replace(/case "greeting":([\s\S]*?)Hãy thử hỏi tôi[^"]+"[^"]+" hoặc "[^"]+"`;\s*break;/m, part1);

// Replace analyzeIntent
const analyzeIntentRegex = /\/\/ Analyze user intent from message - IMPROVED[\s\S]*?(?=\/\/ Search products - IMPROVED)/;
const newAnalyzeIntent = `// Analyze user intent from message - IMPROVED
function analyzeIntent(message) {
  const intent = {
    type: "search",
    keywords: [],
    filters: {},
    category: null,
  };

  if (/^(xin chào|chào|hello|hi|hey)/i.test(message)) {
    intent.type = "greeting";
    return intent;
  }

  if (/giúp|help|hỗ trợ|hướng dẫn|làm sao|cách|sao/i.test(message)) {
    intent.type = "help";
    return intent;
  }

  if (/mới nhất|new|latest|sản phẩm mới|vừa ra|ra mắt/i.test(message)) {
    intent.type = "latest";
    return intent;
  }

  if (/bán chạy|best seller|hot|phổ biến|chạy nhất|bán nhiều/i.test(message)) {
    intent.type = "bestseller";
    return intent;
  }

  const pricePattern =
    /(\\d+[\\.,]?\\d*)\\s*(triệu|tr|từ|đến|to|-|~|tới|nghìn|k|vnd|đơn|usd)/gi;
  const priceMatches = [...message.matchAll(pricePattern)];

  if (priceMatches.length > 0) {
    const prices = priceMatches.map((match) => {
      let num = parseFloat(match[1].replace(",", "."));
      const unit = match[2].toLowerCase();

      if (/triệu|tr|million/.test(unit)) {
        num *= 1000000;
      } else if (/k|nghìn/.test(unit)) {
        num *= 1000;
      }

      return Math.floor(num);
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
        intent.filters.maxPrice = prices[0];
      }
    }
  }

  if (/gợi ý|recommend|tư vấn|nên|tốt nhất|best choice|suggestion|đề xuất/i.test(message)) {
    intent.type = "recommendation";
  }

  const commonWords = new Set([
     "tìm", "kiếm", "cho", "tôi", "mình", "có", "không", "được", "hay", "của", "và", 
     "với", "về", "trong", "ngoài", "các", "những", "một", "cái", "từ", "đến", "tới", 
     "là", "như", "thế", "nào", "gì", "sao", "hoặc", "nhưng", "mà", "thì", "khi", 
     "nếu", "vì", "giúp", "hỗ trợ", "bao", "nhiêu", "giá", "biết", "hiểu", "cách", 
     "bạn", "ạ", "nhé", "nha", "đó", "đây", "muốn", "xem"
  ]);

  const words = message
    .split(/\\s+/)
    .map((w) => w.replace(/[^\\w\\u00C0-\\u1EF9]/g, "").toLowerCase())
    .filter((word) => word.length > 0 && !commonWords.has(word) && !/^\\d+$/.test(word));

  intent.keywords = [...new Set(words)];

  if (intent.keywords.length === 0) {
    intent.keywords = [message];
  }

  if (priceMatches.length > 0 && intent.keywords.length > 0 && intent.type === "search") {
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

`;

content = content.replace(analyzeIntentRegex, newAnalyzeIntent);

// Replace searchProducts
const searchProductsRegex = /\/\/ Search products - IMPROVED[\s\S]*?(?=\/\/ Get recommendations)/;
const newSearchProducts = `// Search products - IMPROVED
async function searchProducts(keywords, filters = {}) {
  try {
    const query = { isAvailable: true };

    if (keywords.length > 0) {
      const validKeywords = keywords
        .filter((kw) => kw && kw.length > 1)
        .map((kw) => kw.trim());

      if (validKeywords.length > 0) {
        // Use AND conditions so products must match ALL keywords
        const andConditions = [];

        validKeywords.forEach((keyword) => {
          const escapedKeyword = keyword.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&");
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

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    const products = await ProductModel.find(query)
      .sort({ rating: -1, soldQuantity: -1, createdAt: -1 })
      .limit(15)
      .select(
        "name price images rating category brand description soldQuantity"
      );

    console.log(\`Found \${products.length} products for keywords:\`, keywords);

    return products || [];
  } catch (error) {
    console.error("Search products error:", error);
    return [];
  }
}

`;

content = content.replace(searchProductsRegex, newSearchProducts);

// Replace generateResponses
const genResponsesRegex = /\/\/ Generate responses[\s\S]*?(?=\/\/ Get chat history - EXPORT)/;
const newGenResponses = `// Generate responses
function generateSearchResponse(products, keywords) {
  if (products.length === 0) {
    return \`Xin lỗi, tôi không tìm thấy sản phẩm nào liên quan đến "\${keywords.slice(0, 3).join(", ")}". Bạn có thể thử:\\n• Kiểm tra lại lỗi chính tả\\n• Tìm theo danh mục hoặc thương hiệu\\n• Xem sản phẩm mới nhất\`;
  }

  const keywordsDisplay = keywords.slice(0, 3).join(", ");
  if (products.length === 1) {
    return \`Tôi tìm thấy 1 sản phẩm liên quan đến \${keywordsDisplay}:\`;
  }

  return \`Tôi tìm thấy \${products.length} sản phẩm liên quan đến \${keywordsDisplay}:\`;
}

function generatePriceResponse(products, keywords) {
  if (products.length === 0) {
    return \`Xin lỗi, tôi không tìm thấy sản phẩm nào.\`;
  }

  const keywordsDisplay = keywords.slice(0, 3).join(", ");
  return \`Đây là các sản phẩm liên quan đến \${keywordsDisplay} với thông tin mức giá:\`;
}

function generateRecommendationResponse(products, category) {
  if (products.length === 0) {
    return "Xin lỗi, hiện tại chúng tôi chưa có sản phẩm phù hợp để gợi ý.";
  }

  const categoryText = category ? \`thuộc nhóm \${category}\` : "";
  return \`Dựa trên đánh giá và độ phổ biến, đây là những sản phẩm tốt nhất \${categoryText}:\`;
}

`;

content = content.replace(genResponsesRegex, newGenResponses);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated chatbotController.mjs');
