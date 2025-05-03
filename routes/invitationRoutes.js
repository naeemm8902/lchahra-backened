import express from "express";
import {
  sendInvitation,
  getAllInvitations,
  acceptInvitation,
  rejectInvitation,
  deleteInvitation,
  getJoinRequest
} from "../controllers/invitationController.js";
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();


// 📌 Routes used 
router.post('/send', isAuthenticated, sendInvitation); // Send an invitation
router.get('/get-join-request', isAuthenticated,getJoinRequest )
router.put("/reject/:id",isAuthenticated ,rejectInvitation); // Reject an invitation
router.put("/accept/:id", isAuthenticated,acceptInvitation); // Accept an invitation


// 📌 Routes un used
router.get("/get", getAllInvitations); // Get all invitations
// router.put("/reject/:id", rejectInvitation); // Reject an invitation
// router.delete("/:id", deleteInvitation); // Delete an invitation


export default router;