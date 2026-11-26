import AimeApp from "@/components/AimeApp";
import { PrefsProvider } from "@/lib/prefs";
import { AimeProvider } from "@/lib/store";

export default function HomePage() {
  return (
    <PrefsProvider>
      <AimeProvider>
        <AimeApp />
      </AimeProvider>
    </PrefsProvider>
  );
}
