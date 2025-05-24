import projectModel from "../models/ProjectModel.js";
import columnModel from "../models/columnModel.js";
import cardModel from "../models/cardModel.js";

export const createNewProject = async (req, res) => {
  // res.status(201).json({message:'working on it'})
  try {
    console.log(req.body)
    const { projectName, projectWorkspaceId } = req.body;
    const createdProject = await projectModel.create({
      projectName,
      projectWorkspaceId,
      createdBy: req.user._id,
      members: [req.user._id]
    })
    res.status(201).json(createdProject)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}

export const createNewColumn = async (req, res) => {
  // console.log(req.body)
  // return res.status(201).json({message:"sucess full"})
  try {
    const { name, badgeText, color, projectId, } = req.body;
    const createdColumn = await columnModel.create({
      name, color, badgeText,
      projectId,
      createdBy: req.user._id
    });
    res.status(201).json(createdColumn)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}
export const createNewCard = async (req, res) => {
  try {
    // console.log(req.body)
    const { title, description, projectId, columnId, dueDate } = req.body;
    const createdColumn = await cardModel.create({
      title,
      description, dueDate,
      projectId,
      columnId,
      createdBy: req.user._id
    });
    res.status(201).json(createdColumn)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal Server Error" })
  }
}
// List all projects where the user is a member
export const listUserProjects = async (req, res) => {
  try {
    const userId = req.user._id; // assuming user info is stored in req.user by isAuthenticated middleware

    const projects = await projectModel.find({})
      .populate('projectWorkspaceId')
      .populate('columnOrder')
      .populate('members', 'name email') // optionally limit fields
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get a specific project by ID
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await projectModel.findOne({ _id: projectId, members: userId })
      .populate('projectWorkspaceId')
      .populate('columnOrder')
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }
    const projectColums = await columnModel.find({ projectId: projectId })
const cards = await cardModel.find({ projectId: projectId });

const groupedCards = cards.reduce((acc, card) => {
  const colId = card.columnId.toString(); // Convert to string if it's an ObjectId
  if (!acc[colId]) {
    acc[colId] = [];
  }
  acc[colId].push(card);
  return acc;
}, {});
   

    res.status(200).json({ success: true, project, projectColums, groupedCards });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// change task Col
export const changeTaskCol = async (req, res)=>{
  try {
    const {_id, columnId} = req.body;
    await cardModel.findByIdAndUpdate(_id, { $set: { columnId: columnId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error'})
  }
}


// __________________________________ New Code ______________________________________

export const editColumn = async (req, res) => {
  try {
    const { columnId, name, color, badgeText } = req.body;
    const updatedColumn = await columnModel.findByIdAndUpdate(
      columnId,
      { name, color, badgeText },
      { new: true }
    );
    res.status(200).json(updatedColumn);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const editCard = async (req, res) => {
  try {
    const { cardId, title, description, dueDate } = req.body;
    const updatedCard = await cardModel.findByIdAndUpdate(
      cardId,
      { title, description, dueDate },
      { new: true }
    );
    res.status(200).json(updatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
export const addMemberToProject = async (req, res) => {
  try {
    const { projectId, userId } = req.body;
    const updatedProject = await projectModel.findByIdAndUpdate(
      projectId,
      { $addToSet: { members: userId } }, // Use $addToSet to avoid duplicates
      { new: true }
    )
    res.status(200).json(updatedProject);
  }catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const editPorject = async (req, res) =>{
  try {
    const {projectId, projectName} = req.body;
    const updatedProject = await projectModel.findByIdAndUpdate(
      projectId,
      { projectName },
      { new: true }
    )
    res.status(200).json(updatedProject);
  } catch (error) {
      console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
export const deleteColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    await columnModel.findByIdAndDelete(columnId);
    await cardModel.deleteMany({ columnId }); // Delete all cards in the column
    res.status(200).json({ success: true, message: 'Column deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    await cardModel.findByIdAndDelete(cardId);
    res.status(200).json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.body;
  const  del = await projectModel.findByIdAndDelete(projectId);
  console.log(del)
    await columnModel.deleteMany({ projectId }); // Delete all columns in the project
    await cardModel.deleteMany({ projectId }); // Delete all cards in the project
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}