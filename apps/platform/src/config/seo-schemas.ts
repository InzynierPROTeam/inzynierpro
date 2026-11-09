import { getEmailAddress } from '@inzpro/config/app'
import { POLISH_LANGUAGE } from '@inzpro/config/localization'
import { SocialsLinks } from '@inzpro/config/social'
import { appName, LOGO_URL } from '~platform/config/app'
import { getAppUrl, getMainPageUrl } from '~platform/utils/url'

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: appName,
  url: getMainPageUrl(),
  logo: LOGO_URL,
  sameAs: [
    SocialsLinks.Facebook,
    SocialsLinks.Instagram,
    SocialsLinks.TikTok,
    SocialsLinks.X,
    SocialsLinks.YouTube,
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: getEmailAddress('kontakt'),
    availableLanguage: 'Polish',
  },
}

export const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: `Platforma ${appName}`,
  url: getAppUrl(''),
  description:
    'Nowoczesna platforma do przygotowania do egzaminu na uprawnienia budowlane. Testy, symulacje egzaminu i inteligentny system nauki zgodny z wymaganiami PIIB i IARP.',
  inLanguage: POLISH_LANGUAGE,
}

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `Platforma ${appName}`,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web, iOS, Android',
  url: getAppUrl(''),
  description:
    'Platforma online do przygotowania do egzaminu na uprawnienia budowlane. Zawiera tysiące pytań testowych, symulator egzaminu i inteligentny system nauki zgodny z wymaganiami PIIB i IARP.',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'PLN',
    availability: 'https://schema.org/InStock',
    description: 'Dostępna darmowa wersja demo. Plany płatne od 1 miesiąca.',
  },
  featureList: [
    'Tysiące pytań testowych zgodnych z PIIB i IARP',
    'Symulator egzaminu pisemnego',
    'Inteligentny system powtórek',
    'Dostęp z telefonu, tabletu i komputera',
    'Darmowe ujednolicone akty prawne',
    'Regularne aktualizacje przed każdą sesją egzaminacyjną',
  ],
  inLanguage: POLISH_LANGUAGE,
  audience: {
    '@type': 'Audience',
    audienceType:
      'Kandydaci do uprawnień budowlanych, inżynierowie budownictwa, architekci, osoby przygotowujące się do egzaminu PIIB i IARP',
  },
}

export const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Jakie specjalności są dostępne na platformie?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Platforma obejmuje wszystkie specjalności dostępne na egzaminie na uprawnienia budowlane, w tym: konstrukcyjno-budowlaną, instalacyjną sanitarną, architektoniczną, instalacyjną elektryczną, instalacyjną telekomunikacyjną, drogową, mostową, kolejową i hydrotechniczną. Zakres materiału jest przypisany do wybranej specjalności.',
      },
    },
    {
      '@type': 'Question',
      name: 'Czy materiały są zgodne z wymaganiami PIIB i IARP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tak. Zakres materiałów oraz dostępne akty prawne są zgodne z aktualnymi wymaganiami egzaminacyjnymi określonymi przez PIIB oraz IARP.',
      },
    },
    {
      '@type': 'Question',
      name: 'Jak często aktualizowane są materiały?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Aktualizacje wprowadzane są na bieżąco, w szczególności przed kolejnymi sesjami egzaminacyjnymi lub po istotnych zmianach w aktach prawnych.',
      },
    },
    {
      '@type': 'Question',
      name: 'Czy mogę korzystać z platformy za darmo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tak. Dostępna jest darmowa wersja demo, która pozwala sprawdzić, jak działa platforma i jakie funkcje oferuje przed zakupem.',
      },
    },
    {
      '@type': 'Question',
      name: 'Czy moja subskrypcja odnawia się automatycznie?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nie. Płatność jest jednorazowa za wybrany okres dostępu (1, 3 lub 6 miesięcy). Subskrypcja nie odnawia się automatycznie, po wygaśnięciu dostępu możesz samodzielnie wybrać i opłacić kolejny okres.',
      },
    },
    {
      '@type': 'Question',
      name: 'Na jakich urządzeniach mogę korzystać z platformy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Platforma działa w przeglądarce internetowej i jest dostępna na komputerach, tabletach oraz telefonach. Nie wymaga instalowania dodatkowych aplikacji.',
      },
    },
    {
      '@type': 'Question',
      name: 'Czy mogę korzystać z aktów prawnych bez dodatkowych opłat?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tak. Dostęp do ujednoliconych aktów prawnych jest częścią platformy, jest dostępny dla każdego użytkownika i nie wymaga dodatkowych opłat.',
      },
    },
    {
      '@type': 'Question',
      name: 'Czym jest symulator egzaminu pisemnego?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Symulator egzaminu to tryb, w którym test odbywa się z limitem czasu i liczbą pytań odpowiadającą rzeczywistemu egzaminowi. Po zakończeniu dostępny jest wynik wraz z odpowiedziami oraz ich wyjaśnieniem.',
      },
    },
  ],
}
