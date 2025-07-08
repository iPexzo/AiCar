import { Router, Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const router = Router();

interface CarCareKioskSearchRequest {
  searchQuery: string;
  baseURL: string;
}

interface CarCareKioskVideo {
  title: string;
  url: string;
  description: string;
  duration?: string;
  thumbnail?: string;
}

interface CarCareKioskSearchResponse {
  success: boolean;
  videos: CarCareKioskVideo[];
  totalResults: number;
  searchQuery: string;
  error?: string;
}

export function isRelevantVideo(video: any, stepText: string): boolean {
  if (!video || !video.title || !video.description || !video.url) return false;

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "") // Remove Arabic diacritics
      .replace(/[^\u0000-\u007F\u0600-\u06FF\s]/g, "") // Remove symbols except Arabic/ASCII/space
      .replace(/\bج\b/g, "") // Remove isolated Arabic letter ج if present
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();

  const normalizedStep = normalize(stepText);
  const normalizedTitle = normalize(video.title);
  const normalizedDescription = normalize(video.description);
  const normalizedUrl = normalize(video.url);

  // Normalize forbidden words - only truly irrelevant terms
  const forbiddenWords = ["battery", "بطارية"];
  const normalizedForbiddenWords = forbiddenWords.map(normalize);

  // Extract only Arabic keywords (2+ chars)
  const keywords = normalizedStep
    .split(" ")
    .filter((word) => word.length >= 2 && /[\u0600-\u06FF]/.test(word));
  const combined = `${normalizedTitle} ${normalizedDescription}`;

  // Forbidden words logic (exact word boundary only)
  const isForbidden = normalizedForbiddenWords.some((word) => {
    if (!word) return false;

    // Use exact word boundary matching to avoid false positives
    const wordBoundaryRe = new RegExp(
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );

    const forbiddenInVideo =
      wordBoundaryRe.test(normalizedTitle) ||
      wordBoundaryRe.test(normalizedDescription) ||
      wordBoundaryRe.test(normalizedUrl);

    // Check if the forbidden word is part of the search query itself
    const allowedInStep = wordBoundaryRe.test(normalizedStep);

    // Allow the video if the forbidden word is part of the step text
    if (allowedInStep) {
      return false;
    }

    if (forbiddenInVideo && !allowedInStep) {
      console.log(
        `[CarCareKiosk] ⛔ FORBIDDEN: '${video.title}' for step: '${stepText}' (forbidden word: ${word})`
      );
      return true;
    }
    return false;
  });
  if (isForbidden) return false;

  // Fuzzy/partial match: accept if any keyword is in title/desc or any word in title/desc starts with keyword
  const matched = keywords.filter(
    (keyword) =>
      combined.includes(keyword) ||
      combined.split(" ").some((w) => w.startsWith(keyword))
  );
  const isMatch = matched.length > 0;

  if (isMatch) {
    console.log(
      `[CarCareKiosk] ✅ ACCEPTED: '${
        video.title
      }' for step: '${stepText}' (matched: ${matched.join(", ")})`
    );
  } else {
    console.log(
      `[CarCareKiosk] ❌ REJECTED: '${video.title}' for step: '${stepText}' (no relevant keywords)`
    );
  }
  return isMatch;
}

/**
 * Search for car maintenance videos on carcarekiosk.com
 */
router.post("/search", async (req: Request, res: Response) => {
  try {
    const { searchQuery, baseURL }: CarCareKioskSearchRequest = req.body;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
        videos: [],
        totalResults: 0,
        searchQuery: "",
      });
    }

    console.log(`[CarCareKiosk] Searching for: ${searchQuery}`);

    // Fallback queries for common car problems
    const fallbackMap: Record<string, string[]> = {
      brake: [
        "brake repair",
        "brake replacement",
        "brake fix",
        "brake maintenance",
      ],
      battery: ["battery replacement", "battery repair", "car battery"],
      engine: ["engine repair", "engine fix", "engine maintenance"],
      oil: ["oil change", "engine oil", "oil maintenance"],
      coolant: ["coolant leak", "coolant repair", "coolant replacement"],
      radiator: ["radiator repair", "radiator replacement"],
      transmission: ["transmission repair", "transmission replacement"],
      tire: ["tire repair", "tire replacement", "flat tire"],
      light: ["headlight replacement", "taillight replacement", "light repair"],
      air: ["air filter replacement", "air conditioning repair"],
      fan: ["cooling fan repair", "fan replacement"],
    };

    // Typo and synonym map for user queries
    const typoMap: Record<string, string> = {
      break: "brake",
      breaks: "brake",
      battary: "battery",
      engin: "engine",
      oill: "oil",
      engien: "engine",
      battrey: "battery",
      brack: "brake",
      brkae: "brake",
      tir: "tire",
      radiater: "radiator",
      transmision: "transmission",
      headlight: "light",
      taillight: "light",
      coolant: "coolant",
      fan: "fan",
      air: "air",
      // Add more as needed
    };

    // Helper to extract main keyword with typo/synonym support
    function extractMainKeyword(query: string): string | null {
      const lower = query.toLowerCase();
      for (const key of Object.keys(fallbackMap)) {
        if (lower.includes(key)) return key;
      }
      // Check for typos/synonyms
      for (const typo in typoMap) {
        if (lower.includes(typo)) return typoMap[typo];
      }
      return null;
    }

    // Try the original query first, then fallbacks if needed
    const queriesToTry: string[] = [searchQuery];
    const mainKeyword = extractMainKeyword(searchQuery);
    if (mainKeyword) queriesToTry.push(...fallbackMap[mainKeyword]);

    let foundVideos: CarCareKioskVideo[] = [];
    let usedQuery = searchQuery;

    for (const query of queriesToTry) {
      // Construct the search URL
      const searchUrl = `${baseURL}/search?q=${encodeURIComponent(query)}`;
      console.log(`[CarCareKiosk] Trying query: ${query} → ${searchUrl}`);
      // Fetch the search results page
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      // Log the first 500 characters of the HTML for debugging
      console.log(
        `[CarCareKiosk] HTML response (first 500 chars):\n`,
        response.data.slice(0, 500)
      );
      const $ = cheerio.load(response.data);
      const videos: CarCareKioskVideo[] = [];
      $(
        ".video-result, .search-result, .video-item, article, .result-item"
      ).each((index: number, element: any) => {
        try {
          const $element = $(element);
          const title = $element
            .find("h1, h2, h3, .title, .video-title")
            .first()
            .text()
            .trim();
          const url = $element.find("a").first().attr("href");
          const description = $element
            .find(".description, .summary, p")
            .first()
            .text()
            .trim();
          const duration = $element
            .find(".duration, .time")
            .first()
            .text()
            .trim();
          const thumbnail = $element.find("img").first().attr("src");
          if (title && url) {
            const absoluteUrl = url.startsWith("http")
              ? url
              : `${baseURL}${url.startsWith("/") ? "" : "/"}${url}`;
            videos.push({
              title,
              url: absoluteUrl,
              description: description || "فيديو صيانة السيارات",
              duration: duration || undefined,
              thumbnail: thumbnail
                ? thumbnail.startsWith("http")
                  ? thumbnail
                  : `${baseURL}${
                      thumbnail.startsWith("/") ? "" : "/"
                    }${thumbnail}`
                : undefined,
            });
          }
        } catch (error) {
          console.warn(`Error parsing video element ${index}:`, error);
        }
      });
      // Fallback selectors
      if (videos.length === 0) {
        $(
          'a[href*="/video"], a[href*="/maintenance"], a[href*="/repair"]'
        ).each((index: number, element: any) => {
          try {
            const $element = $(element);
            const title = $element.text().trim();
            const url = $element.attr("href");
            if (title && url && title.length > 10) {
              const absoluteUrl = url.startsWith("http")
                ? url
                : `${baseURL}${url.startsWith("/") ? "" : "/"}${url}`;
              videos.push({
                title,
                url: absoluteUrl,
                description: "فيديو صيانة السيارات",
                duration: undefined,
                thumbnail: undefined,
              });
            }
          } catch (error) {
            console.warn(
              `Error parsing alternative video element ${index} (fallback):`,
              error
            );
          }
        });
      }
      // Remove duplicates
      const uniqueVideos = videos.filter(
        (video, index, self) =>
          index === self.findIndex((v) => v.url === video.url)
      );
      // Filter relevant
      const filteredVideos = uniqueVideos.filter((video) =>
        isRelevantVideo(video, query)
      );
      console.log(
        `[CarCareKiosk] Found ${filteredVideos.length} videos for query: ${query}`
      );
      if (filteredVideos.length > 0) {
        foundVideos = filteredVideos;
        usedQuery = query;
        break;
      }
    }

    const responseData: CarCareKioskSearchResponse = {
      success: true,
      videos: foundVideos.slice(0, 10),
      totalResults: foundVideos.length,
      searchQuery: usedQuery,
    };

    res.json(responseData);
    return;
  } catch (error: any) {
    console.error("[CarCareKiosk] Search error:", error);

    const errorMessage =
      error.response?.status === 404
        ? "لم يتم العثور على فيديوهات للبحث المطلوب"
        : "حدث خطأ أثناء البحث عن فيديوهات الصيانة";

    res.status(500).json({
      success: false,
      error: errorMessage,
      videos: [],
      totalResults: 0,
      searchQuery: req.body.searchQuery || "",
    });
    return;
  }
});

/**
 * Get maintenance videos for specific car make/model/year
 */
router.post("/maintenance-videos", async (req: Request, res: Response) => {
  try {
    const {
      make,
      model,
      year,
      maintenanceType,
    }: {
      make: string;
      model: string;
      year: number;
      maintenanceType?: string;
    } = req.body;

    if (!make || !model || !year) {
      return res.status(400).json({
        success: false,
        error: "Car make, model, and year are required",
        videos: [],
      });
    }

    // Construct search queries for different maintenance types
    const searchQueries = [
      `${year} ${make} ${model} air filter replacement`,
      `${year} ${make} ${model} fan check`,
      `${year} ${make} ${model} cooling fan`,
      `${year} ${make} ${model} maintenance`,
      `${year} ${make} ${model} repair`,
    ];

    if (maintenanceType) {
      searchQueries.unshift(`${year} ${make} ${model} ${maintenanceType}`);
    }

    const allVideos: CarCareKioskVideo[] = [];

    // Search for each query
    for (const query of searchQueries.slice(0, 3)) {
      // Limit to top 3 queries to avoid rate limiting
      try {
        const response = await axios.post(
          `${req.protocol}://${req.get("host")}/api/car-care-kiosk/search`,
          {
            searchQuery: query,
            baseURL: "https://carcarekiosk.com",
          }
        );

        if (response.data.success && response.data.videos) {
          allVideos.push(...response.data.videos);
        }

        // Add delay between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`Failed to search for query "${query}":`, error);
      }
    }

    // Remove duplicates and limit results
    const uniqueVideos = allVideos
      .filter(
        (video, index, self) =>
          index === self.findIndex((v) => v.url === video.url)
      )
      .slice(0, 15);

    const filteredVideos = uniqueVideos.filter((video) =>
      isRelevantVideo(video, searchQueries[0])
    );

    res.json({
      success: true,
      videos: filteredVideos,
      totalResults: filteredVideos.length,
      searchQuery: `${year} ${make} ${model}`,
    });
    return;
  } catch (error: any) {
    console.error("[CarCareKiosk] Maintenance videos error:", error);

    res.status(500).json({
      success: false,
      error: "حدث خطأ أثناء البحث عن فيديوهات الصيانة",
      videos: [],
    });
    return;
  }
});

export default router;
