import { NextFunction, Request, Response } from "express";

type Controlador = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(controlador: Controlador) {
  return (req: Request, res: Response, next: NextFunction) => {
    controlador(req, res, next).catch(next);
  };
}
