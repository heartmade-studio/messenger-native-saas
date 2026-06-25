// Constant-time string comparison, used to validate webhook secrets without
// leaking length/timing information that a naive `===` would.

const encoder = new TextEncoder();

export function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  // Comparing lengths first is unavoidable; the byte loop below is constant-time
  // for equal-length inputs, which is the case that matters for secret matching.
  if (aBuf.length !== bBuf.length) return false;
  let diff = 0;
  for (let i = 0; i < aBuf.length; i += 1) {
    diff |= aBuf[i] ^ bBuf[i];
  }
  return diff === 0;
}
