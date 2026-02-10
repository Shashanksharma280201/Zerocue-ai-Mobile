/**
 * Fashion AI TypeScript Types
 * Matching AI-Zerocue backend API schemas
 */

// ============================================================================
// OUTFIT ANALYSIS
// ============================================================================

// New backend format (matching OutfitAnalysisResponse)
export interface OutfitItem {
  type: string;
  color: string[];
  pattern: string | null;
  fit: string | null;
  confidence: number;
}

export interface OutfitAnalysisData {
  items: OutfitItem[];
  overall_feedback: string;
  occasion_suitability: { [occasion: string]: number };  // Object, not array
  formality_score: number | null;
  color_palette: string[] | null;
  strengths: string[] | null;
  improvements: string[] | null;
}

export interface RecommendationResponse {
  id: string;
  category: string;
  suggestion_text: string;
  reasoning: string | null;
  product_name?: string;
  product_image_url?: string;
  product_url?: string;
  estimated_price_usd?: number;
  compatibility_score: number | null;
  rank_order: number;
}

export interface OutfitAnalysis {
  analysis_id: string;
  outfit_analysis: OutfitAnalysisData;
  recommendations: RecommendationResponse[];
  image_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

// Legacy types for backward compatibility (can be removed later)
export interface DetectedItem {
  item_type: string;
  color: string;
  brand?: string;
  confidence: number;
}

export interface OccasionSuitability {
  occasion: string;
  suitability_score: number;
  reasoning?: string;
}

export interface StyleFeedback {
  category: string;
  feedback: string;
  positive: boolean;
}

export interface Recommendation {
  id: string;
  category: string;
  suggestion: string;
  reasoning: string;
  product_name?: string;
  product_image_url?: string;
  product_link?: string;
  priority?: number;
}

// ============================================================================
// VIRTUAL TRY-ON
// ============================================================================

export interface VirtualTryonJob {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  estimated_time?: number;
  message?: string;
  result?: {
    tryon_image_url: string;
    confidence_score: number;
    processing_time: number;
  };
  error_message?: string;
  created_at?: string;
  completed_at?: string;
}

// ============================================================================
// SAVED OUTFITS (WARDROBE)
// ============================================================================

export interface SavedOutfit {
  outfit_id: string;
  name: string;
  description?: string;
  image_url: string;
  tryon_image_url?: string;
  analysis_id: string;
  tags?: string[];
  created_at: string;
}

// ============================================================================
// FEEDBACK
// ============================================================================

export interface FeedbackSubmission {
  target_type: 'analysis' | 'recommendation' | 'tryon';
  target_id: string;
  feedback_type: 'positive' | 'negative';
  comment?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface UploadResponse {
  upload_id: string;
  analysis_id: string;
  image_url: string;
  message: string;
}

export interface ApiError {
  error: string;
  detail?: string;
  status_code: number;
}

// ============================================================================
// APP STATE
// ============================================================================

export interface UploadState {
  imageUri: string | null;
  occasion?: string;
  isUploading: boolean;
  progress: number;
}

export interface AnalysisCache {
  [key: string]: {
    data: OutfitAnalysis;
    timestamp: number;
  };
}
