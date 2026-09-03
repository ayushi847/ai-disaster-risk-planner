const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getDashboardSummary = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard/summary`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard summary");
  }

  return response.json();
};