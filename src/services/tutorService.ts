/**
 * Tutor Service
 * 
 * This is the legacy service file - now wraps mockTutorService for compatibility.
 * For new implementations, use mockTutorService directly.
 */

import type { TutorRequest, TutorResponse, TutorMode, ChallengeCategory } from "@/types/tutor";
import { mockTutorService } from "./mockTutorService";

// Re-export mockTutorService as the primary interface
export { mockTutorService };

// Legacy interface for backwards compatibility
export const tutorService = {
  async sendMessage(request: TutorRequest): Promise<TutorResponse> {
    return mockTutorService.respond(request);
  },
  
  async getProfile(category: ChallengeCategory) {
    return mockTutorService.getProfile(category);
  },
};

export default tutorService;
