/** The AI resume screening result, stored as JSON text by the API. */
export type ParsedAiOverview = {
  matchScore: number | null
  strengths: string[]
  weaknesses: string[]
  overallAssessment: string | null
}

export const parseAiOverview = (text: string | null): ParsedAiOverview | null => {
  if (!text) return null
  try {
    const raw = JSON.parse(text) as Record<string, unknown>
    const matchScore = typeof raw.matchScore === "number" ? raw.matchScore : null
    const strengths = Array.isArray(raw.strengths)
      ? raw.strengths.filter((item): item is string => typeof item === "string")
      : []
    const weaknesses = Array.isArray(raw.weaknesses)
      ? raw.weaknesses.filter((item): item is string => typeof item === "string")
      : []
    const overallAssessment =
      typeof raw.overallAssessment === "string" ? raw.overallAssessment : null
    return { matchScore, strengths, weaknesses, overallAssessment }
  } catch {
    return null
  }
}
