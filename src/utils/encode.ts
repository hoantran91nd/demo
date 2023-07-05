export const encodeNotiCode = (code: string): string => {
  if (!code || code.length < 2) {
    return '****';
  }
  return '****' + code.substring(code.length - 2);
};
