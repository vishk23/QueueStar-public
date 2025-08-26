import OpenAI from 'openai';
import { AppleTrack, getUserMusicProfile } from './track-collection';

/**
 * Parse JSON from LLM response, handling markdown code blocks
 */
const parseJSONFromResponse = (content: string): any => {
  // Remove markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonString = jsonMatch ? jsonMatch[1] : content;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse LLM JSON response:', jsonString);
    return [];
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BlendGenerationResult {
  tracks: AppleTrack[];
  reasoning: string;
  totalTokens: number;
}

/**
 * Generate a 55-track blend using GPT-5 with round-robin + LLM optimization
 */
export const generateBlendWithLLM = async (
  participantUserIds: string[],
  blendName: string,
  targetLength: number = 55
): Promise<BlendGenerationResult> => {
  
  // Step 1: Collect user profiles and candidate tracks
  console.log('Collecting user music profiles...');
  const userProfiles = await Promise.all(
    participantUserIds.map(userId => getUserMusicProfile(userId))
  );
  
  // Step 2: Detect composite blend mood and strategy
  const blendStrategy = await createBlendStrategy(userProfiles, blendName, targetLength);
  
  // Step 3: Generate tracks in batches using round-robin + LLM optimization
  const selectedTracks = await selectTracksInBatches(userProfiles, blendStrategy, targetLength);
  
  return {
    tracks: selectedTracks,
    reasoning: blendStrategy.reasoning,
    totalTokens: blendStrategy.totalTokens + selectedTracks.length * 50 // Rough estimate
  };
};

/**
 * Create high-level blend strategy with GPT-5
 */
const createBlendStrategy = async (userProfiles: any[], blendName: string, targetLength: number) => {
  const strategyPrompt = `
You are an expert music curator creating a ${targetLength}-track playlist called "${blendName}".

PARTICIPANTS:
${userProfiles.map(p => `
User ${p.userId.slice(0, 8)}:
- Top genres: ${p.topGenres.join(', ')}
- Audio signature: ${p.audioSignature.energy}% energy, ${p.audioSignature.valence}% positivity, ${p.audioSignature.danceability}% danceability
- Avg tempo: ${p.audioSignature.tempo} BPM
- Available tracks: ${p.trackCount}
`).join('\n')}

TASK: Create a cohesive blend strategy

Consider:
1. What's the overall mood/vibe that represents this group?
2. How should energy progress through the playlist? (intro → build → peak → outro)
3. What's the genre mixing approach? (interweave vs sections vs transitions)
4. How many tracks should each user contribute? (${Math.floor(targetLength / userProfiles.length)} each roughly)

Response format:
{
  "overallMood": "energetic-indie-electronic",
  "energyProgression": ["mellow-intro", "building", "peak-energy", "sustained-high", "gentle-outro"],
  "genreMixingStyle": "smooth-transitions",
  "tracksPerUser": [${userProfiles.map(p => Math.floor(targetLength / userProfiles.length)).join(', ')}],
  "reasoning": "This group loves energetic indie with electronic elements..."
}

Return only valid JSON.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // Using GPT-4o for now, will upgrade to GPT-5 when available
    messages: [{ role: "user", content: strategyPrompt }],
    temperature: 0.7,
    max_tokens: 1000
  });

  const content = response.choices[0].message.content;
  let strategy;
  
  try {
    strategy = parseJSONFromResponse(content || '{}');
  } catch (e) {
    // Fallback strategy if JSON parsing fails
    strategy = {
      overallMood: "balanced-mix",
      energyProgression: Array(5).fill("moderate-energy"),
      genreMixingStyle: "round-robin",
      tracksPerUser: userProfiles.map(() => Math.floor(targetLength / userProfiles.length)),
      reasoning: "Fallback strategy due to parsing error"
    };
  }

  return {
    ...strategy,
    totalTokens: response.usage?.total_tokens || 0
  };
};

/**
 * Select tracks in batches using round-robin structure with LLM optimization
 */
const selectTracksInBatches = async (
  userProfiles: any[], 
  strategy: any, 
  targetLength: number
): Promise<AppleTrack[]> => {
  
  const selectedTracks: AppleTrack[] = [];
  const batchSize = 8; // Process 8 tracks at a time (2-3 per user)
  const totalBatches = Math.ceil(targetLength / batchSize);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    const tracksNeeded = Math.min(batchSize, targetLength - selectedTracks.length);
    if (tracksNeeded <= 0) break;
    
    const batchPrompt = `
You are continuing to build the "${strategy.overallMood}" playlist.

CURRENT PLAYLIST (last 3 tracks):
${selectedTracks.slice(-3).map((t, i) => `${selectedTracks.length - 2 + i}. ${t.artist} - ${t.title} [${t.sourceProvider}, ${t.energy}% energy]`).join('\n') || 'Starting playlist...'}

TARGET ENERGY for next section: ${strategy.energyProgression[Math.floor(batch / (totalBatches / strategy.energyProgression.length))]}

SELECT NEXT ${tracksNeeded} TRACKS (round-robin from users):
${userProfiles.map((user, userIndex) => {
  const tracksToShow = Math.ceil(tracksNeeded / userProfiles.length);
  const availableTracks = user.candidateTracks
    .filter((t: AppleTrack) => !selectedTracks.some(selected => selected.id === t.id))
    .slice(0, tracksToShow);
    
  return `
User ${user.userId.slice(0, 8)} candidates (pick ${Math.ceil(tracksNeeded / userProfiles.length)}):
${availableTracks.map((t: AppleTrack, i: number) => 
  `${i + 1}. ${t.artist} - ${t.title} [${t.energy || 50}% energy, ${t.genre || 'unknown'}]`
).join('\n')}`;
}).join('\n')}

Return ONLY a JSON array of track selections:
[
  {"userIndex": 0, "trackIndex": 1, "reasoning": "Perfect energy match"},
  {"userIndex": 1, "trackIndex": 2, "reasoning": "Smooth transition"},
  ...
]

Select exactly ${tracksNeeded} tracks total.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: batchPrompt }],
        temperature: 0.5,
        max_tokens: 1500
      });

      const content = response.choices[0].message.content;
      const selections = parseJSONFromResponse(content || '[]');
      
      // Add selected tracks to the playlist
      for (const selection of selections) {
        const user = userProfiles[selection.userIndex];
        const availableTracks = user.candidateTracks
          .filter((t: AppleTrack) => !selectedTracks.some(selected => selected.id === t.id));
          
        const selectedTrack = availableTracks[selection.trackIndex - 1];
        if (selectedTrack) {
          selectedTracks.push({
            ...selectedTrack,
            position: selectedTracks.length + 1
          });
        }
      }
      
    } catch (error) {
      console.error('LLM batch selection error:', error);
      
      // Fallback: simple round-robin selection
      for (let i = 0; i < tracksNeeded; i++) {
        const userIndex = (batch * batchSize + i) % userProfiles.length;
        const user = userProfiles[userIndex];
        const availableTrack = user.candidateTracks
          .find((t: AppleTrack) => !selectedTracks.some(selected => selected.id === t.id));
          
        if (availableTrack) {
          selectedTracks.push({
            ...availableTrack,
            position: selectedTracks.length + 1
          });
        }
      }
    }
  }
  
  return selectedTracks.slice(0, targetLength);
};

/**
 * Estimate token usage for cost tracking
 */
export const estimateBlendGenerationCost = (participantCount: number, targetLength: number = 55): number => {
  const strategyTokens = 1000;
  const batchCount = Math.ceil(targetLength / 8);
  const tokensPerBatch = 1500;
  
  const totalTokens = strategyTokens + (batchCount * tokensPerBatch);
  const costPer1KTokens = 0.06; // GPT-4o pricing, adjust for GPT-5 when available
  
  return (totalTokens / 1000) * costPer1KTokens;
};