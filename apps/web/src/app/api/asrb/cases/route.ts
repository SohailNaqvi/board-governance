import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { CaseIntakeEnvelopeSchema } from "../../../../lib/asrb/schemas";
import { validateAndAuthenticateRequest } from "../../../../lib/asrb/api-key-auth";
import { submitCase } from "../../../../lib/asrb/intake-service";
import logger from "../../../../lib/logger";

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

function createProblemDetail(
  status: number,
  title: string,
  detail: string,
  errors?: Record<string, string[]>
): ProblemDetail {
  return {
    type: `https://api.asrb.university.edu/problems/${status}`,
    title,
    status,
    detail,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (e) {
      logger.error(
        { error: e },
        "Failed to parse JSON"
      );
      const problem = createProblemDetail(
        400,
        "Invalid Request",
        "Request body must be valid JSON"
      );
      return NextResponse.json(problem, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Validate against schema
    let validatedInput: unknown;
    try {
      validatedInput = CaseIntakeEnvelopeSchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of e.issues) {
          const path = issue.path.join(".");
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }

        logger.warn(
          { errors },
          "Validation error"
        );

        const problem = createProblemDetail(
          422,
          "Unprocessable Entity",
          "Request body validation failed",
          errors
        );

        return NextResponse.json(problem, {
          status: 422,
          headers: { "Content-Type": "application/problem+json" },
        });
      }

      throw e;
    }

    const envelope = validatedInput as any;

    // Authenticate and check permissions
    const authHeader = request.headers.get("Authorization") || "";
    const authResult = await validateAndAuthenticateRequest(
      authHeader,
      envelope.case_type
    );

    if (!authResult.valid) {
      logger.warn(
        { error: authResult.error },
        "Authentication failed"
      );

      if (authResult.error === "Rate limit exceeded") {
        const problem = createProblemDetail(
          429,
          "Too Many Requests",
          authResult.error
        );
        return NextResponse.json(problem, {
          status: 429,
          headers: { "Content-Type": "application/problem+json" },
        });
      }

      if (authResult.error?.includes("not permitted")) {
        const problem = createProblemDetail(
          403,
          "Forbidden",
          authResult.error
        );
        return NextResponse.json(problem, {
          status: 403,
          headers: { "Content-Type": "application/problem+json" },
        });
      }

      const problem = createProblemDetail(
        401,
        "Unauthorized",
        authResult.error || "Authentication failed"
      );
      return NextResponse.json(problem, {
        status: 401,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    if (!authResult.context) {
      const problem = createProblemDetail(
        500,
        "Internal Server Error",
        "Authentication context missing"
      );
      return NextResponse.json(problem, {
        status: 500,
        headers: { "Content-Type": "application/problem+json" },
      });
    }

    // Submit case
    try {
      const result = await submitCase({
        envelope,
        feederClient: authResult.context.feederClient,
      });

      return NextResponse.json(result, {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Location": `/api/asrb/cases/${result.caseId}/status`,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error(
        { error },
        "Case submission failed"
      );

      if (errorMessage.includes("CONFLICT")) {
        const problem = createProblemDetail(
          409,
          "Conflict",
          "A different case already exists with this idempotency key"
        );
        return NextResponse.json(problem, {
          status: 409,
          headers: { "Content-Type": "application/problem+json" },
        });
      }

      if (errorMessage.includes("Reference validation failed")) {
        const problem = createProblemDetail(
          404,
          "Not Found",
          errorMessage
        );
        return NextResponse.json(problem, {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        });
      }

      const problem = createProblemDetail(
        400,
        "Bad Request",
        errorMessage
      );
      return NextResponse.json(problem, {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    }
  } catch (error) {
    logger.error(
      { error },
      "Unhandled error in POST /api/asrb/cases"
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
