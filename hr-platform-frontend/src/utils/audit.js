export function formatAction(action) {
  return action
    .split('_')
    .map((word) => word[0] + word.slice(1).toLowerCase())
    .join(' ');
}

function capitalize(str) {
  if (!str) return '';
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

function humanizeKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export function formatDetails(log) {
  const meta = log.metadata;
  if (!meta) return '—';
  if (log.action.startsWith('LEAVE_REQUEST_')) {
    return `Status changed from ${capitalize(meta.previousStatus)} to ${capitalize(meta.newStatus)}`;
  }
  return Object.entries(meta)
    .map(([key, value]) => `${humanizeKey(key)}: ${value}`)
    .join(' · ');
}
