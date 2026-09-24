import Dashboard from "@/components/dashboard";
import { listPlans } from "@/lib/store";

export default function Home() { return <Dashboard initialPlans={listPlans()} />; }
