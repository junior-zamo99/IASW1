import { Router } from "express";
import routerReports from "../services/reports/reports.routes.js";

const router = Router(); 
router.use('/duoPro', routerReports); 

export default router ;


