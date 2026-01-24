export function readInitialPageFromPath(): number | null {
  const match = window.location.pathname.match(/\/page\/(\d+)\/?$/);
  if (!match) return null;
  const num = Number.parseInt(match[1]!, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export function updateUrl(nextState: {
  query: string;
  sort: string;
  employment: string[];
  interview: string[];
  perPage: number;
  page: number;
}) {
  const next = new URL(window.location.href);
  next.pathname = "/";

  if (nextState.query.trim())
    next.searchParams.set("q", nextState.query.trim());
  else next.searchParams.delete("q");

  next.searchParams.set("sort", nextState.sort);

  if (nextState.employment.length > 0) {
    next.searchParams.set("employment", nextState.employment.join(","));
  } else {
    next.searchParams.delete("employment");
  }

  if (nextState.interview.length > 0) {
    next.searchParams.set("interview", nextState.interview.join(","));
  } else {
    next.searchParams.delete("interview");
  }

  next.searchParams.set("perPage", String(nextState.perPage));
  next.searchParams.set("page", String(nextState.page));

  window.history.replaceState({}, "", next);
}
