import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  filterSharedStateForMember,
  mergeMemberSharedState,
  prepareSharedState,
} from "./shared-state-access";

const memberId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";

const current = {
  users: [{ id: memberId, email: "private@example.com" }],
  currentUserId: memberId,
  schedules: [
    {
      id: "schedule-1",
      title: "Sunday service",
      assignments: [
        { userId: memberId, ministry: "Louvor", role: "Singer", status: "pending" },
        { userId: otherId, ministry: "Staff", role: "Greeter", status: "pending" },
      ],
    },
  ],
  events: [{ id: "event-1", title: "Prayer night" }],
  contacts: [{ id: "contact-1", phone: "123" }],
  unavailability: [{ id: "u1", userId: otherId, start: "2026-11-01", end: "2026-11-02" }],
  notifications: [{ id: "n1", userId: otherId, read: false }],
  mediaRequests: [{ id: "m1" }],
  mediaMessages: [{ id: "mm1" }],
  prayers: [
    {
      id: "p1",
      authorId: otherId,
      authorName: "Other",
      title: "Public",
      content: "Public request",
      status: "novo",
      isPrivate: false,
      date: "2026-11-01",
      prayedBy: [],
    },
    {
      id: "p2",
      authorId: otherId,
      authorName: "Other",
      title: "Private",
      content: "Secret request",
      status: "novo",
      isPrivate: true,
      date: "2026-11-01",
      prayedBy: [],
    },
  ],
  googleCalendarId: "calendar-id",
  googleApiKey: "secret-key",
  syncGoogleCalendar: true,
};

describe("shared state access", () => {
  test("removes session data from persisted state", () => {
    assert.equal(prepareSharedState(current).users, undefined);
    assert.equal(prepareSharedState(current).currentUserId, undefined);
  });

  test("hides leadership-only and other members' private data", () => {
    const filtered = filterSharedStateForMember(current, memberId);
    assert.deepEqual(filtered.contacts, []);
    assert.deepEqual(filtered.mediaRequests, []);
    assert.equal(filtered.googleApiKey, "");
    assert.equal((filtered.prayers as unknown[]).length, 1);
    assert.equal((filtered.schedules as unknown[]).length, 1);
    assert.equal(
      (filtered.schedules as Array<{ assignments: unknown[] }>)[0].assignments.length,
      1,
    );
    assert.deepEqual(filtered.unavailability, []);
    assert.deepEqual(filtered.notifications, []);
  });

  test("accepts only the member's schedule response and preserves leadership fields", () => {
    const authoritative = structuredClone(current);
    const incoming = filterSharedStateForMember(authoritative, memberId);
    const incomingSchedules = incoming.schedules as Array<Record<string, unknown>>;
    incomingSchedules[0].title = "Tampered title";
    (incomingSchedules[0].assignments as Array<Record<string, unknown>>)[0].status = "confirmed";
    incoming.contacts = [{ id: "fake", phone: "attacker" }];
    incoming.unavailability = [
      { id: "u2", userId: memberId, start: "2026-12-01", end: "2026-12-03" },
    ];

    const merged = mergeMemberSharedState(authoritative, incoming, memberId);
    const schedules = merged.schedules as Array<Record<string, unknown>>;
    assert.equal(schedules[0].title, "Sunday service");
    assert.deepEqual(schedules[0].assignments, [
      { userId: memberId, ministry: "Louvor", role: "Singer", status: "confirmed" },
      { userId: otherId, ministry: "Staff", role: "Greeter", status: "pending" },
    ]);
    assert.deepEqual(merged.contacts, authoritative.contacts);
    assert.deepEqual(merged.unavailability, [
      authoritative.unavailability[0],
      { id: "u2", userId: memberId, start: "2026-12-01", end: "2026-12-03" },
    ]);
  });

  test("allows prayer participation without changing another author's request", () => {
    const authoritative = structuredClone(current);
    const incoming = filterSharedStateForMember(authoritative, memberId);
    const prayer = (incoming.prayers as Array<Record<string, unknown>>)[0];
    prayer.status = "respondido";
    prayer.prayedBy = [memberId];

    const merged = mergeMemberSharedState(authoritative, incoming, memberId);
    const prayers = merged.prayers as Array<Record<string, unknown>>;
    assert.equal(prayers[0].status, "novo");
    assert.deepEqual(prayers[0].prayedBy, [memberId]);
    assert.equal(prayers[1].title, "Private");
  });

  test("rejects availability submitted for another member", () => {
    const incoming = filterSharedStateForMember(current, memberId);
    incoming.unavailability = [
      { id: "bad", userId: otherId, start: "2026-12-01", end: "2026-12-03" },
    ];
    assert.throws(
      () => mergeMemberSharedState(current, incoming, memberId),
      /Invalid member state update/,
    );
  });
});
