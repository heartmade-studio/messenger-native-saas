import { assert, assertEquals, assertFalse } from '@std/assert';
import {
  advanceOnboarding,
  beginOnboarding,
  isOnboardingState,
  type OnboardingState,
} from './onboarding.ts';

Deno.test('beginOnboarding starts at ask_name with the step 1 prompt', () => {
  const result = beginOnboarding();
  assertEquals(result.state.step, 'ask_name');
  assertFalse(result.activated);
  assert(result.reply.includes('Step 1/4'));
});

Deno.test('happy path: four valid answers complete onboarding and activate', () => {
  const state: OnboardingState = beginOnboarding().state;

  let r = advanceOnboarding(state, 'Alex');
  assertEquals(r.state.step, 'ask_goal');
  assertEquals(r.state.answers.name, 'Alex');
  assertFalse(r.activated);

  r = advanceOnboarding(r.state, 'Ship the starter kit');
  assertEquals(r.state.step, 'ask_focus');
  assertEquals(r.state.answers.goal, 'Ship the starter kit');

  r = advanceOnboarding(r.state, '1');
  assertEquals(r.state.step, 'ask_hour');
  assertEquals(r.state.answers.focus, 'Deep work');

  r = advanceOnboarding(r.state, '8', { trialDays: 14 });
  assertEquals(r.state.step, 'completed');
  assertEquals(r.state.answers.hour, 8);
  assert(r.activated, 'final step must activate');
  assert(r.reply.includes('14-day free trial'));
  assert(r.reply.includes('Alex'));
});

Deno.test('invalid name keeps the step and explains', () => {
  const r = advanceOnboarding({ step: 'ask_name', answers: {} }, '   ');
  assertEquals(r.state.step, 'ask_name');
  assertFalse(r.activated);
  assert(r.reply.includes('1 and 40'));
});

Deno.test('focus choice out of range is rejected', () => {
  const base: OnboardingState = { step: 'ask_focus', answers: { name: 'A', goal: 'G' } };
  assertEquals(advanceOnboarding(base, '5').state.step, 'ask_focus');
  assertEquals(advanceOnboarding(base, '0').state.step, 'ask_focus');
  assertEquals(advanceOnboarding(base, 'two').state.step, 'ask_focus');
});

Deno.test('hour validation enforces 0–23 and rejects non-integers', () => {
  const base: OnboardingState = {
    step: 'ask_hour',
    answers: { name: 'A', goal: 'G', focus: 'Health' },
  };
  assertFalse(advanceOnboarding(base, '24').activated);
  assertFalse(advanceOnboarding(base, '-1').activated);
  assertFalse(advanceOnboarding(base, '8.5').activated);
  assert(advanceOnboarding(base, '0').activated);
  assert(advanceOnboarding(base, '23').activated);
});

Deno.test('trialDays flows into the completion message', () => {
  const base: OnboardingState = {
    step: 'ask_hour',
    answers: { name: 'A', goal: 'G', focus: 'Learning' },
  };
  const r = advanceOnboarding(base, '9', { trialDays: 7 });
  assert(r.reply.includes('7-day free trial'));
});

Deno.test('isOnboardingState guards JSONB-loaded values', () => {
  assert(isOnboardingState({ step: 'ask_name', answers: {} }));
  assertFalse(isOnboardingState(null));
  assertFalse(isOnboardingState({ step: 'nope' }));
  assertFalse(isOnboardingState('ask_name'));
});
