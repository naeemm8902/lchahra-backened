import express from "express";
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { createNewProject,
     createNewColumn, 
     createNewCard,
      listUserProjects,
       getProjectById,
        changeTaskCol,
        editColumn,
        editCard,
        addMemberToProject,
        editPorject,
        deleteColumn,
        deleteCard,
        deleteProject
    } from "../controllers/projectController.js";

const router = express.Router();

router.post('/add-project', isAuthenticated, createNewProject); 
router.post('/add-column', isAuthenticated, createNewColumn); 
router.post('/add-card', isAuthenticated, createNewCard); 
router.get('/list-project', isAuthenticated, listUserProjects)
router.get('/list-project/:projectId', isAuthenticated, getProjectById)
router.post('/change-task-col', isAuthenticated, changeTaskCol)
router.post('/delete-project', isAuthenticated, deleteProject);
router.post('/edit-project', isAuthenticated, editPorject);
// new routes that are not integrated yet
router.post('/edit-column', isAuthenticated, editColumn);
router.post('/edit-card', isAuthenticated, editCard);
router.post('/add-member', isAuthenticated, addMemberToProject);
router.post('/delete-column', isAuthenticated, deleteColumn);
router.post('/delete-card', isAuthenticated, deleteCard);



export default router;