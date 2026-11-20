export type SharedState = Record<string, unknown>;

type SharedRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is SharedRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const records = (value: unknown): SharedRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const invalidUpdate: () => never = () => {
  throw new Error("Invalid member state update");
};

const requiredText = (value: unknown, maxLength: number) => {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) invalidUpdate();
  return value;
};

const optionalText = (value: unknown, maxLength: number) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maxLength) invalidUpdate();
  return value;
};

const validDate = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalidUpdate();
  return value;
};

/** Session-specific users and credentials never belong in the shared JSON row. */
export function prepareSharedState(raw: SharedState): SharedState {
  return Object.fromEntries(
    Object.entries(raw).filter(([key]) => key !== "users" && key !== "currentUserId"),
  );
}

/** Return only the shared information a regular member is allowed to read. */
export function filterSharedStateForMember(raw: SharedState, userId: string): SharedState {
  const state = prepareSharedState(structuredClone(raw));
  const schedules = records(state.schedules).flatMap((schedule) => {
    const assignments = records(schedule.assignments).filter(
      (assignment) => assignment.userId === userId,
    );
    return assignments.length ? [{ ...schedule, assignments }] : [];
  });

  return {
    ...state,
    removedUserIds: [],
    schedules,
    unavailability: records(state.unavailability).filter((item) => item.userId === userId),
    notifications: records(state.notifications).filter((item) => item.userId === userId),
    mediaRequests: [],
    mediaMessages: [],
    prayers: records(state.prayers).filter(
      (prayer) => prayer.isPrivate !== true || prayer.authorId === userId,
    ),
    contacts: [],
    googleCalendarId: "",
    googleApiKey: "",
    syncGoogleCalendar: false,
  };
}

function mergeScheduleResponses(current: unknown, incoming: unknown, userId: string) {
  const incomingById = new Map(
    records(incoming)
      .filter((schedule) => typeof schedule.id === "string")
      .map((schedule) => [schedule.id as string, schedule]),
  );

  return records(current).map((schedule) => {
    const submitted = typeof schedule.id === "string" ? incomingById.get(schedule.id) : undefined;
    if (!submitted) return schedule;
    const submittedAssignments = records(submitted.assignments);

    return {
      ...schedule,
      assignments: records(schedule.assignments).map((assignment) => {
        if (assignment.userId !== userId) return assignment;
        const response = submittedAssignments.find(
          (candidate) =>
            candidate.userId === userId &&
            candidate.ministry === assignment.ministry &&
            candidate.role === assignment.role,
        );
        const status = response?.status;
        return status === "pending" || status === "confirmed" || status === "declined"
          ? { ...assignment, status }
          : assignment;
      }),
    };
  });
}

function ownUnavailability(incoming: unknown, userId: string) {
  if (!Array.isArray(incoming) || incoming.length > 366) invalidUpdate();
  return incoming.map((value) => {
    if (!isRecord(value) || value.userId !== userId) invalidUpdate();
    const start = validDate(value.start);
    const end = validDate(value.end);
    if (end < start) invalidUpdate();
    const reason = optionalText(value.reason, 500);
    return {
      id: requiredText(value.id, 100),
      userId,
      start,
      end,
      ...(reason ? { reason } : {}),
    };
  });
}

function ownNotifications(incoming: unknown, userId: string) {
  if (!Array.isArray(incoming) || incoming.length > 200) invalidUpdate();
  return incoming.map((value) => {
    if (!isRecord(value) || value.userId !== userId || typeof value.read !== "boolean") {
      invalidUpdate();
    }
    if (value.type !== "schedule" && value.type !== "notice" && value.type !== "media") {
      invalidUpdate();
    }
    if (value.link !== "schedules" && value.link !== "notices" && value.link !== "media") {
      invalidUpdate();
    }
    return {
      id: requiredText(value.id, 100),
      userId,
      type: value.type,
      title: requiredText(value.title, 200),
      body: requiredText(value.body, 1000),
      link: value.link,
      refId: requiredText(value.refId, 100),
      date: requiredText(value.date, 50),
      read: value.read,
    };
  });
}

function mergedPrayedBy(current: SharedRecord, incoming: SharedRecord, userId: string) {
  const currentIds = Array.isArray(current.prayedBy)
    ? current.prayedBy.filter((id): id is string => typeof id === "string")
    : [];
  const incomingIds = Array.isArray(incoming.prayedBy) ? incoming.prayedBy : [];
  const wantsToPray = incomingIds.includes(userId);
  const others = currentIds.filter((id) => id !== userId);
  return wantsToPray ? [...others, userId] : others;
}

function ownPrayer(value: SharedRecord, userId: string, existing?: SharedRecord): SharedRecord {
  if (value.authorId !== userId) invalidUpdate();
  if (value.status !== "novo" && value.status !== "orando" && value.status !== "respondido") {
    invalidUpdate();
  }
  return {
    id: requiredText(value.id, 100),
    authorId: userId,
    authorName: existing?.authorName ?? requiredText(value.authorName, 120),
    title: requiredText(value.title, 120),
    content: requiredText(value.content, 1000),
    status: value.status,
    isPrivate: value.isPrivate === true,
    date: existing?.date ?? validDate(value.date),
    prayedBy: existing ? mergedPrayedBy(existing, value, userId) : [],
  };
}

function mergePrayers(current: unknown, incoming: unknown, userId: string) {
  if (!Array.isArray(incoming) || incoming.length > 1000) invalidUpdate();
  const submitted = incoming.map((value) => {
    if (!isRecord(value) || typeof value.id !== "string") invalidUpdate();
    return value;
  });
  const incomingById = new Map(submitted.map((prayer) => [prayer.id as string, prayer]));
  const currentPrayers = records(current);
  const currentIds = new Set(currentPrayers.map((prayer) => prayer.id));

  const merged = currentPrayers.flatMap((prayer) => {
    const id = typeof prayer.id === "string" ? prayer.id : "";
    const incomingPrayer = incomingById.get(id);
    if (!incomingPrayer) return prayer.authorId === userId ? [] : [prayer];
    if (prayer.authorId === userId) {
      return [ownPrayer(incomingPrayer, userId, prayer)];
    }
    return [{ ...prayer, prayedBy: mergedPrayedBy(prayer, incomingPrayer, userId) }];
  });

  for (const prayer of submitted) {
    if (!currentIds.has(prayer.id) && prayer.authorId === userId) {
      merged.push(ownPrayer(prayer, userId));
    }
  }
  return merged;
}

/**
 * Merge a regular member submission into the authoritative state. Only their
 * schedule responses, availability, notifications and permitted prayer changes
 * are accepted; every leadership-owned field remains unchanged.
 */
export function mergeMemberSharedState(
  currentRaw: SharedState,
  incomingRaw: SharedState,
  userId: string,
): SharedState {
  const current = prepareSharedState(currentRaw);
  const incoming = prepareSharedState(incomingRaw);
  const merged: SharedState = {
    ...current,
    schedules: mergeScheduleResponses(current.schedules, incoming.schedules, userId),
    prayers: mergePrayers(current.prayers, incoming.prayers ?? [], userId),
  };

  if (incoming.unavailability !== undefined) {
    const own = ownUnavailability(incoming.unavailability, userId);
    merged.unavailability = [
      ...records(current.unavailability).filter((item) => item.userId !== userId),
      ...own,
    ];
  }

  if (incoming.notifications !== undefined) {
    const own = ownNotifications(incoming.notifications, userId);
    merged.notifications = [
      ...records(current.notifications).filter((item) => item.userId !== userId),
      ...own,
    ];
  }

  return merged;
}
