import { mongoUrl, sshConfig } from './configs/appConfig';
import { Schema, model, connect } from 'mongoose';
import tunnel from 'tunnel-ssh';

(async () => {
  try {
    if (process.env.DEVELOPMENT) {
      connectToMongo();
      return;
    }
    tunnel(sshConfig, async (error) => {
      if (error) {
        console.log('Error connecting to ssh: ');
        console.error(error);
        return;
      }
      console.log('Connected to ssh');
      connectToMongo();
    });
  } catch (error) {
    console.log(`Error connecting to ${mongoUrl.replace(/\/\/[^@]*@/, '//<credential>@')}`);
    console.error(error);
  }
})();

async function connectToMongo() {
  await connect(mongoUrl);
  console.log('Connected to mongo');
}

export const CookieSchema = new Schema({
  name: String,
  value: String,
  domain: String,
  path: String,
  expires: Number,
  size: Number,
  httpOnly: Boolean,
  secure: Boolean,
  session: Boolean,
  priority: String,
  sameParty: Boolean,
  sourceScheme: String,
  sourcePort: Number
}, { strict: false });


export const FormFieldSchema = new Schema({
  name: String,
  type: String
}, { strict: false });


export const FormSchema = new Schema({
  url: String,
  hash: { type: Number/*, unique: true, sparse: true*/ },
  fields: [FormFieldSchema]
}, { strict: false });


export const ScanSchema = new Schema({
  websiteId: Number,
  url: String,
  imports: [String],
  links: [String],
  scripts: [String],
  errorLinks: [String],
  cookies: [CookieSchema],
  forms: [FormSchema],
  localStorage: Schema.Types.Mixed,
  sessionStorage: Schema.Types.Mixed,
  urlCount: Number,
  cookieCount: Number,
  formCount: Number,
  formFieldCount: Number,
  localStorageCount: Number,
  sessionStorageCount: Number,
  importCount: Number,
  scriptsCount: Number,
  errorCount: Number,
  httpLinkCount: Number,
  termsOfUsePolicy: Boolean,
  cookiesPolicy: Boolean,
  linksAnalized: Number,
  percentage: Number,
  remainingTime: String
}, { collection: 'scans', strict: false });


export const Scan = model('scans', ScanSchema, 'scans');