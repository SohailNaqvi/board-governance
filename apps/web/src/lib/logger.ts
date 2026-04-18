// Simple logger for development
const logger = {
  info: (data: Record<string, unknown>, message: string) => {
    console.log(`[INFO] ${message}`, data);
  },
  warn: (data: Record<string, unknown>, message: string) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (data: Record<string, unknown>, message: string) => {
    console.error(`[ERROR] ${message}`, data);
  },
  debug: (data: Record<string, unknown>, message: string) => {
    console.debug(`[DEBUG] ${message}`, data);
  },
};

export default logger;
