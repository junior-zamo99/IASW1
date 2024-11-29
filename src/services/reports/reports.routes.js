import { Router } from "express";
import {reportsController} from "./reports.controller.js";

const routerReports = Router() ; 


routerReports.get('/crearExamen', reportsController.obtenerResultados);
routerReports.post('/entregarNivelDeIngles', reportsController.entregarNivelDeIngles);
routerReports.get('/obtenerRetroalimentacion', reportsController.generarRetroalimentacion);
routerReports.get('/obtenerRetroalimentacionConImagenes', reportsController.generarRetroalimentacionConImagenes);
    routerReports.get('/retroalimentacion/:leccion',  reportsController.generarRetroalimentacionConImagenes2);
export default routerReports ;