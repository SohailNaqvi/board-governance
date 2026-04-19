import { NextRequest, NextResponse } from "next/server";
import { authenticateAPIKey } from "../../../../../lib/asrb/api-key-auth";
import { getCaseStatus } from "../../../../../lib/asrb/intake-service";
import logger from "../../../../../lib/logger";

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

function createProblemDetail(
  status: number,
  title: string,
  detail: string
): ProblemDetail {
  return {
    type: `https://api.asrb.university.edu/problems/${status}`,
    title,
    status,
    detail,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;

    if (!caseId || typeof caseId !== "string") {
      const problem = createProblemDetail(
        400,
        "Bad Request",
        "Case ID is required"
      );
      return NextResponse.json(problem, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Authenticate
    const authHeader = request.headers.get("Authorization") || "";
    const feederClient = await authenticateAPIKey(authHeader);

    if (!feederClient) {
      logger.warn({}, "Authentication failed for GET status");

      const problem = createProblemDetail(
        401,
        "Unauthorized",
        "Invalid or missing API key"
      );
      return NextResponse.json(problem, {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Get case status
    try {
      const caseStatus = await getCaseStatus(caseId, feederClient.id);
      return NextResponse.json(caseStatus, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { caseId, error },
        "Failed to get case status"
      );

      if (errorMessage.includes("Unauthorized")) {
        const problem = createProblemDetail(
          403,
          "Forbidden",
          "You do not have permission to access this case"
        );
        return NextResponse.json(problem, {
          status: 403,
          headers: { "Content-Type": "application/problem+json" },
        });
      }

      if (errorMessage.includes("Case not found")) {
        const problem = createProblemDetail(
          404,
          "Not Found",
          `Case ${caseId} not found`
        );
        return NextResponse.json(problem, {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        });
      }

      const problem = createProblemDetail(
        500,
        "Internal Server Error",
        errorMessage
      );
      return NextResponse.json(problem, {
        status: 500,
        headers: { "Content-Type": "application/problem+json" },
      });
    }
  } catch (error) {
    logger.error(
      { error },
      "Unhandled error in GET /api/asrb/cases/[id]/status"
    );

    const problem = createProblemDetail(
      500,
      "Internal Server Error",
      "An unexpected error occurred"
    );

    return NextResponse.json(problem, {
      status: 500,
      headers: { "Content-Type": "application/problem+json" },
    });
  }
}
