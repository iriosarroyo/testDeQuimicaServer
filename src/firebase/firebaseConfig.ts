import admin from 'firebase-admin'
import { getDatabase } from 'firebase-admin/database'
import { getAuth } from 'firebase-admin/auth'
import { getMessaging } from 'firebase-admin/messaging'
import { getStorage } from 'firebase-admin/storage'
import { config } from 'dotenv';
import { ExtendedServiceAccount } from '../interfaces/firebase';
config();



const serviceAccountMain:ExtendedServiceAccount = {
  type: process.env.type_main,
  project_id: process.env.project_id_main,
  private_key_id: process.env.private_key_id_main,
  private_key: process.env.private_key_main?.replace(/\\n/gm, "\n"),
  client_email: process.env.client_email_main,
  client_id: process.env.client_id_main,
  auth_uri: process.env.auth_uri_main,
  token_uri: process.env.token_uri_main,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url_main,
  client_x509_cert_url: process.env.client_x509_cert_url_main,
};

const serviceAccountAdmin:ExtendedServiceAccount = {
  type: process.env.type_admin,
  project_id: process.env.project_id_admin,
  private_key_id: process.env.private_key_id_admin,
  private_key: process.env.private_key_admin?.replace(/\\n/gm, "\n"),
  client_email: process.env.client_email_admin,
  client_id: process.env.client_id_admin,
  auth_uri: process.env.auth_uri_admin,
  token_uri: process.env.token_uri_admin,
  auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url_admin,
  client_x509_cert_url: process.env.client_x509_cert_url_admin,
};

export const mainApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountMain),
  databaseURL: process.env.database_main,
  storageBucket: process.env.storage_main
}, 'main');

export const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccountAdmin),
  databaseURL: process.env.database_admin,
}, 'admin');

export const mainDB = getDatabase(mainApp);
export const adminDB = getDatabase(adminApp);

export const mainAuth = getAuth(mainApp);
export const mainMsg = getMessaging(mainApp);
export const mainBucket= getStorage(mainApp).bucket();
