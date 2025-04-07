import express from "express";
import {
  sendInvitation,
  getAllInvitations,
  acceptInvitation,
  rejectInvitation,
  deleteInvitation,
} from "../controllers/invitationController.js";
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();


// 📌 Routes used 
router.post('/send', isAuthenticated, sendInvitation); // Send an invitation

// 📌 Routes un used
router.get("/get", getAllInvitations); // Get all invitations
router.put("/accept/:id", acceptInvitation); // Accept an invitation
router.put("/reject/:id", rejectInvitation); // Reject an invitation
router.delete("/:id", deleteInvitation); // Delete an invitation

export default router;
