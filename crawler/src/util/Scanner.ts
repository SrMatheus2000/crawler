import { removeTrailingSlash, getBaseUrl, fixProtocol, estimateTime, unwantedExtensions, hashCode } from '.';
import getSitemapLinks from './getSitemapLinks';
import Queue from './Queue';
import { Form } from './types';
import { maxQueue, timeout } from '../configs/appConfig';
import { Scan } from '../db';
import cheerio, { load } from 'cheerio';
import { Browser, launch, Page, Protocol } from 'puppeteer';


class Scanner {
  private maxUrls = 0;

  private scanId: string | null = null;

  private url = '';

  private baseUrl = '';

  private imports = new Set<string>();
  private links = new Set<string>();
  private scripts = new Set<string>();

  private cookies: Protocol.Network.Cookie[] = [];
  private forms: Form[] = [];

  private localStorage = {};
  private sessionStorage = {};

  private scannedLinks: string[] = [];
  private errorLinks: string[] = [];

  private browser: Browser | null = null;

  private queue = new Queue(maxQueue);
  private runningLinks: string[] = [];

  private ignoredDomains: string[] = [];

  private startTime: number = 0;


  constructor(scanId: string, url: string, maxUrls: number, additionalUrls: string[], ignore: string[]) {
    if (!url) throw new Error('No URL');

    this.scanId = scanId;

    const baseUrl = fixProtocol(getBaseUrl(url) || url);

    this.ignoredDomains = ignore;

    this.maxUrls = maxUrls;
    this.baseUrl = baseUrl.replace(/https?:\/\/(www)?\.?/, '');
    this.url = baseUrl;
    this.links.add(baseUrl);
    additionalUrls.forEach(additional => this.links.add(removeTrailingSlash(fixProtocol(additional))));
  }

  /**
   * Metodo externo para iniciar o processo de scan
   */
  public scanWebsite = async () => {
    console.log(`Starting scan for ${this.url}`);

    this.browser = await launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: false
    });

    console.log(`Scanning robots.txt from ${this.url}`);
    //* Escanear robots.txt
    const foundLinks = await getSitemapLinks(removeTrailingSlash(this.url));
    foundLinks.forEach(link => this.addLink(link));
    //* -------------------

    this.startTime = performance.now();

    console.log(`Crawling ${this.url}`);
    this.enqueueLinks();
    await this.queue.isRunning();

    if (this.browser?.isConnected()) this.browser.close();

    console.log(`Finished scan for ${this.url}`);
    return this.makeResults();
  };

  /**
   * Metodo externo para encerrar o processo de scan prematuramente
   */
  public close = () => {
    this.queue.stop = true;
    this.browser?.close();
    this.browser = null;

    return this.makeResults();
  };

  /**
   * Método que porcentagens e tempo estimado
   */
  public makePercentage = () => {
    const linksAnalized = this.scannedLinks.length + this.errorLinks.length;
    const linksToAnalize = Math.min(this.maxUrls || this.links.size, this.links.size);

    return {
      linksAnalized,
      urlCount: this.links.size,
      percentage: ((linksAnalized / linksToAnalize) * 100).toFixed(2),
      remainingTime: estimateTime(linksAnalized, linksToAnalize, performance.now() - this.startTime)
    };
  };

  /**
   * Método que gera os resultados
   */
  private makeResults = () => {
    const formCount = this.forms.length;
    const formFieldCount = this.forms.reduce((count, form) => count + (form.fields?.length ?? 0), 0);
    const links = Array.from(this.links);

    return {
      imports: Array.from(this.imports),
      links,
      scripts: Array.from(this.scripts),
      cookies: this.cookies,
      forms: this.forms,
      localStorage: this.localStorage,
      sessionStorage: this.sessionStorage,
      urlCount: this.links.size,
      cookieCount: this.cookies.length,
      formCount, formFieldCount,
      localStorageCount: Object.keys(this.localStorage).length,
      sessionStorageCount: Object.keys(this.sessionStorage).length,
      errorLinks: this.errorLinks,
      importCount: this.imports.size,
      scriptsCount: this.scripts.size,
      errorCount: this.errorLinks.length,
      httpLinkCount: links.reduce((count, link) => link.startsWith('http://') ? ++count : count, 0)
    };
  };

  /**
   * Realiza o scan da url
   */
  private scan = async (url: string) => {
    if (!this.browser?.isConnected()) return;
    const page = await this.browser.newPage();

    try {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const type = request.resourceType();
        if (
          type === 'stylesheet' ||
          type === 'image' ||
          type === 'font' ||
          type === 'media'
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      try {
        await page.goto(url, {
          waitUntil: 'networkidle0', // espera ate que nao tenham tido requisicoes nos ultimos 500ms
          timeout: timeout
        });
      } catch (error) {
        console.log(`Google cache for ${url}`);
        await page.goto(this.getUrlFromGoogleCache(url), {
          waitUntil: 'networkidle0', // espera ate que nao tenham tido requisicoes nos ultimos 500ms
          timeout: timeout
        });
      }

      const urlContent = await page.content();

      const $ = load(urlContent);

      this.getLinks($, getBaseUrl(url));

      this.enqueueLinks();

      this.getImports($);

      this.getScripts($);

      this.getForms($, url);

      await this.getAllCookies(page);

      await this.getLocalStorage(page);
      await this.getSessionStorage(page);

      this.scannedLinks.push(url);
    } catch (error) {
      console.error(error);
      this.errorLinks.push(url);
    } finally {

      await Scan.updateOne({
        _id: this.scanId
      }, this.makeResults());

      const { linksAnalized, urlCount, percentage, remainingTime } = this.makePercentage();

      console.log(
        url,
        urlCount,
        linksAnalized,
        `${percentage}%`,
        remainingTime
      );
      this.runningLinks.splice(this.runningLinks.indexOf(url), 1);
      await page.close();
    }
  };

  /**
   * Pega os imports em tag link na tela
   */
  private getImports = ($: cheerio.Root) => {
    $('link').each((_, value) => {
      const link = (value as cheerio.TagElement).attribs.href;
      if (link) this.imports.add(link);
    });
  };

  /**
   * Pega os scripts importados na tela
   */
  private getScripts = ($: cheerio.Root) => {
    $('script').each((_, value) => {
      const link = (value as cheerio.TagElement).attribs.src;
      if (link) this.scripts.add(link);
    });
  };

  /**
   * Pega os hrefs da tela
   */
  private getLinks = ($: cheerio.Root, url: string) => {
    $('*[href]:not(link)').each((_, value) => {
      const link = (value as cheerio.TagElement).attribs.href?.replace(/([#?&].*)?\/?$/, '');

      this.addLink(link, url);
    });
  };

  /**
   * Pega os forms e fields da tela
   */
  private getForms = ($: cheerio.Root, url: string) => {
    let forms = [];
    let formcount = 0;

    //TODO Dois metodos muito parecidos, tentar abstrair alguma coisa para um metodo aparte

    //* Procura forms e seus inputs
    $('form').each((_, value) => {
      const form: Form = { ...(value as cheerio.TagElement).attribs };
      form.fields = [];

      $(value).find('input').each((_, value) => {
        form.fields!.push((value as cheerio.TagElement).attribs);
      });

      const hash = hashCode(JSON.stringify(form));

      form.name = `pg_${this.errorLinks.length + this.scannedLinks.length}_frm${++formcount}`;
      form.fields.forEach(field => field.name = form.name);

      if (!this.forms.some(item => item.hash === hash)) {
        form.url = url;
        form.hash = hash;
        forms.push(form);
      }
    });

    //* Procura inputs fora de blocos form
    const orphanInputs = $('input:not(form input)');

    if (!orphanInputs.empty()) {
      const form: Form = {};
      form.fields = [];

      orphanInputs.each((_, value) => {
        form.fields!.push((value as cheerio.TagElement).attribs);
      });

      const hash = hashCode(JSON.stringify(form));

      form.name = `pg_${this.runningLinks.length + this.errorLinks.length + this.scannedLinks.length}_frm${++formcount}`;
      form.fields.forEach(field => field.name = form.name);

      if (!this.forms.some(item => item.hash === hash)) {
        form.url = url;
        form.hash = hash;
        forms.push(form);
      }
    }

    if (forms.length) this.forms = this.forms.concat(forms);
  };

  /**
   * Pega itens do localStorage
   */
  private getLocalStorage = async (page: Page) => {
    const localStorageData = await page.evaluate(() => {
      let json = {};
      /* eslint-disable no-undef */
      //@ts-ignore
      for (let i = 0; i < localStorage.length; i++) {
        //@ts-ignore
        const key = localStorage.key(i);
        //@ts-ignore
        json[key] = localStorage.getItem(key);
      }
      /* eslint-enable no-undef */
      return json;
    });
    this.localStorage = { ...this.localStorage, ...localStorageData };
  };

  
  /**
   * Pega itens do sessionStorage
   */
  private getSessionStorage = async (page: Page) => {
    const sessionStorageData = await page.evaluate(() => {
      let json = {};
      /* eslint-disable no-undef */
      //@ts-ignore
      for (let i = 0; i < sessionStorage.length; i++) {
        //@ts-ignore
        const key = sessionStorage.key(i);
        //@ts-ignore
        json[key] = sessionStorage.getItem(key);
      }
      /* eslint-enable no-undef */
      return json;
    });
    this.sessionStorage = { ...this.sessionStorage, ...sessionStorageData };
  };


  /**
   * Pega todos os cookies da tela
   */
  private getAllCookies = async (page: Page) => {
    const client = await page.target().createCDPSession();
    const { cookies = [] } = await client.send('Network.getAllCookies');
    this.concatCookies(cookies);
    this.concatCookies(await page.cookies());
  };

  /**
   * Adiciona cookies aos cookies da classe
   */
  private concatCookies = (cookies: Protocol.Network.Cookie[] = []) => {
    cookies.forEach(cookie => {
      if (!this.cookies.some(c => c.name === cookie.name)) this.cookies.push(cookie);
    });
  };

  private canAddMoreLinks = () => {
    return !this.maxUrls || (this.scannedLinks.length + this.errorLinks.length + this.runningLinks.length) < this.maxUrls;
  };

  private addLink = (link: string, url = '') => {
    if (link && !unwantedExtensions.test(link)) {
      const linkToAdd = link.startsWith('/') ? (url || this.url) + link : link;
      if (
        linkToAdd.includes(this.baseUrl) &&
        linkToAdd.startsWith('http') &&
        !this.shouldBeIgnored(linkToAdd)
      )
        this.links.add(removeTrailingSlash(linkToAdd));
    }
  };

  private shouldBeIgnored = (url = '') => {
    return this.ignoredDomains.some(ignored => url.includes(ignored));
  };

  private getUrlFromGoogleCache = (url = '') => {
    return `https://webcache.googleusercontent.com/search??cd=1&hl=pt-BR&ct=clnk&gl=br+&q=cache:${url}`;
  };

  private enqueueLinks = () => {
    //TODO otimizar jeito de infeileirar links
    this.links.forEach(link => {
      if (this.canAddMoreLinks()) {
        if (
          !this.scannedLinks.includes(link) &&
          !this.errorLinks.includes(link) &&
          !this.runningLinks.includes(link)
        ) {
          this.runningLinks.push(link);
          this.queue.enqueue(() => this.scan(link));
        }
      } else return;
    });
  };
}

export default Scanner;