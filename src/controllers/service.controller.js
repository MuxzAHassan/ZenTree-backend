// [FIX 2026-03-29] NEW FILE — Service controller: partner manages services, users browse
import {
  createService,
  getServicesByPartnerId,
  getServiceById,
  updateService,
  deleteService,
} from "../models/service.model.js";

// Partner creates a new service
export const addService = async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;
    const partnerId = req.user.id;

    const service = await createService({ partnerId, name, price, duration, description });
    res.status(201).json({ success: true, message: "Service created successfully", service });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Add service error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all services for a specific partner (public-facing)
export const getPartnerServices = async (req, res) => {
  try {
    const services = await getServicesByPartnerId(req.params.partnerId);
    res.status(200).json({ success: true, services });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Get services error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get services for the logged-in partner (their own)
export const getMyServices = async (req, res) => {
  try {
    const services = await getServicesByPartnerId(req.user.id);
    res.status(200).json({ success: true, services });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Get my services error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Partner updates one of their services
export const editService = async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    if (service.partnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only edit your own services" });
    }

    const updated = await updateService(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Service updated", service: updated });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Edit service error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Partner deletes (soft) one of their services
export const removeService = async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }
    if (service.partnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only delete your own services" });
    }

    await deleteService(req.params.id);
    res.status(200).json({ success: true, message: "Service deleted" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Delete service error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
