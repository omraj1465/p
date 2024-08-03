export const formatReportData = (views, daysAgo) => {
  const report = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - daysAgo);

  // Helper function to format a date as "1 Jul"
  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

  // Create an array of dates from fifteenDaysAgo to today
  const dates = [];
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  // Create a map to store counts for each date
  const counts = dates.reduce((acc, date) => {
    const dateStr = formatDate(date);
    acc[dateStr] = 0;
    return acc;
  }, {});

  // Count the views per date
  let totalCount = 0;
  views.forEach((view) => {
    const viewDate = new Date(view.viewedAt);
    const dateStr = formatDate(viewDate);
    if (counts.hasOwnProperty(dateStr)) {
      counts[dateStr] += 1;
      totalCount += 1;
    }
  });

  // Transform the counts map into the report format
  for (const [dateStr, count] of Object.entries(counts)) {
    report.push({
      date: dateStr,
      count: count,
    });
  }
  console.log("report => ", report);
  return {
    report,
    totalCount,
  };
};

export function extractTaggedUsernames(content) {
  const regex = /<a\s+(?:[^>]*?\s+)?href="[^"]*\/user\/([^"]+)"[^>]*>/g;
  const matches = content.matchAll(regex);
  return [...new Set([...matches].map((match) => match[1]))];
}
