import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./openapi";

export function montarSwagger(app: Application) {
  app.get("/api/docs.json", (_req, res) => {
    res.json(openapi);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, {
      customSiteTitle: "RachaConta API",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        tagsSorter: "alpha",
      },
    }),
  );
}
