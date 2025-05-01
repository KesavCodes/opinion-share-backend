import express, { Request, Response } from "express";
import dotenv from "dotenv";

import userRouter from "./routes/user.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());


app.use("/user", userRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
