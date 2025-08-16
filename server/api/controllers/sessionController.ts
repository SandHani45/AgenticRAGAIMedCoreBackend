import { Response , Request} from "express";
import { User } from "../models/user";

export async function getActiveSessions(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user!._id;
    const user = await User.findOne({ _id: userId });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json({});
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    res.status(500).json({ message: "Failed to fetch active sessions" });
  }
}
