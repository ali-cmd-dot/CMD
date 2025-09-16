import Head from 'next/head';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <>
      <Head>
        <title>Analytics Dashboard - Company Metrics</title>
        <meta name="description" content="Professional analytics dashboard for tracking alerts, misalignments, and issue resolution" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <Dashboard />
      </main>
    </>
  );
}
