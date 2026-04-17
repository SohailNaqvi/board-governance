import { NextResponse } from "next/server";
import logger from "@/lib/logger";

const packageJson = {
  version: "0.1.0",
};

export async function GET(): Promise<NextResponse> {
  try {
    const commitSha =
      process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || "dev";
    const dataProvider = process.env.DATA_PROVIDER || "mock";

    // Check database connectivity
    let dbConnected = true;
    try {
      // TODO: Add actual DB connectivity check when Prisma is set up
      // For now, assume connected in dev
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    const healthData = {
      status: dbConnected ? "healthy" : "degraded",
      version: packageJson.version,
      commitSha,
      dbConnected,
      sourceDataProvider: dataProvider,
      timestamp: new Date().toISOString(),
    };

    logger.info(healthData, "Health check");

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    logger.error({ error }, "Health check error");
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
