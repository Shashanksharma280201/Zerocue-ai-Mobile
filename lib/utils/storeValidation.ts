interface OpenHours {
  [day: string]: {
    open: string; // "09:00"
    close: string; // "21:00"
    closed?: boolean;
  };
}

interface Store {
  id: string;
  name: string;
  open_hours?: OpenHours | any;
}

/**
 * Check if a store is currently open
 */
export function isStoreOpen(store: Store): boolean {
  if (!store.open_hours) {
    // If no hours specified, assume open 24/7
    return true;
  }

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];

  const hours = store.open_hours[currentDay];

  if (!hours || hours.closed) {
    return false;
  }

  const currentTime = formatTime(now.getHours(), now.getMinutes());
  const openTime = hours.open;
  const closeTime = hours.close;

  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Get the status text for a store
 */
export function getStoreStatus(store: Store): 'Open' | 'Closed' | 'Open 24/7' {
  if (!store.open_hours) {
    return 'Open 24/7';
  }

  return isStoreOpen(store) ? 'Open' : 'Closed';
}

/**
 * Get closing time for today
 */
export function getClosingTime(store: Store): string | null {
  if (!store.open_hours) {
    return null;
  }

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];

  const hours = store.open_hours[currentDay];

  if (!hours || hours.closed) {
    return null;
  }

  return hours.close;
}

/**
 * Get opening time for today
 */
export function getOpeningTime(store: Store): string | null {
  if (!store.open_hours) {
    return null;
  }

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];

  const hours = store.open_hours[currentDay];

  if (!hours || hours.closed) {
    return null;
  }

  return hours.open;
}

/**
 * Format time as HH:MM
 */
function formatTime(hours: number, minutes: number): string {
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Get human-readable store hours text
 */
export function getStoreHoursText(store: Store): string {
  if (!store.open_hours) {
    return 'Open 24/7';
  }

  const status = getStoreStatus(store);

  if (status === 'Open') {
    const closingTime = getClosingTime(store);
    if (closingTime) {
      return `Open until ${formatDisplayTime(closingTime)}`;
    }
    return 'Open now';
  }

  const openingTime = getOpeningTime(store);
  if (openingTime) {
    return `Opens at ${formatDisplayTime(openingTime)}`;
  }

  return 'Closed today';
}

/**
 * Format time for display (e.g., "09:00" -> "9:00 AM")
 */
function formatDisplayTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return time;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Validate if user should be warned about store status
 */
export function shouldWarnAboutStoreStatus(store: Store): {
  shouldWarn: boolean;
  message?: string;
} {
  if (!store.open_hours) {
    return { shouldWarn: false };
  }

  if (!isStoreOpen(store)) {
    return {
      shouldWarn: true,
      message: `${store.name} is currently closed. You can still browse products but won't be able to complete checkout at this location.`,
    };
  }

  // Check if closing soon (within 30 minutes)
  const closingTime = getClosingTime(store);
  if (closingTime) {
    const now = new Date();
    const [closeHours, closeMinutes] = closingTime.split(':').map(Number);
    const closeDate = new Date(now);
    closeDate.setHours(closeHours, closeMinutes, 0, 0);

    const minutesUntilClose = (closeDate.getTime() - now.getTime()) / (1000 * 60);

    if (minutesUntilClose > 0 && minutesUntilClose <= 30) {
      return {
        shouldWarn: true,
        message: `${store.name} closes in ${Math.round(minutesUntilClose)} minutes. Please complete your shopping soon.`,
      };
    }
  }

  return { shouldWarn: false };
}
