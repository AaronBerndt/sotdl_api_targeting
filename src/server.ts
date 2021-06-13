import * as express from "express";

const app = express();
const port = 5002;

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

app.get("/", (req, res) => res.status(200).json({ message: "Hello World!" }));
