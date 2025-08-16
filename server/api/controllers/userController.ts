
import { User } from "../models/user";
import { Response, Request } from "express";

export async function updateUserRole(req: Request, res: Response) {
  // ...logic from routes.ts for /api/users/:id/role...
  const { id } = req.params;
  const { role } = req.body;

  if (!id || !role) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
  const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

  user.role = role;
  await user.save();
  res.json({ message: "User role updated successfully" });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
}
