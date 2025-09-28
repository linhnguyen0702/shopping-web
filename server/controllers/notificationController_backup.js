import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";

// Lấy danh sách thông báo của user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Query conditions
    const matchConditions = {
      $or: [
        { isGlobal: true }, // Thông báo global cho tất cả admin
        { "recipients.userId": userId }, // Thông báo riêng cho user này
      ],
    };

    // Nếu chỉ lấy thông báo chưa đọc
    if (unreadOnly === "true") {
      matchConditions.$or = [
        {
          isGlobal: true,
          $or: [
            { recipients: { $size: 0 } }, // Global chưa có ai đọc
            {
              recipients: {
                $not: { $elemMatch: { userId: userId, isRead: true } },
              },
            },
          ],
        },
        {
          recipients: {
            $elemMatch: {
              userId: userId,
              isRead: false,
            },
          },
        },
      ];
    }

    const notifications = await notificationModel.aggregate([
      { $match: matchConditions },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $addFields: {
          isRead: {
            $cond: {
              if: { $eq: ["$isGlobal", true] },
              then: {
                $anyElementTrue: {
                  $map: {
                    input: "$recipients",
                    as: "recipient",
                    in: {
                      $and: [
                        { $eq: ["$$recipient.userId", userId] },
                        { $eq: ["$$recipient.isRead", true] },
                      ],
                    },
                  },
                },
              },
              else: {
                $anyElementTrue: {
                  $map: {
                    input: "$recipients",
                    as: "recipient",
                    in: {
                      $and: [
                        { $eq: ["$$recipient.userId", userId] },
                        { $eq: ["$$recipient.isRead", true] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          type: 1,
          title: 1,
          message: 1,
          priority: 1,
          isRead: 1,
          createdAt: 1,
          data: 1,
        },
      },
    ]);

    // Đếm tổng số thông báo chưa đọc
    const unreadCount = await notificationModel.aggregate([
      { $match: matchConditions },
      {
        $addFields: {
          isUnread: {
            $cond: {
              if: { $eq: ["$isGlobal", true] },
              then: {
                $not: {
                  $anyElementTrue: {
                    $map: {
                      input: "$recipients",
                      as: "recipient",
                      in: {
                        $and: [
                          { $eq: ["$$recipient.userId", userId] },
                          { $eq: ["$$recipient.isRead", true] },
                        ],
                      },
                    },
                  },
                },
              },
              else: {
                $anyElementTrue: {
                  $map: {
                    input: "$recipients",
                    as: "recipient",
                    in: {
                      $and: [
                        { $eq: ["$$recipient.userId", userId] },
                        { $eq: ["$$recipient.isRead", false] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      { $match: { isUnread: true } },
      { $count: "count" },
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông báo",
    });
  }
};

// Đánh dấu thông báo đã đọc
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await notificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    // Kiểm tra quyền đọc thông báo
    const canRead =
      notification.isGlobal ||
      notification.recipients.some(
        (r) => r.userId.toString() === userId.toString()
      );

    if (!canRead) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền đọc thông báo này",
      });
    }

    // Cập nhật trạng thái đã đọc
    const existingRecipient = notification.recipients.find(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRecipient) {
      existingRecipient.isRead = true;
      existingRecipient.readAt = new Date();
    } else {
      // Thêm recipient mới (cho trường hợp global notification)
      notification.recipients.push({
        userId: userId,
        isRead: true,
        readAt: new Date(),
      });
    }

    await notification.save();

    res.json({
      success: true,
      message: "Đã đánh dấu thông báo đã đọc",
    });
  } catch (error) {
    console.error("Lỗi đánh dấu đã đọc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đánh dấu đã đọc",
    });
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy tất cả thông báo chưa đọc của user
    const notifications = await notificationModel.find({
      $or: [{ isGlobal: true }, { "recipients.userId": userId }],
    });

    for (const notification of notifications) {
      const existingRecipient = notification.recipients.find(
        (r) => r.userId.toString() === userId.toString()
      );

      if (existingRecipient && !existingRecipient.isRead) {
        existingRecipient.isRead = true;
        existingRecipient.readAt = new Date();
        await notification.save();
      } else if (!existingRecipient && notification.isGlobal) {
        notification.recipients.push({
          userId: userId,
          isRead: true,
          readAt: new Date(),
        });
        await notification.save();
      }
    }

    res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo đã đọc",
    });
  } catch (error) {
    console.error("Lỗi đánh dấu tất cả đã đọc:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đánh dấu tất cả đã đọc",
    });
  }
};

// Tạo thông báo mới (internal function)
export const createNotification = async (notificationData) => {
  try {
    const {
      type,
      title,
      message,
      data = {},
      metadata = {}, // Support cả data và metadata
      recipients = [], // Array of userIds
      priority = "medium",
      isGlobal = false,
      createdBy = null,
    } = notificationData;

    // Validate recipients
    let validRecipients = [];
    if (!isGlobal && recipients.length > 0) {
      const users = await userModel.find({
        _id: { $in: recipients },
        role: "admin", // Chỉ gửi cho admin
      });
      validRecipients = users.map((user) => ({
        userId: user._id,
        isRead: false,
      }));
    }

    const notification = new notificationModel({
      type,
      title,
      message,
      data: Object.keys(data).length > 0 ? data : metadata, // Ưu tiên data, fallback metadata
      metadata: Object.keys(metadata).length > 0 ? metadata : data, // Support cả 2
      recipients: validRecipients,
      priority,
      isGlobal,
      createdBy,
    });

    await notification.save();
    console.log(`📢 Đã tạo thông báo: ${title}`);

    return notification;
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
    throw error;
  }
};
