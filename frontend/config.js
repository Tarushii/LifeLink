// Public configuration only. Never add AWS credentials or an app client secret.
window.LIFELINK_CONFIG = Object.freeze({
  region: '',
  userPoolId: '',
  clientId: '',
  cognitoDomain: '', // e.g. https://lifelink-example.auth.ap-south-1.amazoncognito.com
  redirectUri: 'http://localhost:5500/',
  logoutUri: 'http://localhost:5500/'
});
