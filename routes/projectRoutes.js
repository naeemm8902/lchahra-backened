import express from "express";
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { createNewProject, createNewColumn, createNewCard, listUserProjects, getProjectById} from "../controllers/projectController.js";

const router = express.Router();

router.post('/add-project', isAuthenticated, createNewProject); 
router.post('/add-column', isAuthenticated, createNewColumn); 
router.post('/add-card', isAuthenticated, createNewCard); 
router.get('/list-project', isAuthenticated, listUserProjects)
router.get('/list-project/:projectId', isAuthenticated, getProjectById)


export default router;