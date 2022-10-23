import axios from 'axios';

const get = axios.get;


const getSiteMap = async (url: string) => {

  const robots = url + '/robots.txt';

  const { data } = await get(robots);

  const matches = data.match(/Sitemap: (.+)/i);

  return matches[1] || '';
};


export default async (url: string) => {
  try {

    const sitemap = await getSiteMap(url);

    if (!sitemap) return [];

    const hostname = new URL(sitemap).hostname.replace(/\./g, '\\.');
    const regex = new RegExp(`https?://${hostname}.+?(?=(</loc>|]]>))`, 'gmi');

    const { data = '' } = await get<string>(sitemap);

    let indexes = [...new Set(data.match(regex))];

    if (indexes.length === 0 || !indexes[0].endsWith('.xml')) {
      return indexes;
    }

    let links = [];

    for (const index of indexes) {
      try {
        const indexData = (await get(index)).data;
        const array = indexData.match(regex);
        if (array) links.push(...array);
      } catch (err) { }
    }

    return [...new Set(links)];
  } catch (err) {
    return [];
  }
};