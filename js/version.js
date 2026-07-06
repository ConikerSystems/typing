/* Single source of truth for the app version. Shown in the footer (home screen
   and About page) so a user can report which build they're on, and you can tell
   whether they're on the latest. Bump this on every deploy (and keep the ?v=
   query strings in index.html + CACHE_NAME in sw.js in lockstep). */
window.APP_VERSION = "1.3.0";
