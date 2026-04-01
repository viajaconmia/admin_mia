const toRad = (value: number) => (value * Math.PI) / 180;

function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Radio de la Tierra en metros

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function filterWithinRadius<
  T extends { address: { location: { lat: number; lng: number } } },
>(items: T[], center: [number, number], radius: number): T[] {
  return items.filter((item) => {
    const { lat, lng } = item.address.location;

    const distance = getDistanceInMeters(center[0], center[1], lat, lng);

    return distance <= radius;
  });
}
