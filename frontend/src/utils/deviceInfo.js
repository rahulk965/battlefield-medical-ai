export const getBatteryLevel = async () => {
  try {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      return battery.level;
    }
    return null;
  } catch (error) {
    console.warn('Battery API not supported:', error);
    return null;
  }
};