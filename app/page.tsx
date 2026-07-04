import { loadGridData } from "@/lib/data/loadGridData";
import GridDashboard from "@/components/dashboard/GridDashboard";

export const revalidate = 300;

export default async function Home() {
  const data = await loadGridData();
  return <GridDashboard data={data} />;
}
