const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getVillages = async ({
  district,
  riskLevel,
  priority,
  size = 100,
} = {}) => {
  let page = 0;
  let allVillages = [];
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("size", size);

    if (district) {
      params.append("district", district);
    }

    if (riskLevel) {
      params.append("riskLevel", riskLevel);
    }

    if (priority) {
      params.append("priority", priority);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/villages?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch villages");
    }

    const data = await response.json();

    allVillages = [...allVillages, ...data.content];

    hasMore = !data.last;
    page++;
  }

  return allVillages;
};


export const getVillageById = async (villageId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/villages/${villageId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch village details");
  }

  return response.json();
};