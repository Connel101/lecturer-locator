import { app } from "./app.ts";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
