export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['tokens', 'css', 'angular', 'catalog', 'repo']],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
