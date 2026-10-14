/**
 * i18next configuration for GovMind AI
 *
 * - Default language: English (en)
 * - Supported languages: en, mr, hi
 * - Selected language persisted in localStorage key: 'govmind_lang'
 * - document.documentElement.lang is updated on language change
 * - Initialised once; importing this file registers the singleton
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import mr from './locales/mr.json';
import hi from './locales/hi.json';

const STORAGE_KEY = 'govmind_lang';
const SUPPORTED = ['en', 'mr', 'hi'];

function getSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      mr: { translation: mr },
      hi: { translation: hi },
    },
    lng: getSavedLang(),
    fallbackLng: 'en',
    interpolation: {
      // React already escapes values; do not double-escape
      escapeValue: false,
    },
  });

// Keep document lang attribute in sync whenever language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // localStorage unavailable — continue without persistence
  }
});

// Set initial lang attribute
document.documentElement.lang = i18n.language;

export default i18n;
