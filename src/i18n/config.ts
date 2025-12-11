import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enCommon from "../locales/en/common.json";
import enContact from "../locales/en/contact.json";
import enDonations from "../locales/en/donations.json";
import enEvents from "../locales/en/events.json";
import enGallery from "../locales/en/gallery.json";
import enLanding from "../locales/en/landing.json";
import enMembers from "../locales/en/members.json";
import enNavigation from "../locales/en/navigation.json";
import enRequests from "../locales/en/requests.json";

import frCommon from "../locales/fr/common.json";
import frContact from "../locales/fr/contact.json";
import frDonations from "../locales/fr/donations.json";
import frEvents from "../locales/fr/events.json";
import frGallery from "../locales/fr/gallery.json";
import frLanding from "../locales/fr/landing.json";
import frMembers from "../locales/fr/members.json";
import frNavigation from "../locales/fr/navigation.json";
import frRequests from "../locales/fr/requests.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        navigation: enNavigation,
        members: enMembers,
        events: enEvents,
        contact: enContact,
        requests: enRequests,
        gallery: enGallery,
        donations: enDonations,
      },
      fr: {
        common: frCommon,
        landing: frLanding,
        navigation: frNavigation,
        members: frMembers,
        events: frEvents,
        contact: frContact,
        requests: frRequests,
        gallery: frGallery,
        donations: frDonations,
      },
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: [
      "common",
      "landing",
      "navigation",
      "members",
      "events",
      "contact",
      "requests",
      "gallery",
      "donations",
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
