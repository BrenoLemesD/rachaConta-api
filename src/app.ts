import cors from "cors";
import express from "express";
import helmet from "helmet";
import { montarSwagger } from "./docs/swagger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { routes } from "./routes";

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    data: {
      nome: "RachaConta API",
      versao: "1.0.0",
      saude: "/api/health",
      docs: "/api/docs",
    },
  });
});

montarSwagger(app);
app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({ erro: { mensagem: "Rota não encontrada" } });
});

app.use(errorMiddleware);
