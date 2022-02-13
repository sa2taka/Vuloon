export const uniqBy = <T>(list: T[], key: keyof T): T[] => {
  const seen = new Set();

  return list.filter((it) => {
    const val = it[key];
    if (seen.has(val)) {
      return false;
    } else {
      seen.add(val);
      return true;
    }
  });
};
