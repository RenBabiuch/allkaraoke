import PageLoader from 'modules/Elements/PageLoader';
import { ComponentProps, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';

const LazyConvert = lazy(() =>
  import('routes/ManageSongs/SongManagement').then((modules) => {
    return { default: modules.Convert };
  }),
);

const Convert = (props: ComponentProps<typeof LazyConvert>) => (
  <Suspense fallback={<PageLoader />}>
    <Helmet>
      <title>Convert Song | AllKaraoke.Party - Free Online Karaoke Party Game</title>
    </Helmet>
    <LazyConvert {...props} />
  </Suspense>
);

export default Convert;
