import InvitationToWorkspace from "../models/InvitationToWorkspace.js";

// 📌 Send an invitation 
// export const sendInvitation = async (req, res) => {
//   try {
//     const { emails, invitedWorkspace } = req.body;
//     const invitedBy = req.user._id;



//     // Check if the invitation already exists
//     const existingInvitation = await InvitationToWorkspace.findOne({
//       emails,
//       invitedWorkspace,
//     });

//     if (existingInvitation) {
//       return res.status(400).json({ message: 'Invitation already sent.' });
//     }

//     const invitation = new InvitationToWorkspace({
//       emails,
//       invitedBy,
//       invitedWorkspace,
//     });

//     await invitation.save();
//     res.status(201).json({ message: "Invitation sent successfully.", invitation });
//   } catch (error) {
//     res.status(500).json({ message: "Server error.", error: error.message });
//   }
// };
// 📌 Send invitations to multiple users
// 📌 Send invitations to multiple users
export const sendInvitation = async (req, res) => {
  try {
    const { emails, invitedWorkspace } = req.body;
    const invitedBy = req.user._id;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'No emails provided.' });
    }

    const results = [];

    // 🔁 Loop through each email to process individually
    for (const email of emails) {
      // 🔎 Check if invitation for this email + workspace already exists
      const existingInvitation = await InvitationToWorkspace.findOne({
        email: email.toLowerCase(),
        invitedWorkspace,
      });

      // ⛔ Skip if already invited
      if (existingInvitation) {
        results.push({ email, status: 'already_invited' });
        continue;
      }

      // ✅ Create new invitation document
      const newInvitation = new InvitationToWorkspace({
        email: email.toLowerCase(),
        invitedBy,
        invitedWorkspace,
      });

      // 💾 Save to DB
      await newInvitation.save();

      // sending email link
      // await sendInvitationEmail(email, invitedByUser.name, workspace.name);

      // ✅ Add success result
      results.push({ email, status: 'invited' });
    }

    // 📤 Send final response with invitation results
    res.status(201).json({
      message: 'Invitations processed.',
      results,
    });
  } catch (error) {
    // ⚠️ Handle any server errors
    console.error('Invitation error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
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
