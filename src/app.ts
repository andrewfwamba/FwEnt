import express, { Application, Request, Response } from "express";
const app: Application = express();
const port = 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Test Backend");
});

app.listen(port, () => {
  return console.log(`Express server is listening at http://localhost:${port}`);
});
