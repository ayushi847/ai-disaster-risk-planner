const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getRelocationSites = async ({
  size = 100,
} = {}) => {
  let page = 0;
  let allSites = [];
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("size", size);

    const response = await fetch(
      `${API_BASE_URL}/api/relocation-sites?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch relocation sites");
    }

    const data = await response.json();

    allSites = [...allSites, ...data.content];

    hasMore = !data.last;
    page++;
  }

  return allSites;
};


export const getNearbyRelocationSites = async (
  villageId,
  radiusKm = 50
) => {
  const params = new URLSearchParams();

  params.append("radiusKm", radiusKm);

  const response = await fetch(
    `${API_BASE_URL}/api/relocation-sites/near/${villageId}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch nearby relocation sites");
  }

  return response.json();
};