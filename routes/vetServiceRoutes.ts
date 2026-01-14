import express from "express";
import * as vetServiceController from "../controllers/vetServiceController";
import { auth } from "../middleware/auth";

const vetServiceRouter = express.Router();

// Vet adds/updates their services
vetServiceRouter.put("/my", auth, vetServiceController.updateMyServices);

// Public: get all vets with services
vetServiceRouter.get("/all", vetServiceController.getAllVetsWithServices);

export default vetServiceRouter;
