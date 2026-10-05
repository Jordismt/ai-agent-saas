// In-memory PostgREST boundary: exercises real repository filters and CAS writes.
export function billingDatabase(tables) {
  const calls = [];
  const failures = [];
  return {
    tables,
    calls,
    failures,
    from(table) {
      const filters = [];
      let operation = "read",
        payload,
        options;
      const query = {
        select() {
          return query;
        },
        eq(key, value) {
          filters.push((row) => row[key] === value);
          return query;
        },
        is(key, value) {
          filters.push((row) => (row[key] ?? null) === value);
          return query;
        },
        order() {
          return query;
        },
        update(value) {
          operation = "update";
          payload = value;
          return query;
        },
        upsert(value, opts) {
          operation = "upsert";
          payload = value;
          options = opts;
          return query;
        },
        async execute(single) {
          calls.push({ table, operation, payload, options });
          const failure = failures.findIndex(
            (f) => f.table === table && f.operation === operation,
          );
          if (failure >= 0)
            return { data: null, error: failures.splice(failure, 1)[0].error };
          const rows = (tables[table] ||= []);
          let result = rows.filter((row) =>
            filters.every((matches) => matches(row)),
          );
          if (operation === "update")
            result.forEach((row) => Object.assign(row, payload));
          if (operation === "upsert") {
            const existing = rows.find(
              (row) => row.business_id === payload.business_id,
            );
            if (existing && options.ignoreDuplicates) result = [];
            else if (existing) {
              Object.assign(existing, payload);
              result = [existing];
            } else {
              const added = { ...payload };
              rows.push(added);
              result = [added];
            }
          }
          return {
            data: single
              ? result[0]
                ? { ...result[0] }
                : null
              : result.map((row) => ({ ...row })),
            error: null,
          };
        },
        maybeSingle() {
          return query.execute(true);
        },
        single() {
          return query.execute(true);
        },
        then(resolve, reject) {
          return query.execute(false).then(resolve, reject);
        },
      };
      return query;
    },
  };
}
