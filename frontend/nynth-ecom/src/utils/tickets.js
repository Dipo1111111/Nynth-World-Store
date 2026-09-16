export const isTicket = (product) => product?.category === "tickets";

export const isTicketItem = (item) => item?.category === "tickets";

const LAGOS_TIMEZONE = "Africa/Lagos";

export const eventHasPassed = (eventDateTime) => {
  if (!eventDateTime) return false;
  const date = new Date(eventDateTime);
  return !isNaN(date.getTime()) && date.getTime() < Date.now();
};

export const formatEventDate = (eventDateTime) => {
  if (!eventDateTime) return "DATE TBC";
  const date = new Date(eventDateTime);
  if (isNaN(date.getTime())) return "DATE TBC";
  try {
    return date
      .toLocaleString("en-GB", {
        timeZone: LAGOS_TIMEZONE,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  } catch (error) {
    return "DATE TBC";
  }
};

export const formatEventDateParts = (eventDateTime) => {
  if (!eventDateTime) return { date: "DATE TBC", time: "" };
  const date = new Date(eventDateTime);
  if (isNaN(date.getTime())) return { date: "DATE TBC", time: "" };
  try {
    return {
      date: date
        .toLocaleDateString("en-GB", {
          timeZone: LAGOS_TIMEZONE,
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        .toUpperCase(),
      time: date
        .toLocaleTimeString("en-GB", {
          timeZone: LAGOS_TIMEZONE,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toUpperCase(),
    };
  } catch (error) {
    return { date: "DATE TBC", time: "" };
  }
};

export const ticketCount = (items = []) =>
  items.reduce((total, item) => (isTicketItem(item) ? total + (item.quantity || 1) : total), 0);

export const hasTickets = (items = []) => items.some((item) => isTicketItem(item));

export const hasPhysicalItems = (items = []) => items.some((item) => !isTicketItem(item));

export const nonTicketSubtotal = (items = []) =>
  items.reduce(
    (total, item) => (isTicketItem(item) ? total : total + (item.price || 0) * (item.quantity || 1)),
    0
  );