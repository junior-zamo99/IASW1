import { Router } from "express";
import {reportsController} from "./reports.controller.js";

const routerReports = Router() ; 


routerReports.get('/crearExamen', reportsController.obtenerResultados);
routerReports.get('/entregarNivelDeIngles', reportsController.entregarNivelDeIngles);


export default routerReports ;