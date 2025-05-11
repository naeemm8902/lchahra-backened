import projectModel from "../models/ProjectModel.js";
import columnModel from "../models/columnModel.js";
import cardModel from "../models/cardModel.js";

export const createNewProject = async (req,res)=>{
    // res.status(201).json({message:'working on it'})
    try {
      console.log(req.body)
        const {projectName,projectWorkspaceId} = req.body;
  const createdProject = await projectModel.create({
            projectName,
            projectWorkspaceId,
            createdBy : req.user._id
        })
        res.status(201).json(createdProject)
    } catch (error) {
      console.log(error)
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const  createNewColumn= async (req,res)=>{
    try {
        const {columnName, projectId} = req.body;
const createdColumn = await columnModel.create({
    columnName,
    projectId,
    createdBy:req.user._id
});
res.status(201).json(createdColumn)
    } catch (error) {
        res.status(500).json({message:"Internal Server Error"})
    }
}
export const  createNewCard= async (req,res)=>{
    try {
        const {title, description,projectId,columnId} = req.body;
const createdColumn = await columnModel.create({
    title, 
    description,
    projectId,
    columnId,
    createdBy:req.user._id
});
res.status(201).json(createdColumn)
    } catch (error) {
        res.status(500).json({message:"Internal Server Error"})
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
  
      res.status(200).json({ success: true, project });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  