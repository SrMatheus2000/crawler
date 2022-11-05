import humanizeDuration from 'humanize-duration';

export const unwantedExtensions = /\.(pdf|png|jpe?g|xlsx?|docx?|pptx?|od[ts]|js|json|bmp|jiff|gif|pst|msg|eml|epub|cs[vs]|txt|zip|svg|swf|rar|bz2)$/i;

export const removeTrailingSlash = (url = '') => url.replace(/\/$/, '');

export const hashCode = (str = '') => {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const getBaseUrl = (url = '') => {
  const [baseUrl] = /https?:\/\/[^/]+/.exec(url) || [''];
  return baseUrl;
};


export const estimateTime = (linksAnalized: number, linksToAnalize: number, timeExpent: number) => {
  if (!linksAnalized) return 'N/A';
  //* regra de 3 basica
  //* linksAnalized  ---- timeExpent
  //* linksToAnalize ---- x
  const milliseconds = (linksToAnalize * timeExpent) / linksAnalized;

  return humanizeDuration(milliseconds - timeExpent, { maxDecimalPoints: 2, language: 'en' });
};

export const fixProtocol = (url = '') => {
  if (/^https?:\/\//.test(url)) return url;
  return `https://${url}`;
};