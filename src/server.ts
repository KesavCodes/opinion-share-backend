import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import friendRouter from "./routes/friend.route";
import questionRouter from "./routes/question.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/friend", friendRouter);
app.use("/question", questionRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
