// [FIX 2026-03-29] Booking controller with push notifications on create/accept/reject
import {
  createBooking,
  getBookingsByUserId,
  getBookingsByMassagerId,
  getBookingById,
  updateBookingStatus,
} from "../models/booking.model.js";
import { sendPushToUser } from "./notification.controller.js";

// [FIX 2026-03-29] Create a booking and notify the partner via push notification
export const bookMassager = async (req, res) => {
  try {
    const { massagerId, serviceId, serviceType, date, time } = req.body;
    const userId = req.user.id;

    const booking = await createBooking({
      userId,
      massagerId,
      serviceId: serviceId || null,
      serviceType,
      date,
      time,
    });

    // [FIX 2026-03-29] Send push notification to the partner
    await sendPushToUser(
      massagerId,
      "📋 New Booking Request!",
      `You have a new booking request for ${date} at ${time}`,
      { bookingId: booking.id, type: "new_booking" }
    );

    res.status(201).json({ success: true, message: "Booking created successfully", booking });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Booking error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get bookings for the logged-in user
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await getBookingsByUserId(req.user.id);
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Fetch bookings error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get bookings assigned to the logged-in partner
export const getPartnerBookings = async (req, res) => {
  try {
    const bookings = await getBookingsByMassagerId(req.user.id);
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Fetch partner bookings error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get a specific booking by ID
export const getBooking = async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.userId !== req.user.id && booking.massagerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    res.status(200).json({ success: true, booking });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Fetch booking error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// [FIX 2026-03-29] Update booking status with push notifications to both parties
export const changeBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["accepted", "rejected", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const booking = await getBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Role checks
    if (["accepted", "rejected", "completed"].includes(status) && booking.massagerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the partner can update this status" });
    }
    if (status === "cancelled" && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the booking owner can cancel" });
    }

    const updated = await updateBookingStatus(req.params.id, status);

    // [FIX 2026-03-29] Send push notification to the user about status change
    if (status === "accepted") {
      await sendPushToUser(
        booking.userId,
        "✅ Booking Accepted!",
        `Your booking on ${booking.date} has been accepted.`,
        { bookingId: booking.id, type: "booking_accepted" }
      );
    } else if (status === "rejected") {
      await sendPushToUser(
        booking.userId,
        "❌ Booking Rejected",
        `Your booking on ${booking.date} was rejected.`,
        { bookingId: booking.id, type: "booking_rejected" }
      );
    }

    res.status(200).json({ success: true, message: `Booking ${status}`, booking: updated });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Update booking error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
