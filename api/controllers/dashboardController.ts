// Update the import path if necessary, for example:
import { User } from "../models/user";
// Or, if your User model is named differently or located elsewhere, adjust accordingly:
// import { User } from "../../models/userModel";
import { storage } from "../../storage";
import { Response, Request } from "express";

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userId = req.user!._id; // use '_id' if that's your identifier
    const user = await User.findOne({ _id: userId }); // adjust field name as per your User model
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }
    const stats = await storage.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
}
