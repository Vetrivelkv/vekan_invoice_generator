export const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function withBoundedBackoff(operation, options = {}) {
  const {
    attempts = 5,
    initialDelayMs = 500,
    maxDelayMs = 5000,
    factor = 2,
    sleepFn = sleep,
    onRetry = () => {},
  } = options;

  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new TypeError("attempts must be a positive integer");
  }

  let delayMs = Math.max(0, initialDelayMs);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      onRetry(error, attempt, delayMs);
      await sleepFn(delayMs);
      delayMs = Math.min(maxDelayMs, Math.max(delayMs, delayMs * factor));
    }
  }

  throw lastError;
}
