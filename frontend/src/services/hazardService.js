const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getHazardZones = async ({
  type,
  size = 100,
} = {}) => {
  let page = 0;
  let allHazards = [];
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("size", size);

    if (type) {
      params.append("type", type);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/hazard-zones?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch hazard zones");
    }

    const data = await response.json();

    allHazards = [...allHazards, ...data.content];

    hasMore = !data.last;
    page++;
  }

  return allHazards;
};