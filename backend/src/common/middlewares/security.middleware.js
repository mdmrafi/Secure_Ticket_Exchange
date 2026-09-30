import helmet from 'helmet';
import hpp from 'hpp';

export const configureSecurityHeaders = () => {
  return [
    helmet({
      contentSecurityPolicy: false, // adjust when static HTML/scripts are served
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
    hpp(),
  ];
};
