
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

export interface QueueItem {
  promise: () => Promise<any>;
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}