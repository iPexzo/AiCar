import axios from "axios";
import { API_CONFIG } from "./config";

export interface CarCareKioskVideo {
  title: string;
  url: string;
  description: string;
  duration?: string;
  thumbnail?: string;
}

export interface CarCareKioskSearchParams {
  make: string;
  model: string;
  year: number;
  maintenanceType?: string; // e.g., "air filter", "fan check", "replacement"
}

export interface CarCareKioskSearchResult {
  videos: CarCareKioskVideo[];
  totalResults: number;
  searchQuery: string;
}

class CarCareKioskAPI {
  private baseURL = "https://carcarekiosk.com";
  private searchEndpoint = "/search";

  /**
   * Search for car maintenance videos on carcarekiosk.com
   */
  async searchVideos(
    params: CarCareKioskSearchParams
  ): Promise<CarCareKioskSearchResult> {
    try {
      const { make, model, year, maintenanceType } = params;

      // Construct search query
      let searchQuery = `${year} ${make} ${model}`;
      if (maintenanceType) {
        searchQuery += ` ${maintenanceType}`;
      }

      // Search for common maintenance procedures
      const maintenanceProcedures = [
        "air filter replacement",
        "fan check",
        "cooling fan",
        "radiator fan",
        "engine fan",
        "replacement",
        "maintenance",
        "repair",
      ];

      const allVideos: CarCareKioskVideo[] = [];

      // Search for each maintenance procedure
      for (const procedure of maintenanceProcedures) {
        try {
          const procedureVideos = await this.searchForProcedure(
            `${searchQuery} ${procedure}`
          );
          allVideos.push(...procedureVideos);
        } catch (error) {
          console.warn(`Failed to search for ${procedure}:`, error);
        }
      }

      // Remove duplicates based on URL
      const uniqueVideos = this.removeDuplicateVideos(allVideos);

      return {
        videos: uniqueVideos.slice(0, 10), // Limit to top 10 results
        totalResults: uniqueVideos.length,
        searchQuery,
      };
    } catch (error) {
      console.error("Error searching CarCareKiosk:", error);
      throw new Error("فشل في البحث عن فيديوهات الصيانة");
    }
  }

  /**
   * Search for a specific maintenance procedure
   */
  private async searchForProcedure(
    searchQuery: string
  ): Promise<CarCareKioskVideo[]> {
    try {
      // Since we can't directly scrape carcarekiosk.com from the frontend,
      // we'll use a proxy approach through our backend
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/car-care-kiosk/search`,
        {
          searchQuery,
          baseURL: this.baseURL,
        },
        {
          timeout: API_CONFIG.timeout,
          headers: API_CONFIG.headers,
        }
      );

      if (response.data && response.data.videos) {
        return response.data.videos;
      }

      return [];
    } catch (error) {
      console.error(`Error searching for procedure "${searchQuery}":`, error);
      return [];
    }
  }

  /**
   * Remove duplicate videos based on URL
   */
  private removeDuplicateVideos(
    videos: CarCareKioskVideo[]
  ): CarCareKioskVideo[] {
    const seen = new Set<string>();
    return videos.filter((video) => {
      if (seen.has(video.url)) {
        return false;
      }
      seen.add(video.url);
      return true;
    });
  }

  /**
   * Get specific maintenance videos for common procedures
   */
  async getMaintenanceVideos(params: CarCareKioskSearchParams): Promise<{
    airFilter?: CarCareKioskVideo[];
    fanCheck?: CarCareKioskVideo[];
    general?: CarCareKioskVideo[];
  }> {
    const { make, model, year } = params;

    try {
      const [airFilterResults, fanCheckResults, generalResults] =
        await Promise.allSettled([
          this.searchVideos({
            ...params,
            maintenanceType: "air filter replacement",
          }),
          this.searchVideos({
            ...params,
            maintenanceType: "fan check cooling",
          }),
          this.searchVideos({
            ...params,
            maintenanceType: "maintenance repair",
          }),
        ]);

      return {
        airFilter:
          airFilterResults.status === "fulfilled"
            ? airFilterResults.value.videos
            : undefined,
        fanCheck:
          fanCheckResults.status === "fulfilled"
            ? fanCheckResults.value.videos
            : undefined,
        general:
          generalResults.status === "fulfilled"
            ? generalResults.value.videos
            : undefined,
      };
    } catch (error) {
      console.error("Error getting maintenance videos:", error);
      return {};
    }
  }
}

export const carCareKioskAPI = new CarCareKioskAPI();
export default carCareKioskAPI;
