// Onboarding-first flow as a small, pure state machine.
//
// This is the method's signature feature: the user's first conversation IS the
// signup. Four steps collect everything needed, then the trial activates — no
// web form, no card. The machine is a pure reducer: no DB, no network, no clock.
// The handler persists the returned state and performs side effects (activate
// trial, track events, send messages). That purity is what makes it trivially
// unit-testable.
//
// Demo domain (generic placeholder — swap for your own product's fields):
//   1. name        — what to call the user
//   2. goal        — their main goal, one line
//   3. focus       — pick a focus area from a list
//   4. hour        — what hour (0–23) to send the daily nudge

export const FOCUS_OPTIONS = ['Deep work', 'Health', 'Relationships', 'Learning'] as const;
export type FocusOption = typeof FOCUS_OPTIONS[number];

export type OnboardingStep = 'ask_name' | 'ask_goal' | 'ask_focus' | 'ask_hour' | 'completed';

export interface OnboardingAnswers {
  name?: string;
  goal?: string;
  focus?: FocusOption;
  hour?: number;
}

export interface OnboardingState {
  step: OnboardingStep;
  answers: OnboardingAnswers;
}

export interface OnboardingResult {
  state: OnboardingState;
  /** Message to send back to the user for this transition. */
  reply: string;
  /** True only on the transition that completes onboarding (activate the trial). */
  activated: boolean;
}

const DEFAULT_TRIAL_DAYS = 14;

const PROMPTS: Record<Exclude<OnboardingStep, 'completed'>, string> = {
  ask_name: "Welcome! I'll set you up in 4 quick steps.\n\nStep 1/4 — What should I call you?",
  ask_goal: 'Step 2/4 — What is your main goal right now? (one line)',
  ask_focus:
    'Step 3/4 — Pick a focus area. Reply with a number:\n1) Deep work\n2) Health\n3) Relationships\n4) Learning',
  ask_hour: 'Step 4/4 — What hour should I send your daily nudge? (0–23, e.g. 8)',
};

const ERRORS = {
  name: 'Please send a name between 1 and 40 characters.',
  goal: 'Please send your goal as a short line (1–200 characters).',
  focus: 'Please reply with a number from 1 to 4.',
  hour: 'Please send a whole number between 0 and 23.',
};

/** Parse a trimmed string as a whole number; null if not a plain integer. */
function parseWholeNumber(text: string): number | null {
  if (!/^-?\d+$/.test(text.trim())) return null;
  return Number.parseInt(text.trim(), 10);
}

/** Begin a fresh onboarding conversation. */
export function beginOnboarding(): OnboardingResult {
  return {
    state: { step: 'ask_name', answers: {} },
    reply: PROMPTS.ask_name,
    activated: false,
  };
}

function completionReply(answers: Required<OnboardingAnswers>, trialDays: number): string {
  return [
    `You're all set, ${answers.name}!`,
    '',
    `Goal: ${answers.goal}`,
    `Focus: ${answers.focus}`,
    `Daily nudge: ${String(answers.hour).padStart(2, '0')}:00`,
    '',
    `Your ${trialDays}-day free trial is now active. Your first nudge is on its way.`,
  ].join('\n');
}

/**
 * Advance the conversation by one user message. Pure: returns the next state,
 * the reply to send, and whether this transition completed onboarding.
 * On invalid input, the step is unchanged and `reply` explains the problem.
 */
export function advanceOnboarding(
  state: OnboardingState,
  input: string,
  options: { trialDays?: number } = {},
): OnboardingResult {
  const trialDays = options.trialDays ?? DEFAULT_TRIAL_DAYS;
  const text = input.trim();
  const answers = state.answers;
  const stay = (reply: string): OnboardingResult => ({ state, reply, activated: false });

  switch (state.step) {
    case 'ask_name': {
      if (text.length < 1 || text.length > 40) return stay(ERRORS.name);
      return {
        state: { step: 'ask_goal', answers: { ...answers, name: text } },
        reply: PROMPTS.ask_goal,
        activated: false,
      };
    }
    case 'ask_goal': {
      if (text.length < 1 || text.length > 200) return stay(ERRORS.goal);
      return {
        state: { step: 'ask_focus', answers: { ...answers, goal: text } },
        reply: PROMPTS.ask_focus,
        activated: false,
      };
    }
    case 'ask_focus': {
      const choice = parseWholeNumber(text);
      if (choice === null || choice < 1 || choice > FOCUS_OPTIONS.length) return stay(ERRORS.focus);
      return {
        state: { step: 'ask_hour', answers: { ...answers, focus: FOCUS_OPTIONS[choice - 1] } },
        reply: PROMPTS.ask_hour,
        activated: false,
      };
    }
    case 'ask_hour': {
      const hour = parseWholeNumber(text);
      if (hour === null || hour < 0 || hour > 23) return stay(ERRORS.hour);
      const finalAnswers = { ...answers, hour } as Required<OnboardingAnswers>;
      return {
        state: { step: 'completed', answers: finalAnswers },
        reply: completionReply(finalAnswers, trialDays),
        activated: true,
      };
    }
    case 'completed':
      return stay('You are already set up. Send /status to see your details.');
  }
}

/** Type guard for a value loaded from JSONB (`users.preferences.onboarding`). */
export function isOnboardingState(value: unknown): value is OnboardingState {
  if (typeof value !== 'object' || value === null) return false;
  const step = (value as { step?: unknown }).step;
  return typeof step === 'string' &&
    ['ask_name', 'ask_goal', 'ask_focus', 'ask_hour', 'completed'].includes(step);
}
