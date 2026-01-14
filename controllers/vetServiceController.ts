import { Request, Response } from "express";
import * as VetService from "../models/vetServiceModel";

export const getAllVetsWithServices = async (_req: Request, res: Response) => {
  try {
    const vets = await VetService.getAllVetsWithServices();
    res.status(200).json(vets);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch vets",
      error: (err as Error).message,
    });
  }
};

export const updateMyServices = async (req: any, res: Response) => {
  try {
    const vetId = req.user?.user_id;
    if (!vetId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { services } = req.body;

    if (!Array.isArray(services)) {
      return res.status(400).json({
        message: "Services must be an array of strings",
      });
    }

    services = [...new Set(
      services
        .map((s: any) => String(s).trim())
        .filter((s: string) => s.length > 0)
    )];

    await VetService.replaceVetServices(vetId, services);

    res.status(200).json({
      message: "Services updated successfully",
      services,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update services",
      error: (err as Error).message,
    });
  }
};
