import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { notifyNewOrder } from "../services/notificationService.js";

// Create a new order
const createOrder = async (req, res) => {
  try {
    const {
      items,
      amount,
      address,
      paymentMethod,
      shippingMethod,
      shippingFee,
    } = req.body;
    const userId = req.user?.id;

    // Debug: Log the received data
    console.log("Order Creation Debug:");
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Address:", JSON.stringify(address, null, 2));
    console.log("Amount:", amount);
    console.log("Payment Method:", paymentMethod);
    console.log("Shipping Method:", shippingMethod);
    console.log("Shipping Fee:", shippingFee);

    // Validate authentication
    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Order items are required" });
    }

    if (!amount) {
      return res.json({ success: false, message: "Order amount is required" });
    }

    if (!address) {
      return res.json({
        success: false,
        message: "Delivery address is required",
      });
    }

    // Validate address required fields with flexible field mapping
    const getAddressValue = (field) => {
      switch (field) {
        case "firstName":
          return (
            address.firstName ||
            address.first_name ||
            address.name?.split(" ")[0] ||
            ""
          );
        case "lastName":
          return (
            address.lastName ||
            address.last_name ||
            address.name?.split(" ").slice(1).join(" ") ||
            ""
          );
        case "zipcode":
          return (
            address.zipcode ||
            address.zipCode ||
            address.zip_code ||
            address.postal_code ||
            ""
          );
        default:
          return address[field] || "";
      }
    };

    const requiredAddressFields = [
      "firstName",
      "lastName",
      "email",
      "street",
      "city",
      "state",
      "zipcode",
      "country",
      "phone",
    ];

    const missingFields = requiredAddressFields.filter((field) => {
      const value = getAddressValue(field);
      return !value || value.toString().trim() === "";
    });

    if (missingFields.length > 0) {
      console.log("Missing fields details:");
      missingFields.forEach((field) => {
        console.log(`${field}: "${getAddressValue(field)}"`);
      });
      return res.json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(", ")}`,
        debug: {
          receivedAddress: address,
          missingFields: missingFields.map((field) => ({
            field,
            value: getAddressValue(field),
          })),
        },
      });
    }

    // Validate items have productId
    const itemsWithoutProductId = items.filter(
      (item) => !item._id && !item.productId
    );
    if (itemsWithoutProductId.length > 0) {
      return res.json({
        success: false,
        message: "All items must have a valid product ID",
      });
    }

    // Verify user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Validate stock availability for all items before creating order
    const stockCheckErrors = [];
    const stockUpdates = [];

    for (const item of items) {
      const productId = item._id || item.productId;
      const quantity = item.quantity;

      if (!productId || !quantity || quantity <= 0) {
        stockCheckErrors.push(
          `Invalid product or quantity for item: ${item.name}`
        );
        continue;
      }

      const product = await productModel.findById(productId);
      if (!product) {
        stockCheckErrors.push(`Product not found: ${item.name}`);
        continue;
      }

      if (product.stock < quantity) {
        stockCheckErrors.push(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
        );
        continue;
      }

      // Prepare stock update for this product
      stockUpdates.push({
        productId: productId,
        quantity: quantity,
        product: product,
      });
    }

    // If there are stock validation errors, return immediately
    if (stockCheckErrors.length > 0) {
      return res.json({
        success: false,
        message: "Stock validation failed",
        errors: stockCheckErrors,
      });
    }

    // Create new order with properly mapped fields first
    const newOrder = new orderModel({
      userId,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
      })),
      amount,
      address: {
        firstName: getAddressValue("firstName"),
        lastName: getAddressValue("lastName"),
        email: address.email || "",
        street: address.street || address.address || "",
        city: address.city || "",
        state: address.state || address.province || "",
        zipcode: getAddressValue("zipcode"),
        country: address.country || "",
        phone: address.phone || address.phoneNumber || "",
      },
      paymentMethod: paymentMethod || "cod", // Use payment method from request, default to COD
      shippingMethod: shippingMethod || "standard",
      shippingFee: shippingFee || 0,
      status: "pending", // Always pending for new orders
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending", // Pending for all payment methods initially
    });

    // Save order first
    await newOrder.save();

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    // Update stock for all items AFTER order is successfully created
    for (const update of stockUpdates) {
      const { productId, quantity } = update;

      const updatedProduct = await productModel.findByIdAndUpdate(
        productId,
        {
          $inc: {
            stock: -quantity,
            soldQuantity: quantity,
          },
        },
        { new: true }
      );

      // If stock becomes 0, mark as unavailable
      if (updatedProduct && updatedProduct.stock === 0) {
        await productModel.findByIdAndUpdate(productId, {
          isAvailable: false,
        });
      }
    }

    // 🔔 Tạo thông báo đơn hàng mới (async, không chờ)
    notifyNewOrder(newOrder).catch((error) => {
      console.error("Lỗi tạo thông báo đơn hàng:", error);
    });

    res.json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.log("Create Order Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("userId", "name email")
      .populate("items.productId", "name image")
      .sort({ date: -1 });

    res.json({
      success: true,
      orders,
      total: orders.length,
      message: "Orders fetched successfully",
    });
  } catch (error) {
    console.log("Get All Orders Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get orders by user ID
const getUserOrders = async (req, res) => {
  try {
    // Check if it's an admin request with userId param
    const { userId } = req.params;
    const requestUserId = userId || req.user?.id; // Use param for admin, auth user for regular users

    if (!requestUserId) {
      return res.json({
        success: false,
        message: "User ID not provided",
      });
    }

    const orders = await orderModel
      .find({ userId: requestUserId })
      .populate("items.productId", "name image price")
      .sort({ date: -1 });

    res.json({
      success: true,
      orders,
      total: orders.length,
      message: "User orders fetched successfully",
    });
  } catch (error) {
    console.log("Get User Orders Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get single order by user ID and order ID
const getUserOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // From auth middleware

    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .populate("items.productId", "name image price category");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
      message: "Order fetched successfully",
    });
  } catch (error) {
    console.log("Get User Order By ID Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Update order status (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, paymentStatus } = req.body;

    if (!orderId || !status) {
      return res.json({
        success: false,
        message: "Order ID and status are required",
      });
    }
    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        message: "Invalid status",
      });
    }

    const validPaymentStatuses = ["pending", "paid", "failed"];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    order.updatedAt = Date.now();
    await order.save();

    res.json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.log("Update Order Status Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get order statistics (Admin Dashboard)
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const pendingOrders = await orderModel.countDocuments({
      status: "pending",
    });
    const deliveredOrders = await orderModel.countDocuments({
      status: "delivered",
    });

    // Calculate total revenue
    const revenueResult = await orderModel.aggregate([
      { $match: { status: { $in: ["delivered", "shipped", "confirmed"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent orders
    const recentOrders = await orderModel
      .find({})
      .populate("userId", "name email")
      .sort({ date: -1 })
      .limit(10);

    // Monthly orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await orderModel.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue,
        recentOrders,
        monthlyOrders,
      },
      message: "Order statistics fetched successfully",
    });
  } catch (error) {
    console.log("Get Order Stats Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Delete order (Admin)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    await orderModel.findByIdAndDelete(orderId);

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.log("Delete Order Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Send notification when customer views paid order details
const notifyOrderViewed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get order details
    const order = await orderModel
      .findById(orderId)
      .populate("userId", "name email");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify order belongs to user
    if (order.userId._id.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Only send notification if payment is confirmed (paid) and not already notified
    if (order.paymentStatus === "paid" && !order.notificationSent) {
      try {
        await notifyNewOrder(order);

        // Mark notification as sent to avoid duplicates
        order.notificationSent = true;
        await order.save();

        console.log("✅ Order notification sent for order:", order._id);

        return res.json({
          success: true,
          message: "Notification sent successfully",
        });
      } catch (notifyError) {
        console.error("❌ Error sending order notification:", notifyError);
        return res.json({
          success: false,
          message: "Failed to send notification",
        });
      }
    }

    res.json({
      success: true,
      message: "No notification needed",
    });
  } catch (error) {
    console.error("Notify Order Viewed Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new delivery for an order (Admin)
const createDelivery = async (req, res) => {
  try {
    const { orderId, itemIds, trackingCode } = req.body;

    if (!orderId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order ID and a list of item IDs are required.",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Filter items to be included in this delivery
    const itemsForDelivery = order.items.filter((item) =>
      itemIds.includes(item._id.toString())
    );

    // Check if all selected items are valid and not already delivered
    if (itemsForDelivery.length !== itemIds.length) {
      return res.status(400).json({ success: false, message: "Some selected items were not found in the order." });
    }

    const alreadyDeliveredItems = itemsForDelivery.filter(item => item.isDelivered);
    if (alreadyDeliveredItems.length > 0) {
      return res.status(400).json({ success: false, message: "Some selected items have already been delivered." });
    }

    // Create the new delivery object
    const newDelivery = {
      status: "shipped", // Default status for a new delivery
      trackingCode: trackingCode || '',
      createdAt: new Date(),
      items: itemsForDelivery.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        image: item.image,
      })),
    };

    // Add the new delivery to the order's deliveries array
    order.deliveries.push(newDelivery);

    // Mark items as delivered in the main items list
    order.items.forEach(item => {
      if (itemIds.includes(item._id.toString())) {
        item.isDelivered = true;
      }
    });

    // Update the overall order status
    const allItemsDelivered = order.items.every(item => item.isDelivered);
    if (allItemsDelivered) {
      order.status = "delivered";
    } else {
      order.status = "partially-shipped";
    }

    // Mark the modified paths before saving
    order.markModified('items');
    order.markModified('deliveries');

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Delivery created and order updated successfully.",
      order,
    });

  } catch (error) {
    console.error("Create Delivery Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createOrder,
  getAllOrders,
  getUserOrders,
  getUserOrderById,
  updateOrderStatus,
  getOrderStats,
  deleteOrder,
  notifyOrderViewed,
  createDelivery,
};
