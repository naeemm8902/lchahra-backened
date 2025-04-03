import express from "express";
import {
  sendInvitation,
  getAllInvitations,
  acceptInvitation,
  rejectInvitation,
  deleteInvitation,
} from "../controllers/invitationController.js";

const router = express.Router();

// 📌 Routes
router.post("/send", sendInvitation); // Send an invitation
router.get("/", getAllInvitations); // Get all invitations
router.put("/accept/:id", acceptInvitation); // Accept an invitation
router.put("/reject/:id", rejectInvitation); // Reject an invitation
router.delete("/:id", deleteInvitation); // Delete an invitation

export default router;
