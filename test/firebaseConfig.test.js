import { adminApp, mainApp } from '../firebase/firebaseConfig.js';

test('firebase both apps working', () => {
  expect(mainApp.name).toBe('main');
  expect(adminApp.name).toBe('admin');
});

