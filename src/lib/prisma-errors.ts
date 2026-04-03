import { Prisma } from "@prisma/client";

type ApiErrorDetails = {
  message: string;
  status: number;
};

export function getPrismaApiError(error: unknown, fallbackMessage: string): ApiErrorDetails {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001")
  ) {
    return {
      message:
        "Database connection failed. Make sure PostgreSQL is running and DATABASE_URL points to the correct server.",
      status: 503,
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1000") {
    return {
      message: "Database authentication failed. Check the username and password in DATABASE_URL.",
      status: 503,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 400,
    };
  }

  return {
    message: fallbackMessage,
    status: 400,
  };
}
