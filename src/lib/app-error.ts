export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public detalhes?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
