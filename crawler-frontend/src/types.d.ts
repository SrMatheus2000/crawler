export interface StartScanResponse {
  scanId: string;
}

export interface FormFeild {
  name?: string;
  type?: string;
  required?: boolean;
  value?: unknown;
  checked?: boolean;
}

export interface Form {
  url?: string;
  hash?: number;
  name?: string;
  fields?: FormFeild[];
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  session: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  priority: 'Low' | 'Medium' | 'High';
  sameParty: boolean;
  sourceScheme: 'Unset' | 'NonSecure' | 'Secure';
  sourcePort: number;
  partitionKey?: string;
  partitionKeyOpaque?: boolean;
}

export interface ScanResult {
  /** @ignore */
  _id: string;
  /** @ignore */
  __v: number;
  imports: string[];
  links: string[];
  scripts: string[];
  errorLinks: string[];
  cookies: Cookie[];
  forms: Form[];
  url: string;
  status?: string;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  cookieCount?: number;
  formCount?: number;
  formFieldCount?: number;
  localStorageCount?: number;
  sessionStorageCount?: number;
  importCount?: number;
  scriptsCount?: number;
  errorCount?: number;
  httpLinkCount?: number;
  linksAnalized?: number;
  urlCount?: number;
  percentage?: number;
  remainingTime?: string;
}