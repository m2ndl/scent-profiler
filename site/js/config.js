/* Deployment settings: the one file to edit when the site goes live. */
window.PP_CONFIG = {
  /* Google Apps Script web-app URL (see backend/apps-script.gs). Leave "" to keep ratings on this device only. */
  endpoint: "",
  /* Where "try a sample" and "full bottle" links go. {q} is replaced by the perfume name, {lang} by the page
     language (ar or en).
     Replace with a partner shop's search URL plus your coupon or affiliate parameter. */
  links: {
    sampleSA: "https://www.google.com/search?q={q}+%D8%B9%D9%8A%D9%86%D8%A9+%D8%B9%D8%B7%D8%B1",
    sampleUS: "https://www.decantx.com/search?q={q}",
    bottle:   "https://www.google.com/search?q={q}+eau+de+parfum"
  },
  /* The statement the partner program behind these links requires, shown in every page's footer. "" for none. */
  disclosure: { en: "", ar: "" }
};
