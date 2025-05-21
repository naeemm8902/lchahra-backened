import express from "express";
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { createNewProject, createNewColumn, createNewCard, listUserProjects, getProjectById, changeTaskCol} from "../controllers/projectController.js";

const router = express.Router();

router.post('/add-project', isAuthenticated, createNewProject); 
router.post('/add-column', isAuthenticated, createNewColumn); 
router.post('/add-card', isAuthenticated, createNewCard); 
router.get('/list-project', isAuthenticated, listUserProjects)
router.get('/list-project/:projectId', isAuthenticated, getProjectById)
router.post('/change-task-col', isAuthenticated, changeTaskCol)


export default router;