import Stripe from "stripe";
import { Client, Environment } from "@paypal/paypal-server-sdk";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize PayPal SDK
const environment =
  process.env.NODE_ENV === "production"
    ? Environment.Live
    : Environment.Sandbox;

const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  environment: environment,
});

// Create payment intent for Stripe
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === "paid") {
      return res.json({ success: false, message: "Order is already paid" });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: userId,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Create Payment Intent Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Confirm payment and update order status
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    const userId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update order payment status
      const order = await orderModel.findById(orderId);
      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }

      // Verify order belongs to user
      if (order.userId.toString() !== userId) {
        return res.json({
          success: false,
          message: "Unauthorized access to order",
        });
      }

      order.paymentStatus = "paid";
      order.paymentMethod = "stripe";
      order.status = "confirmed";
      await order.save();

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        order: order,
      });
    } else {
      res.json({
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Handle Stripe webhook for payment updates
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      // Update order status
      await orderModel.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        status: "confirmed",
      });
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      const failedOrderId = failedPayment.metadata.orderId;

      // Update order status
      await orderModel.findByIdAndUpdate(failedOrderId, {
        paymentStatus: "failed",
      });
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Create order with payment method selection
export const createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod = "cod" } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Order items are required" });
    }

    if (!address) {
      return res.json({
        success: false,
        message: "Delivery address is required",
      });
    }

    // Validate address required fields
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
      const value =
        address[field] || address[field === "zipcode" ? "zipCode" : field];
      return !value || value.trim() === "";
    });

    if (missingFields.length > 0) {
      return res.json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(", ")}`,
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

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Create order
    const order = new orderModel({
      userId,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
      })),
      amount: totalAmount,
      address: {
        firstName: address.firstName || address.name?.split(" ")[0] || "",
        lastName:
          address.lastName || address.name?.split(" ").slice(1).join(" ") || "",
        email: address.email || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipcode: address.zipcode || address.zipCode || "",
        country: address.country || "",
        phone: address.phone || "",
      },
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      status: "pending",
    });

    await order.save();

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: order._id },
    });

    res.json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
      order: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Create Stripe Checkout Session
export const createStripeSession = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Order #${orderId}`,
              description: `Payment for order containing ${order.items.length} items`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/${orderId}`,
      metadata: {
        orderId: orderId,
        userId: userId,
      },
    });

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Create Stripe Session Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Create PayPal Order
export const createPayPalOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Create PayPal order using new SDK
    const request = {
      body: {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: "USD",
              value: amount.toString(),
            },
            description: `Payment for order #${orderId}`,
          },
        ],
        application_context: {
          return_url: `${process.env.CLIENT_URL}/payment-success?order_id=${orderId}&payment_method=paypal`,
          cancel_url: `${process.env.CLIENT_URL}/checkout/${orderId}`,
          brand_name: "Orebi Shopping",
          landing_page: "BILLING",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
        },
      },
    };

    const { body: paypalOrder } = await paypalClient.orders.ordersCreate(
      request
    );
    const approvalUrl = paypalOrder.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.json({
      success: true,
      approvalUrl: approvalUrl,
      paypalOrderId: paypalOrder.id,
    });
  } catch (error) {
    console.error("Create PayPal Order Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Handle Stripe Success
export const handleStripeSuccess = async (req, res) => {
  try {
    const { session_id, order_id } = req.query;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Update order
      const order = await orderModel.findById(order_id);
      if (order) {
        order.paymentStatus = "paid";
        order.paymentMethod = "stripe";
        order.status = "confirmed";
        order.stripeSessionId = session_id;
        await order.save();

        res.json({
          success: true,
          message: "Payment successful",
          order: order,
        });
      } else {
        res.json({ success: false, message: "Order not found" });
      }
    } else {
      res.json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Handle Stripe Success Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Handle PayPal Success
export const handlePayPalSuccess = async (req, res) => {
  try {
    const { paypal_order_id, order_id } = req.body;

    // Capture PayPal payment using new SDK
    const request = {
      id: paypal_order_id,
      body: {},
    };

    const { body: capture } = await paypalClient.orders.ordersCapture(request);

    if (capture.status === "COMPLETED") {
      // Update order
      const order = await orderModel.findById(order_id);
      if (order) {
        order.paymentStatus = "paid";
        order.paymentMethod = "paypal";
        order.status = "confirmed";
        order.paypalOrderId = paypal_order_id;
        await order.save();

        res.json({
          success: true,
          message: "Payment successful",
          order: order,
        });
      } else {
        res.json({ success: false, message: "Order not found" });
      }
    } else {
      res.json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Handle PayPal Success Error:", error);
    res.json({ success: false, message: error.message });
  }
};
