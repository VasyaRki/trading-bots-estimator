export function findLatestRecordBeforeOrAt(arr, cutoffTime) {
  if (arr.length === 0) return null;

  const cutoff = cutoffTime.value;

  let lo = 0;
  let hi = arr.length - 1;
  let ansIndex = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const ts = arr[mid].timestamp;

    if (ts <= cutoff) {
      ansIndex = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return ansIndex === -1 ? null : arr[ansIndex];
}
