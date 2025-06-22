
export const getDomainConfig = () => {
  const hostname = window.location.hostname;
  
  // Check if we're on the main app domain
  const isAppDomain = hostname.includes('app.') || 
                     hostname === 'localhost' || 
                     hostname.includes('127.0.0.1') ||
                     hostname.includes('lovableproject.com');
  
  // Check if we're on the landing domain
  const isLandingDomain = hostname.includes('www.') || 
                         hostname === 'strataige.cc' ||
                         isAppDomain; // For development, allow both
  
  return {
    isAppDomain,
    isLandingDomain,
    hostname,
    appDomain: process.env.VITE_APP_DOMAIN || 'app.strataige.cc',
    landingDomain: process.env.VITE_LANDING_DOMAIN || 'www.strataige.cc'
  };
};

export const redirectToAppDomain = () => {
  const config = getDomainConfig();
  if (!config.isAppDomain && config.appDomain !== window.location.hostname) {
    window.location.href = `https://${config.appDomain}${window.location.pathname}`;
  }
};

export const redirectToLandingDomain = () => {
  const config = getDomainConfig();
  if (!config.isLandingDomain && config.landingDomain !== window.location.hostname) {
    window.location.href = `https://${config.landingDomain}${window.location.pathname}`;
  }
};
