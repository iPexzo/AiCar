// Helper for normalization
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // Remove Arabic diacritics
    .replace(/[^\u0000-\u007F\u0600-\u06FF]/g, " ") // Replace non-letter chars with space to preserve word boundaries
    .replace(/\bج\b/g, "") // Remove isolated Arabic letter ج if present
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

export function isRelevantVideo(video: any, stepText: string): boolean {
  if (!video || !video.title || !video.description || !video.url) return false;

  const normalizedStep = normalize(stepText);
  const normalizedTitle = normalize(video.title);
  const normalizedDescription = normalize(video.description);
  const normalizedUrl = normalize(video.url);

  // Debug: log normalized fields
  console.log({
    normalizedStep,
    normalizedTitle,
    normalizedDescription,
    normalizedUrl,
  });

  // Normalize forbidden words
  const forbiddenWords = ["battery", "بطارية", "brake", "فرامل"];
  const normalizedForbiddenWords = forbiddenWords.map(normalize);

  // Forbidden words logic (word boundary, reject only if present in video fields and NOT in stepText)
  const isForbidden = normalizedForbiddenWords.some((word) => {
    if (!word) return false;
    const wordBoundaryRe = new RegExp(`\\b${word}\\b`, "i");
    const forbiddenInTitle = wordBoundaryRe.test(normalizedTitle);
    const forbiddenInDescription = wordBoundaryRe.test(normalizedDescription);
    const forbiddenInUrl = wordBoundaryRe.test(normalizedUrl);
    const forbiddenInVideo =
      forbiddenInTitle || forbiddenInDescription || forbiddenInUrl;
    const allowedInStep = wordBoundaryRe.test(normalizedStep);
    // Debug: log RegExp matches
    console.log({
      word,
      forbiddenInTitle,
      forbiddenInDescription,
      forbiddenInUrl,
      forbiddenInVideo,
      allowedInStep,
    });
    // Accept if allowedInStep is true (even if forbiddenInVideo is true)
    if (forbiddenInVideo && !allowedInStep) {
      console.log(
        `[CarCareKiosk] ⛔ FORBIDDEN: '${video.title}' for step: '${stepText}' (forbidden word: ${word})`
      );
      return true;
    }
    return false;
  });
  if (isForbidden) return false;

  // Relaxed: accept if not forbidden, regardless of keyword overlap
  console.log(
    `[CarCareKiosk] ✅ ACCEPTED: '${video.title}' for step: '${stepText}' (relaxed keyword logic)`
  );
  return true;
}
