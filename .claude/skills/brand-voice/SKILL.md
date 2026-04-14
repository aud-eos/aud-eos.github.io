---
name: brand-voice
description: Develop and refine the brand voice profile for audeos.com by prompting the user to write naturally, then extracting style patterns from their responses
disable-model-invocation: true
argument-hint: [status]
---

# Brand Voice Development

Build a brand voice profile by prompting the user to write naturally, then analyzing their responses to extract style patterns. The voice profile is a living document that evolves over time.

## Voice Profile File

The voice profile lives at `.claude/brand-voice.md` in the project root. This file is checked into the repo.

**Target size:** 2,000-3,000 words. This is the sweet spot — enough for Claude to reliably reproduce the voice, small enough to fit in context without waste.

## Mode Selection

- If `$ARGUMENTS` is `status`: show the **Voice Profile Status** (see below)
- If `$ARGUMENTS` is empty: start a **Voice Session**

## Voice Profile Status

Read `.claude/brand-voice.md` and report:

1. **Progress bar** — based on how many core voice dimensions have been covered:
   - Sentence structure (length, fragments, rhythm)
   - Vocabulary and word choice
   - Slang and colloquialisms
   - Tone and energy level
   - Punctuation habits
   - Perspective and point of view (I/we/third person)
   - Tense preferences
   - Humor style
   - How they handle descriptions (sparse vs vivid)
   - Emotional register (hype, understated, raw, polished)

   Show: `[=========>    ] 70% — 7/10 dimensions covered`

2. **Gaps** — list which dimensions need more data
3. **Word count** — current size vs target range
4. **Strongest patterns** — the 3 most confident observations in the profile

## Voice Session

### 1. Read the current profile

Read `.claude/brand-voice.md`. If it doesn't exist, this is the first session — create it with a header and empty structure.

### 2. Design prompts based on profile state

**If the profile is empty or thin (< 500 words):**
Use broad, open-ended writing prompts that cast a wide net. These should feel natural and fun, not like a quiz. Examples:
- "Describe the best night out you've had recently"
- "Tell me about a track or album that changed how you listen to music"
- "Write a caption for a photo of a packed dance floor"
- "Rant about something that annoys you about the music scene"
- "How would you introduce a friend to someone at a party?"

**If the profile is developing (500-1,500 words):**
Get more targeted. Look at which dimensions are weak and craft prompts that specifically draw those out:
- If missing humor data: "Describe someone doing something ridiculous at an event"
- If missing descriptive style: "Paint a picture of a venue right before the doors open"
- If missing opinion voice: "What's overrated right now?"
- If missing instructional voice: "Explain to someone how to find good music"

**If the profile is strong (1,500+ words):**
Test and refine. Use prompts that explore edge cases and push boundaries:
- Present two versions of the same sentence and ask which sounds more like them
- Ask them to write in a context they haven't covered (formal announcement, sad moment, technical explanation)
- Challenge established patterns: "Write this same idea but in a completely different way than you normally would"
- Use contrasts: "How would you describe this to a close friend vs to a stranger?"

### 3. Present prompts

Present **3-5 prompts** per session. Show them one at a time. After each response:

1. **Acknowledge briefly** — don't over-praise, don't critique. Just a quick nod so they know you received it.
2. **Move to the next prompt** — keep momentum. Don't analyze out loud between prompts.

After all prompts are answered, proceed to analysis.

### 4. Analyze and update the profile

After the session, analyze all responses together. Look for:

- **Sentence patterns** — average length, use of fragments, run-ons, rhythm
- **Word choice** — preferred vocabulary, words they reach for, words they avoid
- **Slang and colloquialisms** — specific terms, frequency, context
- **Tone** — energy level, confidence, warmth, edge
- **Punctuation** — em dashes, ellipses, periods vs no periods, exclamation marks (or lack of)
- **Perspective** — first person, plural, how they refer to themselves
- **Tense** — present vs past, when they switch
- **Descriptions** — sparse/punchy or vivid/detailed
- **Humor** — dry, playful, sarcastic, absurd
- **Emotional register** — how they express excitement, frustration, nostalgia

**Update the voice profile file:**
- Add new patterns discovered in this session
- Reinforce existing patterns that were confirmed
- Note any contradictions or context-dependent shifts
- Include 2-3 direct quotes from the session as examples (these are the most valuable — real voice samples)

**Important:** Write the profile as a style guide, not a conversation log. Distill patterns, don't dump transcripts.

### 5. Trim if needed

If the profile exceeds 3,000 words after updating:

1. Merge redundant observations
2. Remove the weakest/least confident patterns
3. Keep the strongest example quotes, drop weaker ones
4. Consolidate similar dimensions
5. Never drop a dimension entirely — just tighten the description

### 6. Show session summary

After updating, show:
- Progress bar (updated)
- What was learned this session (2-3 bullet points)
- Gaps remaining
- How many sessions until the profile is strong (estimate)

## Voice Profile Structure

The `.claude/brand-voice.md` file should follow this structure:

```markdown
# Brand Voice Profile — Audeos

> Last updated: YYYY-MM-DD
> Sessions completed: N
> Coverage: N/10 dimensions

## Overview
[2-3 sentence summary of the overall voice]

## Sentence Structure
[Patterns about length, fragments, rhythm]

## Vocabulary & Word Choice
[Preferred words, avoided words, register]

## Slang & Colloquialisms
[Specific terms with usage context]

## Tone & Energy
[Overall energy, confidence level, warmth]

## Punctuation & Formatting
[Habits with dashes, periods, caps, etc.]

## Perspective & Point of View
[I/we/they, how they refer to themselves and others]

## Tense & Temporality
[Present vs past, when they shift]

## Descriptive Style
[Sparse vs vivid, what they focus on]

## Humor
[Type, frequency, context]

## Emotional Register
[How they express different emotions]

## Example Quotes
[Direct quotes from sessions that best capture the voice]
```

## Important Rules

- **Never ask personal or biographical questions** — this repo is open source. Focus only on writing style, opinions, and creative expression. No questions about family, relationships, identity, location history, etc.
- **Never analyze out loud between prompts** — keep the session flowing. Save all analysis for the end.
- **Use the profile to evolve prompts** — every session should feel different. Never repeat the same prompt twice. Read the profile before designing prompts.
- **Distill, don't dump** — the profile is a style guide, not a transcript. Extract patterns, include select quotes, discard the rest.
- **Respect the size budget** — 2,000-3,000 words. Quality over quantity. A tight, accurate profile beats a bloated one.
- **Direct quotes are gold** — always include a few real quotes from each session. They are the most reliable voice reference.
- **No privacy-sensitive content** — if the user's response contains personal details, extract only the stylistic patterns, not the personal facts.
