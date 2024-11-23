import { check } from "express-validator";
import {validateResult} from "../helpers/validateHelper.js"
export const validateCreate=[
  check('ci').exists().not().isEmpty(),
  check('nombre').exists().not().isEmpty(),
  check('fechaDeNacimiento').exists().not().isEmpty(),
  check('telefono').exists().not().isEmpty().isNumeric(),
  check('correo').exists().isEmail().withMessage("Error correo no valido"),
  check('sexo').exists().not().isEmpty(),
  check('contraseña').exists().not().isEmpty(),
  (req,res,next)=>{
    validateResult(req,res,next)
  }

]
