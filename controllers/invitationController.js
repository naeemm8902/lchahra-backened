import InvitationToWorkspace from "../models/InvitationToWorkspace.js";
import Workspace from "../models/workspaceModel.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

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
// 📌 Get invitations by user ID (jalal is working on it)
export const getInvitationsByUserId = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming you have user ID from the request
    const invitations = await InvitationToWorkspace.find({ invitedBy: userId }).populate("invitedBy", "name email").populate("invitedWorkspace", "name");
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
    console.log(req.user._id);

    // Get the workspace details to access all members
    const workspace = await Workspace.findById(invitation.invitedWorkspace).populate('members.userId');
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }
    
    // Add the new member to the workspace
    await Workspace.findOneAndUpdate(
      { _id: invitation.invitedWorkspace },
      { $push: { members: {userId: req.user._id, role:"member" }} }
    );
    
    // Update invitation status
    invitation.status = "accepted";
    await invitation.save();

    // Creating chats between the new member and existing members
    const newUserId = req.user._id;
    const workspaceId = invitation.invitedWorkspace;
    const newMemberChats = [];

    // For each existing member, create a private chat with the new member
    const existingMembers = workspace.members.map(member => member.userId);
    const chatCreationPromises = existingMembers.map(async (member) => {
      try {
        // Skip creating a chat with themselves
        if (member._id.toString() === newUserId.toString()) {
          return null;
        }

        // Check if a chat already exists between these users in this workspace
        const existingChat = await Chat.findOne({
          members: { $all: [newUserId, member._id] },
          workspace: workspaceId,
          isGroup: false
        });

        if (existingChat) {
          console.log(`Chat already exists between ${newUserId} and ${member._id}`);
          return existingChat;
        }

        // Create a new chat between the users
        const memberName = member.name || 'Workspace Member';
        const chatData = {
          isGroup: false,
          members: [newUserId, member._id],
          workspace: workspaceId,
          chatname: `Chat with ${memberName}`
        };

        const newChat = await Chat.create(chatData);
        console.log(`Created new chat ${newChat._id} between ${newUserId} and ${member._id}`);

        // Send welcome messages in the chat
        const welcomeMessage = {
          chat: newChat._id,
          sender: newUserId,
          content: `Hello! I've just joined the workspace.`,
          chatname: newChat.chatname || ''
        };

        await Message.create(welcomeMessage);

        // Add response from the other member
        const responseMessage = {
          chat: newChat._id,
          sender: member._id,
          content: `Welcome to the workspace! Feel free to reach out if you need any help.`,
          chatname: newChat.chatname || ''
        };

        await Message.create(responseMessage);

        return newChat;
      } catch (error) {
        console.error(`Error creating chat with member ${member._id}:`, error);
        return null;
      }
    });

    // Wait for all chat creation operations to complete
    const createdChats = await Promise.all(chatCreationPromises);
    const validChats = createdChats.filter(chat => chat !== null);
    
    res.status(200).json({ 
      message: "Invitation accepted. New chats created with workspace members.", 
      invitation, 
      chatsCreated: validChats.length
    });
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

export const getJoinRequest = async (req, res) =>{
  // console.log('hello from join request')
  try {
    const invitations = await InvitationToWorkspace.find({email:req.user.email}).sort({created:-1})
    return res.status(200).json(invitations)
  } catch (error) {
    console.log(error)
    return res.status(500).json({message: " internal server error"})
  }

}