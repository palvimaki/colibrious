/**
 * UI strings keyed by locale. The active locale is resolved from the
 * window hostname at render time (see ./useStrings).
 *
 * fi → kuvankäsittely.fi
 * en → colibrious.com
 */

export type Locale = 'fi' | 'en';

export interface Strings {
  // Brand
  brandName: string;
  brandTld: string;
  brandFull: string;
  ogTitle: string;

  // Hero
  heroLeft: string;
  heroAccent: string;
  heroDescriptionLine1: string;
  heroDescriptionLine2: string;
  privacyBadgeShort: string;
  privacyBadgeFull: string;
  chipNoCookies: string;
  chipNoUploads: string;
  chipOpenSource: string;

  // Header / batch buttons
  downloadAll: string;
  downloadAllShort: (n: number) => string;
  asPdf: string;
  pdfShort: string;
  buildingPdf: string;
  combinePdfTitle: string;

  // Drag overlay
  dropOverlay: string;
  dropOverlayHelp: string;

  // Dropzone
  dropImagesHere: string;
  dropImagesHelp: string;
  selectFiles: string;
  selectImagesAria: string;

  // Settings sidebar
  settingsTitle: string;
  appliesToAll: string;
  outputFormat: string;
  setExactDimensions: string;
  batchWidthAria: string;
  batchHeightAria: string;
  unlockAspect: string;
  lockAspect: string;
  orFitLongestSide: string;
  longestSideAria: string;
  applyBtn: string;
  fitDescription: string;
  filters: string;
  grayscale: string;
  sepia: string;
  quality: string;
  brightness: string;
  watermark: string;
  watermarkPlaceholder: string;
  watermarkAria: string;
  qualityAria: string;
  brightnessAria: string;
  clear: string;
  lossless: string;

  // ImageCard
  free: string;
  cropApply: string;
  cropCancel: string;
  cropHandleAria: (mode: string) => string;
  downloadImageAria: string;
  downloadImageTitle: string;
  removeImageAria: string;
  removeImageTitle: string;
  adjustAria: string;
  rotateAria: string;
  rotateTitle: string;
  flipHorizontalLabel: string;
  flipVerticalLabel: string;
  cropLabel: string;
  format: string;
  qualityShort: string;
  compressionQualityAria: string;

  // Install hint
  installSection: string;
  iphoneSafariTitle: string;
  androidChromeTitle: string;
  androidChromeCopy: string;
  installAppBtn: string;
  installing: string;

  // Install banner
  installBannerText: string;
  installBannerCloseAria: string;

  // Errors
  unsupportedFileType: string;
  fileTooLarge: (mb: string) => string;
  decodeFailed: string;
  processingFailed: string;
  pdfPageFailed: string;
  pdfBuildFailed: string;
  closeErrorsAria: string;
  closeBtn: string;

  // Footer
  footerPrivacy: string;
  footerOpenSource: string;
  footerLicense: string;

  // Filenames
  pdfFilename: (n: number) => string;
  downloadSuffix: string;
}

const fi: Strings = {
  brandName: 'kuvankäsittely',
  brandTld: '.fi',
  brandFull: 'kuvankäsittely.fi',
  ogTitle: 'kuvankäsittely.fi — muokkaa kuvia selaimessa',

  heroLeft: 'Kuvankäsittelyä,',
  heroAccent: 'selaimessa.',
  heroDescriptionLine1: 'Muokkaa, muuta kokoa, pyöritä, muuta PDF:ksi, lisää vesileimoja.',
  heroDescriptionLine2: 'Kaikki suoraan selaimessasi. Ei kirjautumista, toimii ilman verkkoa.',
  privacyBadgeShort: 'Yksityinen',
  privacyBadgeFull: 'Yksityinen — kuvat pysyvät laitteellasi. Toimii ilman verkkoa.',
  chipNoCookies: 'Ei evästeitä',
  chipNoUploads: 'Ei latauksia palvelimelle',
  chipOpenSource: 'Avoin lähdekoodi (MIT)',

  downloadAll: 'Lataa kaikki',
  downloadAllShort: (n) => `Lataa kaikki (${n})`,
  asPdf: 'PDF:nä',
  pdfShort: 'PDF',
  buildingPdf: 'Luodaan PDF…',
  combinePdfTitle: 'Yhdistä kaikki kuvat yhteen PDF-tiedostoon',

  dropOverlay: 'Pudota kuvat mihin tahansa',
  dropOverlayHelp: 'PNG, JPEG tai WebP',

  dropImagesHere: 'Pudota kuvat tähän',
  dropImagesHelp: 'PNG, JPEG tai WebP — enintään 50 MB / tiedosto.',
  selectFiles: 'Valitse tiedostot',
  selectImagesAria: 'Valitse kuvat',

  settingsTitle: 'Asetukset',
  appliesToAll: 'Koskee kaikkia kuvia.',
  outputFormat: 'Tallennusmuoto',
  setExactDimensions: 'Aseta tarkat mitat',
  batchWidthAria: 'Eräleveys',
  batchHeightAria: 'Eräkorkeus',
  unlockAspect: 'Vapauta kuvasuhde',
  lockAspect: 'Lukitse kuvasuhde',
  orFitLongestSide: 'Tai sovita pisin sivu',
  longestSideAria: 'Pisin sivu pikseleinä',
  applyBtn: 'Käytä',
  fitDescription:
    'Skaalaa kunkin kuvan niin, että pisin sivu vastaa annettua arvoa. Kuvasuhde säilyy.',
  filters: 'Suodattimet',
  grayscale: 'Mustavalko',
  sepia: 'Seepia',
  quality: 'Laatu',
  brightness: 'Kirkkaus',
  watermark: 'Vesileima',
  watermarkPlaceholder: 'Kirjoita vesileiman teksti…',
  watermarkAria: 'Vesileiman teksti',
  qualityAria: 'Pakkauslaatu',
  brightnessAria: 'Kirkkaus',
  clear: 'Tyhjennä',
  lossless: 'Häviötön',

  free: 'Vapaa',
  cropApply: 'Käytä',
  cropCancel: 'Peruuta',
  cropHandleAria: (mode) => `Rajauskahva ${mode}`,
  downloadImageAria: 'Lataa kuva',
  downloadImageTitle: 'Lataa',
  removeImageAria: 'Poista kuva',
  removeImageTitle: 'Poista',
  adjustAria: 'Säädöt',
  rotateAria: 'Kierrä 90 astetta',
  rotateTitle: 'Kierrä 90°',
  flipHorizontalLabel: 'Käännä vaakatasossa',
  flipVerticalLabel: 'Käännä pystysuunnassa',
  cropLabel: 'Rajaa',
  format: 'Muoto',
  qualityShort: 'Laatu',
  compressionQualityAria: 'Pakkauslaatu',

  installSection: 'Asenna sovellus',
  iphoneSafariTitle: 'iPhone · Safari',
  androidChromeTitle: 'Android · Chrome / Edge',
  androidChromeCopy:
    'Avaa sivu Chromessa tai Edgessä Androidilla. Kun selain on valmis, paina alla olevaa painiketta natiiviasennusta varten.',
  installAppBtn: 'Asenna kuvankäsittely.fi',
  installing: 'Asennetaan…',

  installBannerText: 'Asenna sovellus puhelimeesi',
  installBannerCloseAria: 'Sulje asennusbanneri',

  unsupportedFileType: 'Tukematon tiedostomuoto. Hyväksytyt: PNG, JPEG, WebP.',
  fileTooLarge: (mb) => `Tiedosto on liian suuri (${mb} MB). Yläraja 50 MB.`,
  decodeFailed: 'Kuvan dekoodaus epäonnistui.',
  processingFailed: 'Käsittely epäonnistui.',
  pdfPageFailed: 'PDF-sivun lisääminen epäonnistui.',
  pdfBuildFailed: 'PDF:n luonti epäonnistui.',
  closeErrorsAria: 'Sulje virheilmoitukset',
  closeBtn: 'Sulje',

  footerPrivacy: 'Yksityinen — kuvat pysyvät laitteellasi. Ei evästeitä.',
  footerOpenSource: 'Avoin lähdekoodi:',
  footerLicense: 'MIT-lisenssi',

  pdfFilename: (n) => `kuvankasittely-${n}-kuvaa.pdf`,
  downloadSuffix: 'kuvankasittely',
};

const en: Strings = {
  brandName: 'Colibrious',
  brandTld: '.com',
  brandFull: 'Colibrious',
  ogTitle: 'Colibrious — fast, private image conversion in a wingbeat',

  heroLeft: 'Image conversion,',
  heroAccent: 'in a wingbeat.',
  heroDescriptionLine1: 'Edit, resize, rotate, convert to PDF, add watermarks.',
  heroDescriptionLine2: 'All in your browser. No sign-up. Works offline.',
  privacyBadgeShort: 'Private',
  privacyBadgeFull: 'Private — your images stay on your device. Works offline.',
  chipNoCookies: 'No cookies',
  chipNoUploads: 'No uploads',
  chipOpenSource: 'Open source (MIT)',

  downloadAll: 'Download all',
  downloadAllShort: (n) => `Download all (${n})`,
  asPdf: 'as PDF',
  pdfShort: 'PDF',
  buildingPdf: 'Building PDF…',
  combinePdfTitle: 'Combine all images into one PDF',

  dropOverlay: 'Drop images anywhere',
  dropOverlayHelp: 'PNG, JPEG or WebP',

  dropImagesHere: 'Drop images here',
  dropImagesHelp: 'PNG, JPEG or WebP — up to 50 MB per file.',
  selectFiles: 'Select files',
  selectImagesAria: 'Select images',

  settingsTitle: 'Settings',
  appliesToAll: 'Applies to all images.',
  outputFormat: 'Output format',
  setExactDimensions: 'Set exact dimensions',
  batchWidthAria: 'Batch width',
  batchHeightAria: 'Batch height',
  unlockAspect: 'Unlock aspect ratio',
  lockAspect: 'Lock aspect ratio',
  orFitLongestSide: 'Or fit longest side',
  longestSideAria: 'Longest side in pixels',
  applyBtn: 'Apply',
  fitDescription:
    "Scales each image so its longest side matches the value. Aspect ratio is preserved.",
  filters: 'Filters',
  grayscale: 'Grayscale',
  sepia: 'Sepia',
  quality: 'Quality',
  brightness: 'Brightness',
  watermark: 'Watermark',
  watermarkPlaceholder: 'Watermark text…',
  watermarkAria: 'Watermark text',
  qualityAria: 'Compression quality',
  brightnessAria: 'Brightness',
  clear: 'Clear',
  lossless: 'Lossless',

  free: 'Free',
  cropApply: 'Apply',
  cropCancel: 'Cancel',
  cropHandleAria: (mode) => `Crop handle ${mode}`,
  downloadImageAria: 'Download image',
  downloadImageTitle: 'Download',
  removeImageAria: 'Remove image',
  removeImageTitle: 'Remove',
  adjustAria: 'Adjust',
  rotateAria: 'Rotate 90 degrees',
  rotateTitle: 'Rotate 90°',
  flipHorizontalLabel: 'Flip horizontal',
  flipVerticalLabel: 'Flip vertical',
  cropLabel: 'Crop',
  format: 'Format',
  qualityShort: 'Quality',
  compressionQualityAria: 'Compression quality',

  installSection: 'Install the app',
  iphoneSafariTitle: 'iPhone · Safari',
  androidChromeTitle: 'Android · Chrome / Edge',
  androidChromeCopy:
    'Open the page in Chrome or Edge on Android. When the browser is ready, use the button below for native install.',
  installAppBtn: 'Install Colibrious',
  installing: 'Installing…',

  installBannerText: 'Install the app on your phone',
  installBannerCloseAria: 'Close install banner',

  unsupportedFileType: 'Unsupported file type. Accepted: PNG, JPEG, WebP.',
  fileTooLarge: (mb) => `File too large (${mb} MB). Limit 50 MB.`,
  decodeFailed: 'Image decode failed.',
  processingFailed: 'Processing failed.',
  pdfPageFailed: 'Adding PDF page failed.',
  pdfBuildFailed: 'PDF creation failed.',
  closeErrorsAria: 'Close errors',
  closeBtn: 'Close',

  footerPrivacy: 'Private — your images stay on your device. No cookies.',
  footerOpenSource: 'Open source:',
  footerLicense: 'MIT licensed',

  pdfFilename: (n) => `colibrious-${n}-images.pdf`,
  downloadSuffix: 'colibrious',
};

export const STRINGS: Record<Locale, Strings> = { fi, en };
