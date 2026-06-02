export function seededRandom(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}
