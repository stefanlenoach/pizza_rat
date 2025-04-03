import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the map tab by default
  return <Redirect href="/map" />;
}
