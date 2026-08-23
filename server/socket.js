import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./middleware/auth.js";

export function setupSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No auth token"));
      const payload = jwt.verify(token, JWT_SECRET);
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Every user gets a personal room -- this is what makes delivery
    // instant instead of relying on the client polling the REST API.
    socket.join(`user:${socket.userId}`);

    socket.on("typing", ({ toUserId }) => {
      if (toUserId) socket.to(`user:${toUserId}`).emit("typing", { fromUserId: socket.userId });
    });

    socket.on("disconnect", () => {});
  });

  return io;
}
