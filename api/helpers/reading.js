export function getReadingDetails(feedEntry) {
  const entry = feedEntry.shortform || feedEntry.blockchain;
  const parenthetical = entry.parenthetical
    ? entry.parenthetical.toLowerCase()
    : null;
  if (parenthetical) {
    if (parenthetical.indexOf('video') > -1) {
      return { icon: 'tv', verb: 'Watched' };
    } else if (parenthetical.indexOf('podcast')) {
      return { icon: 'headphones', verb: 'Listened to' };
    }
  }
  return { icon: 'newspaper', verb: 'Read' };
}
