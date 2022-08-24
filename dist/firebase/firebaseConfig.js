"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainBucket = exports.mainMsg = exports.mainAuth = exports.adminDB = exports.mainDB = exports.adminApp = exports.mainApp = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const database_1 = require("firebase-admin/database");
const auth_1 = require("firebase-admin/auth");
const messaging_1 = require("firebase-admin/messaging");
const storage_1 = require("firebase-admin/storage");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const serviceAccountMain = {
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
const serviceAccountAdmin = {
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
exports.mainApp = firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccountMain),
    databaseURL: process.env.database_main,
    storageBucket: process.env.storage_main
}, 'main');
exports.adminApp = firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccountAdmin),
    databaseURL: process.env.database_admin,
}, 'admin');
exports.mainDB = (0, database_1.getDatabase)(exports.mainApp);
exports.adminDB = (0, database_1.getDatabase)(exports.adminApp);
exports.mainAuth = (0, auth_1.getAuth)(exports.mainApp);
exports.mainMsg = (0, messaging_1.getMessaging)(exports.mainApp);
exports.mainBucket = (0, storage_1.getStorage)(exports.mainApp).bucket();
