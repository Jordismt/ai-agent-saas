import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addDays, startOfWeek, shiftMonth, calendarDays, groupBookings } from "../src/modules/bookings/presentation/calendar/calendarDates.js";

describe("Calendar presentation dates",()=>{
 it("moves days across leap years and year boundaries",()=>{
  assert.equal(addDays("2024-02-28",1),"2024-02-29");
  assert.equal(addDays("2026-12-31",1),"2027-01-01");
  assert.equal(addDays("2026-01-01",-1),"2025-12-31");
 });
 it("starts weeks on Monday including Sunday",()=>{
  assert.equal(startOfWeek("2026-10-04"),"2026-09-28");
  assert.equal(startOfWeek("2026-10-05"),"2026-10-05");
 });
 it("clamps month navigation without skipping February",()=>{
  assert.equal(shiftMonth("2026-01-31",1),"2026-02-28");
  assert.equal(shiftMonth("2024-03-31",-1),"2024-02-29");
 });
 it("shows full weeks and a complete 42-day month",()=>{
  assert.deepEqual(calendarDays("2026-10-03","day"),["2026-10-03"]);
  assert.equal(calendarDays("2026-10-03","week").length,7);
  assert.equal(calendarDays("2026-10-03","month").length,42);
 });
 it("groups by business timezone while preserving instants, statuses and employees",()=>{
  const bookings=[{id:"b",starts_at:"2026-10-03T22:30:00Z",employee_id:"ana",status:"cancelled"},{id:"a",starts_at:"2026-10-03T22:00:00Z",employee_id:"laura",status:"confirmed"}];
  const original=JSON.stringify(bookings);
  const dateKey=date=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Madrid"}).format(new Date(date));
  const grouped=groupBookings(bookings,dateKey);
  assert.deepEqual(grouped.get("2026-10-04").map(b=>b.id),["a","b"]);
  assert.equal(JSON.stringify(bookings),original);
 });
 it("respects daylight saving transitions without duplicating bookings",()=>{
  const bookings=[{id:"a",starts_at:"2026-10-25T00:30:00Z"},{id:"b",starts_at:"2026-10-25T01:30:00Z"}];
  const dateKey=date=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Madrid"}).format(new Date(date));
  assert.equal(groupBookings(bookings,dateKey).get("2026-10-25").length,2);
 });
 it("supports an empty agenda",()=>assert.equal(groupBookings([],()=>null).size,0));
});
