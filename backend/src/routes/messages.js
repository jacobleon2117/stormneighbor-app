const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { auth } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const { pool } = require("../config/database");
const logger = require("../utils/logger");

router.get(
  "/conversations",
  auth,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const result = await client.query(
        `
        SELECT 
          c.id as conversation_id,
          c.last_message_at,
          c.participant_1_unread_count,
          c.participant_2_unread_count,
          -- Other participant info
          CASE 
            WHEN c.participant_1_id = $1 THEN u2.id
            ELSE u1.id
          END as other_user_id,
          CASE 
            WHEN c.participant_1_id = $1 THEN u2.first_name
            ELSE u1.first_name
          END as other_user_first_name,
          CASE 
            WHEN c.participant_1_id = $1 THEN u2.last_name
            ELSE u1.last_name
          END as other_user_last_name,
          CASE 
            WHEN c.participant_1_id = $1 THEN u2.profile_image_url
            ELSE u1.profile_image_url
          END as other_user_profile_image,
          -- Last message info
          m.content as last_message_content,
          m.sender_id as last_message_sender_id,
          m.message_type as last_message_type,
          m.created_at as last_message_created_at,
          -- Unread count for current user
          CASE 
            WHEN c.participant_1_id = $1 THEN c.participant_1_unread_count
            ELSE c.participant_2_unread_count
          END as unread_count
        FROM conversations c
        JOIN users u1 ON c.participant_1_id = u1.id
        JOIN users u2 ON c.participant_2_id = u2.id
        LEFT JOIN messages m ON c.last_message_id = m.id
        WHERE (c.participant_1_id = $1 OR c.participant_2_id = $1) 
          AND c.is_active = true
          AND u1.is_active = true 
          AND u2.is_active = true
        ORDER BY c.last_message_at DESC
        LIMIT $2 OFFSET $3
      `,
        [userId, limit, offset]
      );

      const conversations = result.rows.map((row) => ({
        id: row.conversation_id,
        lastMessageAt: row.last_message_at,
        unreadCount: parseInt(row.unread_count) || 0,
        otherUser: {
          id: row.other_user_id,
          firstName: row.other_user_first_name,
          lastName: row.other_user_last_name,
          profileImageUrl: row.other_user_profile_image,
        },
        lastMessage: row.last_message_content
          ? {
              content: row.last_message_content,
              senderId: row.last_message_sender_id,
              messageType: row.last_message_type,
              createdAt: row.last_message_created_at,
            }
          : null,
      }));

      const countResult = await client.query(
        `
        SELECT COUNT(*) as total
        FROM conversations c
        JOIN users u1 ON c.participant_1_id = u1.id
        JOIN users u2 ON c.participant_2_id = u2.id
        WHERE (c.participant_1_id = $1 OR c.participant_2_id = $1) 
          AND c.is_active = true
          AND u1.is_active = true 
          AND u2.is_active = true
      `,
        [userId]
      );

      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error("Get conversations error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching conversations",
        code: "CONVERSATIONS_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/conversations",
  auth,
  [
    body("recipientId").isInt({ min: 1 }).withMessage("Valid recipient ID is required"),
    body("initialMessage")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Initial message is required and must be under 1000 characters"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const senderId = req.user.userId;
      const { recipientId, initialMessage } = req.body;

      if (senderId === recipientId) {
        return res.status(400).json({
          success: false,
          message: "Cannot create conversation with yourself",
          code: "SELF_CONVERSATION_ERROR",
        });
      }

      const recipientCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND is_active = true",
        [recipientId]
      );

      if (recipientCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Recipient not found",
          code: "RECIPIENT_NOT_FOUND",
        });
      }

      await client.query("BEGIN");

      const participant1 = Math.min(senderId, recipientId);
      const participant2 = Math.max(senderId, recipientId);

      const conversationResult = await client.query(
        `
        SELECT id FROM conversations 
        WHERE participant_1_id = $1 AND participant_2_id = $2
      `,
        [participant1, participant2]
      );

      let conversationId;

      if (conversationResult.rows.length === 0) {
        const newConversationResult = await client.query(
          `
          INSERT INTO conversations (participant_1_id, participant_2_id)
          VALUES ($1, $2)
          RETURNING id
        `,
          [participant1, participant2]
        );
        conversationId = newConversationResult.rows[0].id;
      } else {
        conversationId = conversationResult.rows[0].id;
      }

      const messageResult = await client.query(
        `
        INSERT INTO messages (conversation_id, sender_id, recipient_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
        [conversationId, senderId, recipientId, initialMessage]
      );

      const message = messageResult.rows[0];

      const recipientInfo = await client.query(
        "SELECT first_name, last_name, profile_image_url FROM users WHERE id = $1",
        [recipientId]
      );

      try {
        const senderInfo = await client.query(
          "SELECT first_name, last_name FROM users WHERE id = $1",
          [senderId]
        );

        const senderName = `${senderInfo.rows[0].first_name} ${senderInfo.rows[0].last_name}`;

        await client.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id, related_conversation_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            recipientId,
            "New Message",
            `${senderName}: ${initialMessage.substring(0, 50)}${initialMessage.length > 50 ? "..." : ""}`,
            "new_message",
            senderId,
            conversationId,
          ]
        );
      } catch (notificationError) {
        logger.warn("Failed to create message notification:", notificationError);
      }

      await client.query("COMMIT");

      const recipient = recipientInfo.rows[0];

      res.status(201).json({
        success: true,
        message: "Conversation created successfully",
        data: {
          conversationId,
          message: {
            id: message.id,
            content: message.content,
            senderId: message.sender_id,
            recipientId: message.recipient_id,
            messageType: message.message_type,
            createdAt: message.created_at,
          },
          otherUser: {
            id: recipientId,
            firstName: recipient.first_name,
            lastName: recipient.last_name,
            profileImageUrl: recipient.profile_image_url,
          },
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Create conversation error:", error);

      if (error.code === "23505") {
        res.status(409).json({
          success: false,
          message: "Conversation already exists",
          code: "CONVERSATION_EXISTS",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Error creating conversation",
          code: "CONVERSATION_CREATE_ERROR",
        });
      }
    } finally {
      client.release();
    }
  }
);

router.get(
  "/conversations/:conversationId/messages",
  auth,
  [
    param("conversationId").isInt({ min: 1 }).withMessage("Valid conversation ID is required"),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const userId = req.user.userId;
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const conversationCheck = await client.query(
        `
        SELECT id FROM conversations 
        WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)
      `,
        [conversationId, userId]
      );

      if (conversationCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or access denied",
          code: "CONVERSATION_NOT_FOUND",
        });
      }

      const result = await client.query(
        `
        SELECT 
          m.id,
          m.content,
          m.sender_id,
          m.recipient_id,
          m.message_type,
          m.images,
          m.is_read,
          m.read_at,
          m.is_edited,
          m.edited_at,
          m.created_at,
          u.first_name as sender_first_name,
          u.last_name as sender_last_name,
          u.profile_image_url as sender_profile_image
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [conversationId, limit, offset]
      );

      const messages = result.rows.map((row) => ({
        id: row.id,
        content: row.content,
        senderId: row.sender_id,
        recipientId: row.recipient_id,
        messageType: row.message_type,
        images: row.images || [],
        isRead: row.is_read,
        readAt: row.read_at,
        isEdited: row.is_edited,
        editedAt: row.edited_at,
        createdAt: row.created_at,
        sender: {
          id: row.sender_id,
          firstName: row.sender_first_name,
          lastName: row.sender_last_name,
          profileImageUrl: row.sender_profile_image,
        },
      }));

      await client.query(
        `
        UPDATE messages 
        SET is_read = true, read_at = NOW() 
        WHERE conversation_id = $1 AND recipient_id = $2 AND is_read = false
      `,
        [conversationId, userId]
      );

      const countResult = await client.query(
        "SELECT COUNT(*) as total FROM messages WHERE conversation_id = $1",
        [conversationId]
      );

      const total = parseInt(countResult.rows[0].total);

      res.json({
        success: true,
        data: {
          messages: messages.reverse(),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error("Get messages error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching messages",
        code: "MESSAGES_FETCH_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.post(
  "/conversations/:conversationId/messages",
  auth,
  [
    param("conversationId").isInt({ min: 1 }).withMessage("Valid conversation ID is required"),
    body("content")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message content is required and must be under 1000 characters"),
    body("messageType").optional().isIn(["text", "image"]).withMessage("Invalid message type"),
    body("images").optional().isArray().withMessage("Images must be an array"),
  ],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const senderId = req.user.userId;
      const { conversationId } = req.params;
      const { content, messageType = "text", images = [] } = req.body;

      const conversationResult = await client.query(
        `
        SELECT participant_1_id, participant_2_id FROM conversations 
        WHERE id = $1 AND (participant_1_id = $2 OR participant_2_id = $2)
      `,
        [conversationId, senderId]
      );

      if (conversationResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found or access denied",
          code: "CONVERSATION_NOT_FOUND",
        });
      }

      const conversation = conversationResult.rows[0];
      const recipientId =
        conversation.participant_1_id === senderId
          ? conversation.participant_2_id
          : conversation.participant_1_id;

      const messageResult = await client.query(
        `
        INSERT INTO messages (conversation_id, sender_id, recipient_id, content, message_type, images)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [conversationId, senderId, recipientId, content, messageType, images]
      );

      const message = messageResult.rows[0];

      try {
        const senderInfo = await client.query(
          "SELECT first_name, last_name FROM users WHERE id = $1",
          [senderId]
        );

        const senderName = `${senderInfo.rows[0].first_name} ${senderInfo.rows[0].last_name}`;

        await client.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, related_user_id, related_conversation_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            recipientId,
            "New Message",
            `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
            "new_message",
            senderId,
            parseInt(conversationId),
          ]
        );
      } catch (notificationError) {
        logger.warn("Failed to create message notification:", notificationError);
      }

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: {
          message: {
            id: message.id,
            content: message.content,
            senderId: message.sender_id,
            recipientId: message.recipient_id,
            messageType: message.message_type,
            images: message.images || [],
            isRead: message.is_read,
            createdAt: message.created_at,
          },
        },
      });
    } catch (error) {
      logger.error("Send message error:", error);
      res.status(500).json({
        success: false,
        message: "Error sending message",
        code: "MESSAGE_SEND_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.put(
  "/messages/:messageId/read",
  auth,
  [param("messageId").isInt({ min: 1 }).withMessage("Valid message ID is required")],
  handleValidationErrors,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const userId = req.user.userId;
      const { messageId } = req.params;

      const result = await client.query(
        `
        UPDATE messages 
        SET is_read = true, read_at = NOW()
        WHERE id = $1 AND recipient_id = $2 AND is_read = false
        RETURNING *
      `,
        [messageId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Message not found or already read",
          code: "MESSAGE_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        message: "Message marked as read",
        data: {
          messageId: parseInt(messageId),
          readAt: result.rows[0].read_at,
        },
      });
    } catch (error) {
      logger.error("Mark message as read error:", error);
      res.status(500).json({
        success: false,
        message: "Error marking message as read",
        code: "MESSAGE_READ_ERROR",
      });
    } finally {
      client.release();
    }
  }
);

router.get("/unread-count", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.userId;

    const result = await client.query(
      `
        SELECT 
          SUM(CASE 
            WHEN c.participant_1_id = $1 THEN c.participant_1_unread_count
            ELSE c.participant_2_unread_count
          END) as total_unread
        FROM conversations c
        WHERE (c.participant_1_id = $1 OR c.participant_2_id = $1) 
          AND c.is_active = true
      `,
      [userId]
    );

    const totalUnread = parseInt(result.rows[0].total_unread) || 0;

    res.json({
      success: true,
      data: {
        totalUnread,
        userId,
      },
    });
  } catch (error) {
    logger.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      code: "UNREAD_COUNT_ERROR",
    });
  } finally {
    client.release();
  }
});

router.get("/test/status", async (_req, res) => {
  try {
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          COUNT(DISTINCT c.id) as total_conversations,
          COUNT(m.id) as total_messages
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
      `);

      res.json({
        success: true,
        message: "Messages routes are working!",
        data: {
          ...result.rows[0],
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Messages test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Messages routes test failed",
      error: error.message,
    });
  }
});

module.exports = router;
