import InvitationToWorkspace from "../models/invitationToWorkSpaceModel.js";

// 📌 Send an invitation
export const sendInvitation = async (req, res) => {
  try {
    const { email, invitedBy, invitedWorkspace } = req.body;

    // Check if the invitation already exists
    const existingInvitation = await InvitationToWorkspace.findOne({ email, invitedWorkspace });

    if (existingInvitation) {
      return res.status(400).json({ message: "Invitation already sent." });
    }

    const invitation = new InvitationToWorkspace({
      email,
      invitedBy,
      invitedWorkspace,
    });

    await invitation.save();
    res.status(201).json({ message: "Invitation sent successfully.", invitation });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// 📌 Get all invitations
export const getAllInvitations = async (req, res) => {
  try {
    const invitations = await InvitationToWorkspace.find().populate("invitedBy", "name email").populate("invitedWorkspace", "name");
    res.status(200).json(invitations);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// 📌 Accept an invitation
export const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await InvitationToWorkspace.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    invitation.status = "accepted";
    await invitation.save();
    res.status(200).json({ message: "Invitation accepted.", invitation });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// 📌 Reject an invitation
export const rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await InvitationToWorkspace.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    invitation.status = "rejected";
    await invitation.save();
    res.status(200).json({ message: "Invitation rejected.", invitation });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// 📌 Delete an invitation
export const deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await InvitationToWorkspace.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    await InvitationToWorkspace.findByIdAndDelete(id);
    res.status(200).json({ message: "Invitation deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
