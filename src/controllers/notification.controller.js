// [FIX 2026-03-29] NEW FILE — Push notification helper using Expo Server SDK
import { Expo } from "expo-server-sdk";
import pool from "../config/db.js";

const expo = new Expo();

// Save a user's Expo push token to the database
export const savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.id;

    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({ success: false, message: "Invalid push token" });
    }

    await pool.query(
      `UPDATE "User" SET "pushToken" = $1 WHERE id = $2`,
      [pushToken, userId]
    );

    res.status(200).json({ success: true, message: "Push token saved" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Save push token error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Send a push notification to a specific user by their user ID
export const sendPushToUser = async (userId, title, body, data = {}) => {
  try {
    const { rows } = await pool.query(
      `SELECT "pushToken" FROM "User" WHERE id = $1`,
      [userId]
    );

    const pushToken = rows[0]?.pushToken;
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
      if (process.env.NODE_ENV === "development") {
        console.log(`No valid push token for user ${userId}, skipping notification`);
      }
      return;
    }

    const messages = [
      {
        to: pushToken,
        sound: "default",
        title,
        body,
        data,
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("Push send error:", err);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("sendPushToUser error:", error.message);
    }
  }
};
